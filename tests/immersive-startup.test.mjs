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

test('Explore reveals Impossible Folds with a decoded image and fitted frame on cold and cached loads',{timeout:60000},async()=>{
    const {createServer}=await import('node:http');
    const {resolve,extname}=await import('node:path');
    const {chromium}=await import('playwright');
    const dist=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};
    const server=createServer(async(req,res)=>{try{
        const path=new URL(req.url,'http://localhost').pathname,file=resolve(dist,'.'+(path==='/'?'/index.html':path));
        if(!file.startsWith(dist+'/'))throw Error();
        res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
        res.setHeader('Cache-Control','public, max-age=3600');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end();}});
    await new Promise(done=>server.listen(0,'127.0.0.1',done));
    const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch();
    try{
        const page=await browser.newPage({viewport:{width:1512,height:982},deviceScaleFactor:2});
        await page.addInitScript(()=>{
            window.landingFrames=[];
            const decoded=new WeakSet(),decode=HTMLImageElement.prototype.decode;
            // Stretch the decoding boundary to expose a premature frame reliably.
            HTMLImageElement.prototype.decode=async function(){
                await decode.call(this);
                await new Promise(resolve=>setTimeout(resolve,80));decoded.add(this);
            };
            function sample(){
                const button=document.querySelector('.explore-world [data-work="shop-print6"]'),img=button?.querySelector('img');
                if(img&&getComputedStyle(button).visibility==='visible'&&getComputedStyle(img).visibility==='visible'){
                    const r=img.getBoundingClientRect();
                    window.landingFrames.push({decoded:decoded.has(img),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:r.width,height:r.height});
                }
                requestAnimationFrame(sample);
            }requestAnimationFrame(sample);
        });
        for(let attempt=0;attempt<7;attempt++){
            if(attempt)await page.reload({waitUntil:'domcontentloaded'});
            else await page.goto(origin+'/?view=explore',{waitUntil:'domcontentloaded'});
            await page.waitForFunction(()=>window.landingFrames.length>=12);
            const frames=await page.evaluate(()=>window.landingFrames);
            assert.ok(frames.every(frame=>frame.decoded&&frame.naturalWidth>0),`refresh ${attempt}: no undecoded or empty first frame`);
            assert.ok(frames.every(frame=>Math.abs(frame.width/frame.height-frame.naturalWidth/frame.naturalHeight)<.001),`refresh ${attempt}: frame fits the image from its first paint`);
        }
        // A withheld/failed image must not leave a broken-image frame behind.
        await page.route('**/impossible-folds-01.webp',route=>route.fulfill({status:503,body:''}));
        await page.reload({waitUntil:'domcontentloaded'});
        await page.waitForSelector('.explore-world [data-work="shop-print6"].media-unavailable');
        assert.equal(await page.locator('.explore-world [data-work="shop-print6"] img').evaluate(img=>getComputedStyle(img).opacity),'0');
    }finally{await browser.close();await new Promise(done=>server.close(done));}
});
