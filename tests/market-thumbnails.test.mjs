import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {build} from 'esbuild';
const read=async file=>JSON.parse(await readFile(new URL(file,import.meta.url),'utf8'));
const thumbnails=await read('../src/market-watch/lib/collection-thumbnails.json');
const initial=await read('../src/market-watch/lib/initial.json');
const built=await build({entryPoints:[new URL('../src/market-watch/lib/collection-thumbnails.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {collectionThumbnail}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
test('every market collection has a small local thumbnail with recorded inscription provenance',async()=>{
 for(const c of initial.catalog.filter(c=>c.refs.ord&&!['provenance','colors'].includes(c.key))){
  const image=collectionThumbnail(c);assert.ok(image,c.key);
  assert.match(image.id,/^[a-f0-9]{64}i\d+$/);assert.match(image.src,/^\/images\/market-watch\/[a-z0-9_-]+\.png$/);
  assert.ok(image.source.includes(image.id));
  const file=new URL('../public'+image.src,import.meta.url);const size=(await stat(file)).size;
  assert.ok(size>0&&size<50000,`${c.key}: ${size}`);
 }
});
test('market refresh images cannot replace the chosen parent or first artwork',()=>{
 const parent=collectionThumbnail({key:'manufactured-by-lemonhaze',image:'https://market.example/random.png'});
 assert.equal(parent.id,'b40f54c56d0ad7993e59f279d6386c78864f8b8b6cb9a2abc45e5d829ff9de12i0');
 assert.equal(parent.role,'parent');
 const gallery=collectionThumbnail({key:'cypherville-by-lemonhaze'});
 assert.equal(gallery.name,'Creature #1');assert.equal(gallery.role,'first-work');
 assert.equal(collectionThumbnail({key:'unmapped-future-collection'}),null);
});
