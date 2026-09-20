import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const directory=await mkdtemp(join(tmpdir(),'lemonhaze-visualizer-test-'));
const output=await build({entryPoints:['src/visualizer/TimelineVisualizer.tsx'],bundle:true,platform:'node',format:'esm',jsx:'automatic',write:false});
const modulePath=join(directory,'visualizer.mjs');
await writeFile(modulePath,output.outputFiles[0].text);
const visualizer=await import(pathToFileURL(modulePath));
await rm(directory,{recursive:true,force:true});
const previousFetch=globalThis.fetch;
let artworks;
try {
 globalThis.fetch=async value=>{
  const url=new URL(value,'https://lemonhaze.com');
  const path=url.hostname==='bestbefore.space'?'/data/collections/best-before.json':url.pathname.endsWith('/provenance.json')?'/data/provenance.json':url.pathname;
  return new Response(await readFile(new URL('../public'+path,import.meta.url)));
 };
 artworks=await visualizer.loadCatalogue();
} finally {globalThis.fetch=previousFetch;}
const groups=visualizer.buildGroups(artworks);

test('Visualizer includes current collections, parent roles, and every 2026 one-of-one',async()=>{
 const tin=groups.find(g=>g.name==='Tin Box of Solitude');
 assert.equal(tin.parents.length,1);assert.equal(tin.works.length,12);
 assert.equal(tin.parents[0].id,'3664bb4f033e06f53dff3a42952311b20a7622023bbc77ef0954d8dde6463460i0');
 const griff=groups.find(g=>g.name==='Griffintown');
 assert.equal(griff.parents.length,1);assert.equal(visualizer.groupDisplayItems(griff).length,4);
 assert.deepEqual(visualizer.preferredGridShape(griff),{columns:2,rows:2});
 const one=groups.find(g=>g.name==='1 of 1s (2026)');
 const provenance=JSON.parse(await readFile(new URL('../public/data/provenance.json',import.meta.url)));
 const latest=JSON.parse(await readFile(new URL('../public/data/collections/1-of-1s-2026.json',import.meta.url)));
 const expected=new Set([...provenance.filter(a=>a.collection==='1 of 1s (2026)'),...latest].map(a=>a.id));
 assert.deepEqual(new Set(one.allItems.map(a=>a.id)),expected);
 assert.equal(expected.size,15);
 assert.equal(new Set(artworks.map(a=>a.id)).size,artworks.length);
 assert.equal(groups.find(g=>g.name==='BEST BEFORE').works.length,420);
 assert.equal(visualizer.latestChronologyDate(groups),'SEPT 2026');
});

test('Tin Box has a centered parent above exactly three rows of four, within its card',()=>{
 const bounds={x:10,y:20,width:1084,height:530};
 const tiles=visualizer.tinBoxTileLayout(bounds,12);
 assert.equal(tiles.parent.x+tiles.parent.width/2,bounds.x+bounds.width/2);
 assert.ok(tiles.parent.y+tiles.parent.height<tiles.works[0].y);
 assert.equal(new Set(tiles.works.map(r=>r.y)).size,3);
 for(const y of new Set(tiles.works.map(r=>r.y)))assert.equal(tiles.works.filter(r=>r.y===y).length,4);
 for(const rect of [tiles.parent,...tiles.works]){
  assert.ok(rect.x>=bounds.x&&rect.y>=bounds.y);
  assert.ok(rect.x+rect.width<=bounds.x+bounds.width+0.001);
  assert.ok(rect.y+rect.height<=bounds.y+bounds.height+0.001);
 }
});

test('all five 2026 groups fit without overlapping or dropping a collection',()=>{
 const bounds={x:6370,y:1870,width:1100,height:2260};
 const layouts=visualizer.layoutGrandPeriod(groups.filter(g=>g.year==='2026'),bounds,'2026');
 assert.equal(layouts.length,5);
 layouts.forEach(({rect},index)=>{
  assert.ok(rect.height>200);
  assert.ok(rect.y+rect.height<=bounds.y+bounds.height+0.001);
  if(index)assert.ok(rect.y>layouts[index-1].rect.y+layouts[index-1].rect.height);
 });
});
