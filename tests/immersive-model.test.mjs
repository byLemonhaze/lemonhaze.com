import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createExperienceCatalog, viewingMode, immersiveUrl, previewSource } from '../src/immersive/model.js';
import { SELECTED_WORK_IDS } from '../src/curation/selection.js';
import { fetchFeaturedCollections } from '../src/data/featured-collections.js';
import { assembleArtworkCatalog } from '../src/data/catalog.js';
import { COLLECTION_LEAD_ARTWORK_IDS } from '../src/app/collection-flow.js';

test('immersive routing preserves existing deep links and explicit view intent',()=>{
    const mode=path=>viewingMode(new URL(path,'https://lemonhaze.com'));
    assert.equal(mode('/'),'explore');
    assert.equal(mode('/?view=gallery'),'gallery');
    assert.equal(mode('/?view=website'),'website');
    for(const path of ['/gentlemen','/about','/explore','/?a=123','/?collection=Gentlemen','/some-inscription?view=invalid'])assert.equal(mode(path),'website');
    assert.equal(mode('/gentlemen?view=gallery'),'gallery');
    assert.equal(immersiveUrl('explore',{id:'shop-print5'}),'/?view=explore&work=shop-print5');
});

test('verified landing works resolve to their complete, ordered collections',async()=>{
    const originalFetch=globalThis.fetch;
    let featured;
    try{globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));featured=await fetchFeaturedCollections({strict:true});}
    finally{globalThis.fetch=originalFetch;}
    const provenance=JSON.parse(await readFile(new URL('../public/data/provenance.json',import.meta.url)));
    const catalog=createExperienceCatalog(assembleArtworkCatalog(provenance,[],featured));
    assert.deepEqual(catalog.selected.map(w=>w.id),SELECTED_WORK_IDS);
    assert.equal(catalog.selected.length,8);
    const expected={'Impossible Folds':12,Chrysalis:8,'1 of 1s (2025)':32,Liminality:8,'1 of 1s (2024)':50,Gentlemen:25,'Into The Wild':5};
    for(const work of catalog.selected){
        const collection=catalog.collection(work);
        assert.equal(collection.length,expected[work.collection],work.name);
        assert.ok(collection.some(item=>item.id===work.id));
        assert.ok(collection.every(item=>item.collection===work.collection || COLLECTION_LEAD_ARTWORK_IDS[work.collection]?.includes(item.id)));
        assert.ok(previewSource(work));
    }
    const prints=catalog.collection(catalog.byId.get('shop-print6'));
    assert.deepEqual(prints.map(w=>w.name.slice(-2)),Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')));
    const liminality=catalog.collection(catalog.selected[3]);
    assert.equal(liminality[0].id,'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0');
    assert.deepEqual(catalog.collection(liminality[0]).map(w=>w.id),liminality.map(w=>w.id),'Selecting the collection parent must retain the same rail');
});
