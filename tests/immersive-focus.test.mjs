import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { revealInFocus } from '../src/immersive/focus.js';
import { buildLiveDocument } from '../src/immersive/live-document.js';

test('focus reveal completes once, cancels departed work and respects reduced motion',async()=>{
    const oldMatch=globalThis.matchMedia,oldDocument=globalThis.document;
    globalThis.matchMedia=()=>({matches:false});globalThis.document={documentElement:{dataset:{}}};
    let complete,frames,options,cancelled=0,finished=0;
    const node={animate(f,o){frames=f;options=o;return {finished:new Promise(resolve=>{complete=resolve;}),cancel(){cancelled++;}};}};
    try{
        revealInFocus(node,{onFinish:()=>finished++});
        assert.equal(options.duration,1000);assert.equal(frames.at(-1).filter,'blur(0px)');
        assert.equal(frames[1].opacity,1,'the preview is covered before the sharpening finishes');
        complete();await Promise.resolve();assert.equal(finished,1);assert.equal(cancelled,1);
        const cancel=revealInFocus(node,{onFinish:()=>finished++});cancel();complete();await Promise.resolve();assert.equal(finished,1);
        revealInFocus(node,{pixel:true});assert.ok(frames.every(f=>f.filter==='none'));complete();await Promise.resolve();
        globalThis.matchMedia=()=>({matches:true});
        revealInFocus({animate(){throw Error('reduced motion must not animate');}},{onFinish:()=>finished++});assert.equal(finished,2);
    }finally{globalThis.matchMedia=oldMatch;globalThis.document=oldDocument;}
});

test('live fitting never feeds its scale into a canvas measuring its viewport each frame',async()=>{
    const browser=await chromium.launch({headless:true});
    try{
        const page=await browser.newPage({deviceScaleFactor:2});
        await page.setContent('<iframe style="width:493.5px;height:370.125px;border:0" sandbox="allow-scripts"></iframe>');
        // Mirrors Griffintown: a fixed stage measured every animation frame,
        // a tight card wrapper, and a canvas rendered at 90% of available size.
        const fixture=`<html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}#stage{position:fixed;inset:0;display:grid;place-items:center}canvas{display:block}</style></head><body><div id="stage"><div id="card"><canvas></canvas></div></div><script>
        const stage=document.querySelector('#stage'),c=document.querySelector('canvas'),ctx=c.getContext('2d');
        function draw(){const r=stage.getBoundingClientRect(),w=Math.round(r.width*.9),h=Math.round(w*.75);c.style.width=w+'px';c.style.height=h+'px';if(c.width!==w||c.height!==h){c.width=w;c.height=h;}ctx.fillStyle='#234';ctx.fillRect(0,0,c.width,c.height);requestAnimationFrame(draw);}draw();</script></body></html>`;
        const html=buildLiveDocument(fixture,'https://ordinals.com/content/fixture','test-token','fixture');
        await page.locator('iframe').evaluate((f,html)=>{f.srcdoc=html;},html);
        const frame=await page.locator('iframe').elementHandle().then(h=>h.contentFrame());
        await frame.waitForFunction(()=>document.querySelector('#card')?.style.scale);
        const measure=()=>frame.evaluate(async()=>{
            const sizes=[];for(let n=0;n<24;n++){await new Promise(requestAnimationFrame);const c=document.querySelector('canvas'),r=c.getBoundingClientRect();sizes.push({width:r.width,height:r.height,buffer:c.width,x:r.x,y:r.y});}
            return {sizes,body:document.body.style.transform,viewport:{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight}};
        });
        for(const width of [493.5,350.25]){
            await page.locator('iframe').evaluate((f,width)=>{f.style.width=width+'px';},width);
            await frame.waitForFunction(()=>{const r=document.querySelector('canvas').getBoundingClientRect(),d=document.documentElement;return Math.min(Math.abs(r.width-d.clientWidth),Math.abs(r.height-d.clientHeight))<.05;});
            const {sizes,body,viewport}=await measure();
            assert.equal(body,'','viewport must remain untransformed');
            assert.ok(Math.max(...sizes.map(s=>s.width))-Math.min(...sizes.map(s=>s.width))<.05,'no width oscillation');
            assert.equal(new Set(sizes.map(s=>s.buffer)).size,1,'no repeated canvas buffer reallocation');
            const first=sizes[0];
            assert.ok(first.width<=viewport.width+.05&&first.height<=viewport.height+.05,'contain without cropping');
            assert.ok(Math.abs(first.x+first.width/2-viewport.width/2)<.05,'centred horizontally');
            assert.ok(Math.abs(first.y+first.height/2-viewport.height/2)<.05,'centred vertically');
        }
    }finally{await browser.close();}
});
