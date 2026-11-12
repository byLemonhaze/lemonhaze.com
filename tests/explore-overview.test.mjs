import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fetchFeaturedCollections} from '../src/data/featured-collections.js';
import {assembleArtworkCatalog} from '../src/data/catalog.js';
import {normalizeBBCollection} from '../src/data.js';
import {createExperienceCatalog} from '../src/immersive/model.js';
import {buildExploreLayout} from '../src/immersive/layout.js';
import overview from '../src/immersive/overview.json' with {type:'json'};

test('overview texture contains the exact full roster and current composition within a bounded image budget',async()=>{
 const read=async path=>JSON.parse(await readFile(new URL('../public/'+path,import.meta.url)));
 const saved=globalThis.fetch;let featured;
 try{globalThis.fetch=async path=>new Response(await readFile(new URL('../public'+path,import.meta.url)));featured=await fetchFeaturedCollections({strict:true});}finally{globalThis.fetch=saved;}
 const works=createExperienceCatalog(assembleArtworkCatalog(await read('data/provenance.json'),normalizeBBCollection(await read('data/collections/best-before.json')),featured)).explore;
 const {bounds,placements}=buildExploreLayout(works);
 assert.equal(overview.works,works.length);
 assert.deepEqual(overview.bounds,bounds);
 assert.equal(overview.fingerprint,createHash('sha256').update(JSON.stringify([...placements])).digest('hex'),'Regenerate with node scripts/build_explore_overview.mjs after composition changes');
 assert.equal(overview.version,createHash('sha256').update(await readFile(new URL('../public/previews/explore-overview.webp',import.meta.url))).digest('hex').slice(0,12),'overview URL changes when its pixels change');
 assert.ok(overview.width*overview.height*4<=16_000_000,'decoded overview uses at most 16 MB');
 assert.ok((await stat(new URL('../public/previews/explore-overview.webp',import.meta.url))).size<2_000_000,'overview transfer stays below 2 MB');
});
