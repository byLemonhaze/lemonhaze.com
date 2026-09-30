import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {filterArchiveEntries, entryLinks} from '../src/editorial/archive-model.js';
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

test('studio note links keep distinct works and avoid repeating a collection destination', () => {
 const entry = { related: [{href:'/montreal',label:'Montreal exhibition'},{href:'/work-id',label:'Rue Cuvillier'}], collections:['Montreal'] };
 const links = entryLinks(entry, () => 'montreal');
 assert.deepEqual(links.map(link=>link.href), ['/montreal','/work-id']);
});

test('selected Studio Notes order preserves every entry and leads with the core practice', async () => {
 const {sortStudioNotes, STUDIO_NOTE_ORDER} = await import('../src/editorial/archive-curation.js');
 const before = data.entries.map(entry=>entry.slug);
 const ordered = sortStudioNotes(data.entries);
 assert.equal(new Set(STUDIO_NOTE_ORDER).size, data.entries.length);
 assert.deepEqual([...STUDIO_NOTE_ORDER].sort(), [...before].sort());
 assert.deepEqual(ordered.slice(0,3).map(entry=>entry.slug), ['gentlemen-work-in-progress','hosoi','chamber-of-reflection']);
 assert.deepEqual(data.entries.map(entry=>entry.slug), before);
 assert.deepEqual(ordered.map(entry=>entry.slug).sort(), [...before].sort());
});
test('Studio Notes can sort by source date without changing editorial order', async () => {
 const {sortStudioNotes} = await import('../src/editorial/archive-curation.js');
 const entries = [{slug:'hosoi',sources:[{date:'2024-01-02'}]},{slug:'chamber-of-reflection',sources:[{date:'2026-03-01'}]},{slug:'unknown',sources:[]}];
 assert.deepEqual(sortStudioNotes(entries,'newest').map(e=>e.slug), ['chamber-of-reflection','hosoi','unknown']);
 assert.deepEqual(sortStudioNotes(entries,'oldest').map(e=>e.slug), ['hosoi','chamber-of-reflection','unknown']);
 assert.deepEqual(sortStudioNotes(entries).map(e=>e.slug), ['hosoi','chamber-of-reflection','unknown']);
});
