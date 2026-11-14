import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import ethereumWorks from '../src/data/ethereum-works.json' with {type:'json'};

test('Ethereum originals open in local details and legacy canvas survives solo and viewport changes',async()=>{
    const dist=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.gif':'image/gif'};
    const server=createServer(async(req,res)=>{try{
        const path=new URL(req.url,'http://localhost').pathname;
        const file=resolve(dist,'.'+(path==='/'?'/index.html':extname(path)?path:path+'.html'));
        if(!file.startsWith(dist+'/'))throw Error();
        res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));
    }catch{res.writeHead(404);res.end();}});
    await new Promise(done=>server.listen(0,'127.0.0.1',done));
    const origin=process.env.IMMERSIVE_TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
    const browser=await chromium.launch();
    try{
        const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:3,reducedMotion:'reduce'});
        page.setDefaultTimeout(30000);
        await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:503,body:''}));
        for(const work of ethereumWorks.filter(w=>w.listed!==false)){
            await page.goto(origin+'/all-works');
            await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true');
            await page.locator('#all-works-search').fill(work.name.split(' by ')[0]);
            await page.locator(`.catalogue-work-result[href*="work=${work.id}"]`).filter({hasText:work.name}).click();
            await page.locator(`.detail-poster[data-quality="${work.id}"]`).waitFor();
            assert.equal(new URL(page.url()).origin,origin);
            assert.equal(new URL(page.url()).searchParams.get('work'),work.id);
            assert.equal(await page.locator('.experience-detail h1').textContent(),work.name);
            assert.equal(await page.locator('.detail-poster').evaluate(e=>new URL(e.src).pathname),work.original);
            await page.getByText('Full details & sales',{exact:true}).click();
            await page.getByText('Token details',{exact:true}).click();
            assert.ok((await page.locator('.detail-expanded').textContent()).includes(work.contract));
            await page.reload();
            await page.locator(`.detail-poster[data-quality="${work.id}"]`).waitFor();
        }
        // Fixture reproduces Candidly Yours: the canvas allocates once, while
        // its drawing code uses current viewport dimensions after any resize.
        const id='6601c667c0874889109645c27447bd3e61644fef75af86a02f6cf63c8b6a2ec5i0';
        await page.route('https://ordinals.com/content/'+id,r=>r.fulfill({contentType:'text/html',body:`<html><head><style>body{margin:0}canvas{display:block}</style></head><body><canvas></canvas><script>const c=document.querySelector('canvas');c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';c.getContext('2d').scale(devicePixelRatio,devicePixelRatio);window.resizeCount=0;function draw(){const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,innerWidth,innerHeight);x.fillStyle='blue';x.fillRect(innerWidth-20,innerHeight-20,20,20)}draw();addEventListener('resize',()=>{window.resizeCount++;draw()});</script></body></html>`}));
        // Use an available portrait poster without external network dependence.
        await page.route('**/*'+id+'*',async r=>{
            if(r.request().url()==='https://ordinals.com/content/'+id)return r.fallback();
            if(r.request().resourceType()==='image')return r.fulfill({contentType:'image/webp',body:await readFile('public/images/ethereum/eth-boulogne.webp')});
            return r.fallback();
        });
        await page.emulateMedia({reducedMotion:'no-preference'});
        // Paint Engines must never replace the collection still with chain HTML,
        // including after visibility changes or entering desktop solo view.
        const engineIds=['c8d790c42ce1a43c02acf15114d4053c1c9f086dc2856ebd3031ce268f5d58dbi0',
            '7a6d380af9adc2b7b70ac0cea5d054ab8c69a0d7d0f612e66870213276dd4349i0',
            '773bcd4be1b8a4a9f3e9c427fb4264066e2043b56a9ecb22c8ebcf2192fda561i0'];
        for(const engineId of engineIds){
            let chainRequests=0;
            await page.route('https://ordinals.com/content/'+engineId,r=>{
                chainRequests++;return r.fulfill({contentType:'text/html',body:'Unexpected live engine'});
            });
            const encrypted=engineId===engineIds[2];
            const still=encrypted?`/previews/immersive/${engineId}.webp`:`https://cdn.lemonhaze.com/assets/assets/${engineId}.png`;
            if(!encrypted)await page.route(still,async r=>r.fulfill({contentType:'image/webp',
                body:await readFile(`public/previews/immersive/${engineId}.webp`)}));
            for(const viewport of [{width:1440,height:900},{width:390,height:650}]){
                await page.setViewportSize(viewport);
                await page.goto(origin+'/?view=explore&work='+engineId);
                await page.locator(`.detail-poster[data-quality="${engineId}"]`).waitFor();
                await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
                if(viewport.width>1000)await page.locator('.detail-solo-enter').click();
                await page.waitForTimeout(850);
                assert.equal(await page.locator('.detail-poster').evaluate(img=>img.src),new URL(still,origin).href);
                assert.equal(await page.locator('.detail-original').count(),0);
                assert.equal(chainRequests,0,'no automatic chain request for a static engine');
                const rect=await page.locator('.detail-poster').boundingBox();
                assert.ok(rect.width>0&&rect.height>0&&rect.x>=0&&rect.x+rect.width<=viewport.width+1);
            }
        }
        await page.setViewportSize({width:1440,height:900});
        await page.goto(origin+'/?view=gallery&work='+id+'&series=Candidly%20Yours');
        await page.locator('.detail-media.live-ready').waitFor();
        const frame=await page.locator('.detail-original').elementHandle().then(h=>h.contentFrame());
        const dimensions=()=>frame.evaluate(()=>({width:innerWidth,height:innerHeight,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height],resizes:window.resizeCount}));
        const before=await dimensions();
        for(const viewport of [{width:1440,height:900},{width:1200,height:780}]){
            await page.setViewportSize(viewport);
            await page.locator('.detail-solo-enter').click();await page.waitForTimeout(850);
            assert.deepEqual(await dimensions(),before,'solo must not resize the artwork drawing viewport');
            const poster=await page.locator('.detail-poster').boundingBox(),live=await page.locator('.detail-original').boundingBox();
            assert.ok(Math.abs(poster.x-live.x)<1&&Math.abs(poster.y-live.y)<1,'live and still remain aligned');
            assert.ok(live.x>=0&&live.y>=0&&live.x+live.width<=viewport.width&&live.y+live.height<=viewport.height);
            await page.locator('.detail-close').click();await page.waitForTimeout(850);
            assert.deepEqual(await dimensions(),before,'returning to split must retain drawing dimensions');
        }
        await page.setViewportSize({width:390,height:650});
        await page.reload();await page.locator('.detail-media.live-ready').waitFor();
        const mobile=await page.locator('.detail-original').evaluate(node=>({
            width:Number(node.dataset.viewportWidth),height:Number(node.dataset.viewportHeight),
            displayedWidth:parseFloat(node.parentElement.style.getPropertyValue('--original-width')),
            displayedHeight:parseFloat(node.parentElement.style.getPropertyValue('--original-height')),
        }));
        assert.ok(Math.abs(mobile.width-mobile.displayedWidth)<=.5&&Math.abs(mobile.height-mobile.displayedHeight)<=.5,
            'mobile live viewport uses display size, avoiding an extra 2x enlargement before native DPR rendering');
        const mobileFrame=await page.locator('.detail-original').elementHandle().then(h=>h.contentFrame());
        assert.equal(await mobileFrame.evaluate(()=>document.querySelector('canvas').width),mobile.width*3,'native 3x pixel density is preserved');
        assert.equal(await page.locator('.detail-poster').evaluate(img=>Boolean(img.dataset.quality)),true,'sharp static fallback is retained');
        await page.locator('#view-switch [data-view=gallery]').click();
        await page.locator('.experience-detail').waitFor({state:'hidden'});
        await page.waitForFunction(()=>document.querySelector('.room-art[tabindex="0"]'));
        await page.evaluate(()=>{
            window.hiddenGalleryFrames=0;
            window.roomObserver=new MutationObserver(records=>window.hiddenGalleryFrames+=records.length);
            window.roomObserver.observe(document.querySelector('.room-camera'),{attributes:true,attributeFilter:['style']});
            document.querySelector('.room-title').click();
        });
        await page.locator('.detail-media.live-ready').waitFor();
        assert.equal(await page.evaluate(()=>window.hiddenGalleryFrames),0,'opening detail pauses the hidden gallery');
        await page.locator('#view-switch [data-view=gallery]').click();
        await page.locator('.experience-detail').waitFor({state:'hidden'});
        await page.getByRole('button',{name:'Next artwork',exact:true}).click();
        await page.waitForFunction(()=>window.hiddenGalleryFrames>0);
        await page.evaluate(()=>window.roomObserver.disconnect());
    }finally{await browser.close();await new Promise(done=>server.close(done));}
});
