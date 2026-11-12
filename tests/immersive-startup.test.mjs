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
