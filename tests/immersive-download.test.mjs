import test from 'node:test';
import assert from 'node:assert/strict';
import {downloadImageSource} from '../src/immersive/media.js';
import {fetchDownloadImage,imageFilename} from '../src/immersive/download.js';

test('image downloads preserve native originals and select still images for live works',()=>{
    const engine={id:'c8d790c42ce1a43c02acf15114d4053c1c9f086dc2856ebd3031ce268f5d58dbi0',name:'Paint Engine v1.07',artwork_type:'Javascript/PNG'};
    assert.equal(downloadImageSource(engine),`https://cdn.lemonhaze.com/assets/assets/${engine.id}.png`);
    assert.equal(downloadImageSource({id:'live',artwork_type:'HTML'}),'https://cdn.lemonhaze.com/assets/assets/live.png');
    assert.equal(downloadImageSource({id:'motion',artwork_type:'WebM'}),'https://cdn.lemonhaze.com/assets/assets/motion.png');
    assert.equal(downloadImageSource({id:'gif',artwork_type:'GIF',original:'/original.gif'}),'/original.gif');
});

test('blocked chain images download from the image mirror with the correct filename',async()=>{
    const before=globalThis.fetch,requests=[];
    globalThis.fetch=async url=>{requests.push(url);return requests.length===1?new Response('Blocked',{status:403}):new Response(new Blob(['image'],{type:'image/jpeg'}));};
    try{
        const result=await fetchDownloadImage({id:'test',name:'Gentleman Nº1',collection:'Gentlemen',artwork_type:'JPEG'});
        assert.deepEqual(requests,['https://ordinals.com/content/test','https://cdn.lemonhaze.com/assets/assets/test.jpg']);
        assert.equal(result.filename,'Gentleman Nº1.jpg');
        assert.equal(result.blob.type,'image/jpeg');
    }finally{globalThis.fetch=before;}
});

test('HTML/error payloads are never saved as artwork images',async()=>{
    const before=globalThis.fetch;
    globalThis.fetch=async()=>new Response('<html>not an image</html>',{headers:{'content-type':'text/html'}});
    try{await assert.rejects(fetchDownloadImage({id:'test',artwork_type:'PNG'}),/unavailable/);}
    finally{globalThis.fetch=before;}
});

test('cancelling a download does not start a fallback request',async()=>{
    const before=globalThis.fetch,controller=new AbortController();let requests=0;
    globalThis.fetch=async()=>{requests++;controller.abort();throw controller.signal.reason;};
    try{
        await assert.rejects(fetchDownloadImage({id:'test',collection:'Gentlemen'},{signal:controller.signal}),{name:'AbortError'});
        assert.equal(requests,1);
    }finally{globalThis.fetch=before;}
});

test('download names retain artwork titles while removing path separators',()=>{
    assert.equal(imageFilename({name:'Work / study: Nº1'},'image/png'),'Work - study- Nº1.png');
});
