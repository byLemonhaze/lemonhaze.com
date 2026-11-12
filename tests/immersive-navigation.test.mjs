import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

test('Gallery carries the split artwork and its collection through switches, collection links and history',async()=>{
    const dist=resolve('dist'),id='4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0';
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
    const server=createServer(async(req,res)=>{
        try{
            const pathname=new URL(req.url,'http://localhost').pathname;
            const file=resolve(dist,'.'+(pathname==='/'?'/index.html':extname(pathname)?pathname:pathname+'.html'));
            if(!file.startsWith(dist+'/'))throw new Error('Invalid path');
            res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
        }catch{res.writeHead(404);res.end();}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin=process.env.IMMERSIVE_TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
    const browser=await chromium.launch({headless:true});
    try{
        const page=await browser.newPage({viewport:{width:1440,height:900}});
        await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.fulfill({status:503,body:''}));
        async function galleryAt(title,count){
            await page.locator('.experience-detail').waitFor({state:'hidden'});
            await page.waitForFunction(expected=>document.querySelector('.room-title')?.textContent===expected,title);
            assert.equal(await page.locator('.collection-name').textContent(),'Liminality');
            assert.equal(await page.locator('.room-navigation span').textContent(),count);
            const url=new URL(page.url());assert.equal(url.searchParams.get('series'),'Liminality');assert.equal(url.searchParams.has('work'),false);
        }
        async function exploreAt(title){
            await page.locator('.experience-detail').waitFor({state:'hidden'});
            assert.equal(new URL(page.url()).searchParams.has('work'),false);
            try{await page.waitForFunction(name=>{
                const button=document.querySelector('.explore-world button[title="'+name+'"]');
                if(!button)return false;const r=button.getBoundingClientRect();
                return Math.abs(r.x+r.width/2-innerWidth/2)<5&&Math.abs(r.y+r.height/2-innerHeight/2)<5;
            },title);}catch(error){console.log('Explore centring diagnostic',await page.evaluate(()=>({url:location.href,world:document.querySelector('.explore-world')?.style.transform,scene:getComputedStyle(document.querySelector('.experience-scene')).transform,box:document.querySelector('.explore-world button[title="Porcelain Sunset"]')?.getBoundingClientRect().toJSON()})));throw error;}
        }
        for(const mode of ['explore','gallery','website']){
            // The Gallery case deliberately starts with a stale, unrelated carousel.
            await page.goto(`${origin}/?view=${mode}&work=${id}${mode==='gallery'?'&series=Gentlemen':''}`);
            await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.getByRole('heading',{name:'Porcelain Sunset',exact:true}).waitFor();
            if(mode==='explore'){
                await page.getByRole('button',{name:'Close artwork',exact:true}).click();
                await page.locator('.experience-detail').waitFor({state:'hidden'});
                await page.getByRole('button',{name:'Zoom out',exact:true}).click();
                await page.getByRole('button',{name:'Zoom out',exact:true}).click();
                await page.mouse.move(700,350);await page.mouse.wheel(90,60);await page.waitForTimeout(300);
                await page.getByRole('button',{name:'Open Porcelain Sunset',exact:true}).click();
                await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.getByRole('heading',{name:'Porcelain Sunset',exact:true}).waitFor();
            }
            await page.locator('#view-switch').getByRole('link',{name:'Gallery',exact:true}).click();
            await galleryAt('Porcelain Sunset','07 / 08');
            assert.equal(new URL(page.url()).searchParams.get('at'),id);
            await page.locator('#view-switch').getByRole('link',{name:'Explore',exact:true}).click();
            await exploreAt('Porcelain Sunset');
            assert.equal(new URL(page.url()).searchParams.get('at'),id);
            await page.getByRole('button',{name:'Open Porcelain Sunset',exact:true}).click();
            await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.getByRole('heading',{name:'Porcelain Sunset',exact:true}).waitFor();
            await page.locator('#view-switch').getByRole('link',{name:'Explore',exact:true}).click();
            await page.locator('.experience-detail').waitFor({state:'hidden'});
            assert.equal(new URL(page.url()).searchParams.has('work'),false);
            await exploreAt('Porcelain Sunset');
            assert.equal(new URL(page.url()).searchParams.get('at'),id);
            await page.goBack();
            await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.getByRole('heading',{name:'Porcelain Sunset',exact:true}).waitFor();
            await page.locator('#view-switch').getByRole('link',{name:'Gallery',exact:true}).click();
            await galleryAt('Porcelain Sunset','07 / 08');
            await page.getByRole('button',{name:'Previous artwork',exact:true}).click();
            await galleryAt('Melon Days','06 / 08');
            await page.getByRole('button',{name:'Next artwork',exact:true}).click();
            await galleryAt('Porcelain Sunset','07 / 08');
            await page.getByRole('button',{name:'Next artwork',exact:true}).click();
            await galleryAt('Terminal 36','08 / 08');
            await page.locator('#view-switch').getByRole('link',{name:'Explore',exact:true}).click();
            await exploreAt('Terminal 36');
            await page.locator('#view-switch').getByRole('link',{name:'Gallery',exact:true}).click();
            await galleryAt('Terminal 36','08 / 08');
            await page.locator('.room-title').click();
            await page.getByRole('heading',{name:'Terminal 36',exact:true}).waitFor();
            await page.getByRole('button',{name:'View collection in Gallery',exact:true}).click();
            await galleryAt('Terminal 36','08 / 08');
            await page.goBack();
            await page.getByRole('heading',{name:'Terminal 36',exact:true}).waitFor();
            await page.goForward();await galleryAt('Terminal 36','08 / 08');
        }
        await page.getByRole('button',{name:'Previous artwork',exact:true}).click();
        await galleryAt('Porcelain Sunset','07 / 08');
        await page.waitForFunction(()=>[...document.querySelectorAll('.room-art img[src]')].every(img=>img.complete&&img.naturalWidth>0));
        await page.waitForTimeout(500);
        const box=await page.getByRole('button',{name:'Open Porcelain Sunset',exact:true}).boundingBox();
        assert.ok(Math.abs(box.x+box.width/2-720)<5,'the selected work is centered in Gallery');
        await mkdir('output/playwright/feedback-6',{recursive:true});
        await page.screenshot({path:'output/playwright/feedback-6/gallery-context.png'});
        // The arrows and keyboard wrap across both collection boundaries.
        await page.keyboard.press('Home');
        await page.waitForFunction(()=>document.querySelector('.room-navigation span').textContent==='01 / 08');
        const firstTitle=await page.locator('.room-title').textContent();
        await page.getByRole('button',{name:'Previous artwork',exact:true}).click();
        await galleryAt('Terminal 36','08 / 08');
        await page.getByRole('button',{name:'Next artwork',exact:true}).click();
        await galleryAt(firstTitle,'01 / 08');
        await page.keyboard.press('ArrowLeft');
        await galleryAt('Terminal 36','08 / 08');
        await page.keyboard.press('ArrowRight');
        await galleryAt(firstTitle,'01 / 08');
        // Adjacent works are mounted on either side of the seam, not an empty end.
        await page.waitForFunction(()=>document.querySelectorAll('.room-mount:not([hidden])').length>=5);
        assert.equal(await page.locator('.room-end-wall').count(),0);
        await mkdir('output/playwright/feedback-14',{recursive:true});
        for(const index of [5,6]){
            await page.goto(`${origin}/?view=gallery`);
            await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.keyboard.press('Home');
            for(let i=0;i<index;i++)await page.getByRole('button',{name:'Next artwork',exact:true}).click();
            await page.waitForFunction(expected=>document.querySelector('.room-navigation span').textContent===expected,`${String(index+1).padStart(2,'0')} / 08`);
            await page.waitForTimeout(800);
            await page.screenshot({path:`output/playwright/feedback-14/gallery-${index+1}.png`});
        }
        await page.locator('.collection-trigger').click();
        assert.deepEqual(await page.locator('.collection-option > span:first-child').allTextContents().then(names=>names.slice(0,5)),['Selected works','Gentlemen','Impossible Folds','Montreal','BEST BEFORE']);
        await page.screenshot({path:'output/playwright/feedback-14/gallery-collections.png'});
        await page.locator('.collection-option').filter({hasText:'Impossible Folds'}).click();
        await page.waitForFunction(()=>document.querySelector('.collection-name').textContent==='Impossible Folds');
        await page.keyboard.press('End');
        await page.waitForFunction(()=>document.querySelector('.room-navigation span').textContent==='12 / 12');
        await page.getByRole('button',{name:'Next artwork',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('.room-navigation span').textContent==='01 / 12');
        await page.mouse.move(700,350);
        for(let i=0;i<3;i++)await page.mouse.wheel(0,-400);
        await page.waitForFunction(()=>document.querySelector('.room-navigation span').textContent==='12 / 12');
        await page.waitForFunction(()=>{const n=document.querySelector('.room-art[tabindex="0"]');const b=n?.getBoundingClientRect();return b&&Math.abs(b.x+b.width/2-innerWidth/2)<1;});
        assert.equal(await page.getByRole('button',{name:'Reduce motion',exact:true}).count(),0);
        const beforeDrag=await page.locator('.room-navigation span').textContent();
        await page.mouse.move(720,300);await page.mouse.down();
        await page.mouse.move(390,300,{steps:12});
        assert.equal(await page.locator('.room-viewport').evaluate(e=>e.classList.contains('is-grabbing')),true);
        await page.mouse.up();
        await page.waitForFunction(previous=>document.querySelector('.room-navigation span').textContent!==previous,beforeDrag);
        await page.waitForFunction(()=>{const n=document.querySelector('.room-art[tabindex="0"]');const b=n?.getBoundingClientRect();return b&&Math.abs(b.x+b.width/2-innerWidth/2)<1;});
        assert.equal(await page.locator('.experience-detail').isVisible(),false,'releasing a drag must not open the artwork');
        await mkdir('output/playwright/feedback-15',{recursive:true});
        await page.screenshot({path:'output/playwright/feedback-15/gallery-snap.png'});
        await page.locator('#view-switch').getByRole('link',{name:'Explore',exact:true}).click();
        await page.locator('.explore-viewport').waitFor();
        assert.equal(await page.locator('.experience-note').isVisible(),false);
        assert.equal(await page.getByText('Works to explore',{exact:true}).count(),0);
        // A narrow viewport and an already-open Gallery detail use the same
        // field handoff, with the complete artwork kept inside the viewport.
        await page.setViewportSize({width:390,height:844});
        await page.goto(`${origin}/?view=gallery&work=${id}&series=Liminality`);
        await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.getByRole('heading',{name:'Porcelain Sunset',exact:true}).waitFor();
        await page.locator('#view-switch').getByRole('link',{name:'Explore',exact:true}).click();
        await exploreAt('Porcelain Sunset');
        const mobileBox=await page.getByRole('button',{name:'Open Porcelain Sunset',exact:true}).boundingBox();
        assert.ok(mobileBox.x>=0&&mobileBox.x+mobileBox.width<=390&&mobileBox.y>=90&&mobileBox.y+mobileBox.height<=764);
    }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
