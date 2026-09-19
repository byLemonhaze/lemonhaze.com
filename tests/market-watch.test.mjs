import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
async function load(file){const r=await build({entryPoints:[new URL(file,import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const {deduplicate}=await load('../src/market-watch/lib/types.ts');
const {svelteJSON,canonicalId}=await load('../src/market-watch/lib/parsers.ts');
const {handleScan}=await load('../src/market-watch/lib/service.ts');
const id='a'.repeat(64)+'i1';
const row=(market,key='a',status='ok',inscription=id)=>({market,key,status,checkedAt:'2026-09-19',listings:[{id:inscription,name:'Edition',price:10000,url:'https://example.com'}]});
test('Market Watch counts exact IDs once across aliases and distinguishes editions',()=>{const r=deduplicate([row('ord'),row('ord','alias'),row('gamma'),row('satflow','b','ok','a'.repeat(64)+'i2')]);assert.equal(r.length,2);assert.equal(r[0].observations.length,2)});
test('stale or unavailable snapshots cannot assert current cross-listings',()=>{assert.equal(deduplicate([row('ord'),row('gamma','a','error')])[0].observations.length,1);assert.equal(canonicalId('Manufactured #1'),null)});
test('public-page parsing accepts data but never evaluates page code',()=>{assert.deepEqual(svelteJSON('{name:"Braces {inside}",floor:.0039}'),{name:'Braces {inside}',floor:.0039});assert.throws(()=>svelteJSON('{bad:alert("execute")}'))});
test('scan endpoints reject cross-origin calls before accessing storage',async()=>{const request=new Request('https://lemonhaze.com/api/market-watch/scan',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal((await handleScan(request,{})).status,403)});
test('scan endpoints reject non-JSON, oversized and malformed inputs',async()=>{const req=(body,headers={})=>new Request('https://lemonhaze.com/api/market-watch/scan',{method:'POST',headers,body});assert.equal((await handleScan(req('{}'),{})).status,415);assert.equal((await handleScan(req('x'.repeat(1025),{'Content-Type':'application/json'}),{})).status,413);assert.equal((await handleScan(req('broken',{'Content-Type':'application/json'}),{})).status,400)});
