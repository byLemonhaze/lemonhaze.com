import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {viewingMode} from '../src/immersive/model.js';

test('the first-paint mode matches routing before the catalogue loads',async()=>{
    const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
    const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
    for(const path of ['/','/?view=explore','/?view=gallery','/?view=website','/about','/gentlemen','/?a=abc','/?view=invalid','/index.html']){
        const url=new URL(path,'https://lemonhaze.com'),document={documentElement:{dataset:{}}};
        vm.runInNewContext(script,{URL,location:{href:url.href},document});
        assert.equal(document.documentElement.dataset.view,viewingMode(url),path);
    }
});

test('refresh keeps the selected label readable before and during delayed viewer loading',{timeout:60000},async()=>{
    const {createServer}=await import('node:http');
    const {resolve,extname}=await import('node:path');
    const {chromium}=await import('playwright');
    const dist=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
    const server=createServer(async(req,res)=>{try{
        const path=new URL(req.url,'http://localhost').pathname,file=resolve(dist,'.'+(path==='/'?'/index.html':path));
        if(!file.startsWith(dist+'/'))throw Error();
        res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end();}});
    await new Promise(done=>server.listen(0,'127.0.0.1',done));
    const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch();
    try{
        for(const theme of ['paper','black'])for(const mode of ['explore','gallery','website']){
            const page=await browser.newPage();
            await page.addInitScript(theme=>localStorage.setItem('lh-presentation',theme),theme);
            let releaseMain,releaseViewer,viewerRequested;
            const mainGate=new Promise(r=>releaseMain=r),viewerGate=new Promise(r=>releaseViewer=r);
            const viewerStarted=new Promise(r=>viewerRequested=r);
            await page.route('**/*',async route=>{
                const url=new URL(route.request().url());
                if(url.origin!==origin)return route.fulfill({status:503,body:''});
                if(/\/main-[^/]+\.js$/.test(url.pathname))await mainGate;
                if(/\/experience-[^/]+\.js$/.test(url.pathname)){viewerRequested();await viewerGate;}
                return route.continue();
            });
            try{
                await page.goto(origin+'/?view='+mode,{waitUntil:'commit'});
                const selected=page.locator(`#view-switch a[data-view=${mode}]`);
                await selected.waitFor();
                // Navigation commit precedes render-blocking CSS on a cold CI
                // cache. Wait for styles, while keeping application JS blocked.
                await page.waitForFunction(()=>{const links=[...document.querySelectorAll('link[rel=stylesheet]')];return links.length>0&&links.every(link=>link.sheet);});
                const check=async()=>{
                    // Resolve the anchor and its nav in one browser task: hydration
                    // can replace the prerendered anchor between locator commands.
                    const actual=await page.evaluate(mode=>{const a=document.querySelector(`#view-switch a[data-view=${mode}]`);return {color:getComputedStyle(a).color,index:getComputedStyle(a.closest('nav')).getPropertyValue('--mode-index').trim(),transition:getComputedStyle(a).transitionDuration};},mode);
                    assert.equal(actual.color,theme==='black'?'rgb(36, 36, 36)':'rgb(247, 247, 240)',`${theme} ${mode} label`);
                    assert.equal(actual.index,String(['explore','gallery','website'].indexOf(mode)));
                    assert.equal(actual.transition,'0s');
                };
                await check();releaseMain();
                if(mode!=='website'){
                    await viewerStarted;
                    await page.waitForFunction(mode=>document.querySelector('#view-switch [aria-current]')?.dataset.view===mode,mode);
                    await check();
                }
                releaseViewer();await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
                assert.equal(await selected.getAttribute('aria-current'),'page');
            }finally{releaseMain();releaseViewer();await page.close();}
        }
    }finally{await browser.close();await new Promise(done=>server.close(done));}
});
