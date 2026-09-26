import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {filterArchiveEntries} from '../src/editorial/archive-model.js';
const data=JSON.parse(await readFile(new URL('../src/editorial/archive-data.json',import.meta.url),'utf8'));
test('archive search combines words, accents and collection/subject/year filters',()=>{
 const result=filterArchiveEntries(data.entries,{query:'crepuscule techniques',kind:'Process',collection:'Berlin'});
 assert.deepEqual(result.map(e=>e.slug),['three-techniques']);
 assert.equal(filterArchiveEntries(data.entries,{query:'casa',kind:'Display'}).length,0);
 const year=data.entries.find(e=>e.slug==='casa-flamingo').years[0];
 assert.ok(filterArchiveEntries(data.entries,{query:'casa flamingo',year}).some(e=>e.slug==='casa-flamingo'));
 assert.equal(filterArchiveEntries(data.entries,{year:'1900'}).length,0);
 assert.equal(filterArchiveEntries(data.entries).length,data.entries.length);
});
test('archive links refer to real collection and artwork routes and local media',async()=>{
 const routes=JSON.parse(await readFile(new URL('../public/seo/routes.json',import.meta.url),'utf8'));
 const names=new Set(routes.filter(r=>r.kind==='collection').map(r=>r.name));
 const paths=new Set(routes.map(r=>r.path));
 assert.equal(new Set(data.entries.map(e=>e.slug)).size,data.entries.length);
 for(const entry of data.entries){
  assert.ok(entry.sources.length,entry.slug+' has sources');
  for(const collection of entry.collections) assert.ok(names.has(collection),collection);
  for(const link of entry.related) assert.ok(paths.has(link.href),link.href);
  const media=entry.images.map(i=>i.src);
  if(entry.video) media.push(entry.video.src,entry.video.poster);
  for(const src of media) await access(new URL('../public'+src,import.meta.url));
 }
 for(const link of data.reading) assert.ok(paths.has(link.href.split('#')[0]),link.href);
});
