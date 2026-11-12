import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLiveDocument } from '../src/immersive/live-document.js';
import { upgradePoster, createPreviewQueue } from '../src/immersive/media.js';

test('live documents retain chain URLs and wait for actual artwork paint',()=>{
    const html=buildLiveDocument('<html><head></head><body><canvas></canvas></body></html>','https://ordinals.com/content/example','test-token','example');
    assert.ok(html.includes('<base href="https://ordinals.com/content/example">'));
    assert.ok(html.indexOf('paintBridge')<html.indexOf('<canvas>'));
    assert.ok(html.includes('lemonhaze-artwork-paint'));
    assert.throws(()=>buildLiveDocument('<script>const self=location.pathname;</script>','url','token','id'),/original location/);
});
test('decoded posters cannot replace a different selection or a released thumbnail',async()=>{
    const previous=globalThis.Image,images=[];
    globalThis.Image=class {constructor(){images.push(this);}decode(){return Promise.resolve();}};
    try {
        const img={src:'low',isConnected:true,dataset:{},getAttribute(){return this.src;}};
        const work={id:'test',original:'high.png',content_type:'image/png'};
        const cancel=upgradePoster(work,img);const loaded=images.at(-1).onload;cancel();await loaded();assert.equal(img.src,'low');
        upgradePoster(work,img);img.src='another-work';await images.at(-1).onload();assert.equal(img.src,'another-work');
        img.src='low';upgradePoster(work,img);await images.at(-1).onload();assert.equal(img.src,'high.png');
        assert.equal(img.dataset.quality,'test');
    } finally {globalThis.Image=previous;}
});

test('live bridge insertion preserves dollar sequences used by minified scripts',()=>{
    const token='$&-$1-$$-$`-$\'';
    const html=buildLiveDocument('<html><head data-test="original"></head><body></body></html>','https://ordinals.com/content/example',token,'example');
    assert.ok(html.includes(JSON.stringify(token)));
    assert.equal((html.match(/<head/g)||[]).length,1);
    assert.ok(html.includes('<head data-test="original"><base'));
    const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
    assert.doesNotThrow(()=>new Function(script));
});

test('sharp previews load in bounded priority order and cancel when their view leaves',async()=>{
    const previous=globalThis.Image,requests=[];
    globalThis.Image=class {constructor(){requests.push(this);}decode(){return Promise.resolve();}};
    const entries=Array.from({length:5},(_,i)=>({work:{id:'preview-'+i,artwork_type:'PNG'},img:{src:'low-'+i,isConnected:true,dataset:{},getAttribute(){return this.src;}}}));
    const queue=createPreviewQueue();
    try{
        queue.update(entries);assert.equal(requests.length,2);
        queue.update(entries);assert.equal(requests.length,2,'animation frames must not restart downloads');
        await requests[0].onload();assert.equal(entries[0].img.dataset.quality,'preview-0');
        assert.equal(requests.length,3,'one settled request admits the next neighbour');
        const stale=requests[1].onload;
        queue.clear();assert.equal(requests[1].src,'');await stale();
        assert.equal(entries[1].img.src,'low-1','a late decode cannot paint a departed view');
        assert.equal(requests.length,3,'cancellation must not start the remaining neighbours');
    }finally{queue.clear();globalThis.Image=previous;}
});


test('a blocked chain image falls back to the artist CDN before giving up',async()=>{
 const previous=globalThis.Image,images=[];
 globalThis.Image=class{constructor(){images.push(this);}decode(){return Promise.resolve();}};
 try{
  const work={id:'example',collection:'Gentlemen',artwork_type:'JPEG'},img={src:'low',isConnected:true,dataset:{},getAttribute(){return this.src;}};
  let settled=0;upgradePoster(work,img,{onSettled:()=>settled++});const high=images.at(-1);
  assert.match(high.src,/ordinals.com/);high.onerror();assert.match(high.src,/cdn.lemonhaze.com/);assert.equal(settled,0);
  await high.onload();assert.equal(img.src,high.src);assert.equal(settled,1);
 }finally{globalThis.Image=previous;}
});
