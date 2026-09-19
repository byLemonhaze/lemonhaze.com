import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {sortedRows} from '../src/utils/sorting.js';
const result=await build({entryPoints:[new URL('../src/market-watch/lib/sorting.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {sortCollections,sortOffers,sortCrossListings}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const cols=[{key:'unknown',name:'Unknown',supply:null},{key:'zero',name:'Zero',supply:0},{key:'two',name:'Work 2',supply:2},{key:'ten',name:'Work 10',supply:10}];
const results={'ord:zero':{key:'zero',market:'ord',listed:0,floor:null,topOffer:null,checkedAt:''},'ord:two':{key:'two',market:'ord',listed:2,floor:100,topOffer:10,checkedAt:'2026-09-18'},'gamma:ten':{key:'ten',market:'gamma',listed:5,floor:300,topOffer:30,checkedAt:'2026-09-19'}};
const keys=rows=>rows.map(x=>x.key);
test('unknown market data stays last in either direction; known zero is retained',()=>{
 assert.deepEqual(keys(sortCollections(cols,results,'listed:asc')),['zero','two','ten','unknown']);
 assert.deepEqual(keys(sortCollections(cols,results,'listed:desc')),['ten','two','zero','unknown']);
 assert.deepEqual(keys(sortCollections(cols,results,'supply:desc')),['ten','two','zero','unknown']);
 assert.deepEqual(keys(sortCollections(cols,results,'checked:asc')),['two','ten','unknown','zero']);
});
test('price sorts use a collection’s lowest floor and do not mutate the input',()=>{
 const before=structuredClone(cols);const data={...results,'gamma:two':{...results['ord:two'],floor:500}};
 assert.deepEqual(keys(sortCollections(cols,data,'floor:desc')).slice(0,2),['ten','two']);assert.deepEqual(cols,before);
 assert.deepEqual(keys(sortCollections(cols,data,'name:asc')),['unknown','two','ten','zero']);
});
test('offer counts keep unavailable below a known zero; cross-listed prices use the cheapest observation',()=>{
 const offers=[{key:'unknown',market:'ord',offerCount:null},{key:'zero',market:'ord',offerCount:0},{key:'two',market:'ord',offerCount:2}];
 assert.deepEqual(keys(sortOffers(offers,cols,'bids:desc')),['two','zero','unknown']);
 const cross=[{id:'a',name:'A',observations:[{price:900},{price:100}]},{id:'b',name:'B',observations:[{price:200},{price:300}]}];
 assert.deepEqual(sortCrossListings(cross,'price:asc').map(x=>x.id),['a','b']);
});
test('circulation and burn sorts retain every supply row and use numeric order',()=>{
 const rows=[{name:'A',inscribed:10,circulating:0},{name:'B',inscribed:100,circulating:98},{name:'C',inscribed:2,circulating:2}];
 assert.deepEqual(sortedRows(rows,'burned:desc',{burned:r=>r.inscribed-r.circulating}).map(x=>x.name),['A','B','C']);
 assert.deepEqual(rows.map(x=>x.name),['A','B','C']);
});
