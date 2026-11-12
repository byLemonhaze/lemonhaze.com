import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createExperienceCatalog, viewingMode, immersiveUrl, previewSource, websiteDestination } from '../src/immersive/model.js';
import { SELECTED_WORK_IDS } from '../src/curation/selection.js';
import { fetchFeaturedCollections } from '../src/data/featured-collections.js';
import { assembleArtworkCatalog } from '../src/data/catalog.js';
import { normalizeBBCollection, CHRONOLOGY_BY_YEAR } from '../src/data.js';
import { isExploreWork, originalFor } from '../src/immersive/roster.js';
import { buildExploreLayout, CORE_PLACEMENTS, lemonContains } from '../src/immersive/layout.js';
import preservedCore from '../src/immersive/core-placements.json' with { type: 'json' };
import previewManifest from '../src/immersive/preview-manifest.json' with { type: 'json' };
import { collectionEntry } from '../src/immersive/collections.js';
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
    const catalog=createExperienceCatalog(assembleArtworkCatalog(provenance,normalizeBBCollection(JSON.parse(await readFile(new URL('../public/data/collections/best-before.json',import.meta.url)))),featured));
    assert.deepEqual(catalog.selected.map(w=>w.id),SELECTED_WORK_IDS);
    assert.equal(catalog.selected.length,8);
    assert.equal(catalog.galleryCollections.has('Provenance'),false);
    assert.ok(catalog.all.some(work=>work.name==='Stuntman'),'root infrastructure records stay available');
    assert.equal(catalog.explore.length,1414);
    assert.equal(new Set(catalog.explore.map(work=>work.id)).size,1414);
    assert.deepEqual(catalog.explore.slice(0,8).map(work=>work.id),SELECTED_WORK_IDS);
    const displayed=new Set(catalog.explore.map(work=>work.id));
    for(const work of catalog.all){
        if(!isExploreWork(work))continue;
        const original=originalFor(work,catalog.byId);
        assert.ok(original,`Missing original for ${work.name}`);
        assert.ok(displayed.has(original.id),`${work.name} must resolve to an included original`);
        if(original.id!==work.id)assert.ok(!displayed.has(work.id),'Edition must not be a separate Explore item');
    }
    assert.equal(catalog.explore.filter(w=>w.collection==='BEST BEFORE').length,421);
    assert.equal(catalog.explore.filter(w=>w.collection==='Manufactured').length,422);
    assert.equal(catalog.explore.filter(w=>w.name==='Deprivation').length,1);
    assert.equal(catalog.explore.filter(w=>/^Deprivation #/.test(w.name)).length,0);
    assert.ok(catalog.explore.some(w=>w.name==='Uncut Gem (Miami Edition - 1/1s)'),'The word Edition must not remove a unique artwork');
    assert.deepEqual(catalog.galleryCollections.get('Deprivation (Prints)').map(w=>w.name),['Deprivation']);
    assert.equal(catalog.galleryCollections.get('Trilogy (Prints)').length,3);
    assert.equal(catalog.galleryCollections.get('Chrysalis').length,8);
    const collectionNames=[...catalog.galleryCollections.keys()];
    assert.deepEqual(collectionNames.slice(0,5),['Selected works','Gentlemen','Impossible Folds','Montreal','BEST BEFORE']);
    const authoredYears=collectionNames.slice(5).map(name=>Number(Object.entries(CHRONOLOGY_BY_YEAR).find(([,names])=>names.includes(name))?.[0])).filter(Boolean);
    assert.deepEqual(authoredYears,[...authoredYears].sort((a,b)=>b-a),'Unpinned collections run newest to oldest');
    const layout=buildExploreLayout(catalog.explore);
    catalog.selected.forEach((work,index)=>assert.deepEqual(layout.placements.get(work.id),CORE_PLACEMENTS[index]));
    const trio=['Wu Wei','Ikigai','Lagom'].map(name=>layout.placements.get(catalog.explore.find(w=>w.name===name).id));
    for(let a=0;a<trio.length;a++)for(let b=a+1;b<trio.length;b++)assert.ok(Math.hypot(trio[a][0]-trio[b][0],trio[a][1]-trio[b][1])>1400,'The Chrysalis trio must not be adjacent');
    for(const name of ['BEST BEFORE','Manufactured'])assert.equal(catalog.explore.filter(w=>w.collection===name&&Math.hypot(...layout.placements.get(w.id).slice(0,2))<2200).length,2);
    for(const work of catalog.explore){
        assert.ok(previewManifest[work.id],`${work.name} needs a verified local preview`);
        if(preservedCore[work.id])assert.deepEqual(layout.placements.get(work.id),preservedCore[work.id],'The approved landing must not move');
    }
    assert.ok(!catalog.explore.some(w=>/punch card/i.test(w.name)));
    const fieldRadius=Math.max(...[...layout.placements.values()].map(p=>Math.hypot(p[0],p[1])));
    const gentlemen=catalog.explore.filter(w=>w.collection==='Gentlemen');
    assert.equal(gentlemen.length,25);
    assert.ok(gentlemen.every(w=>Math.hypot(...layout.placements.get(w.id).slice(0,2))<fieldRadius/2),'Every Gentleman must stay in the inner half');
    const allPoints=[...layout.placements.values()];
    for(let a=8;a<allPoints.length;a++)for(let b=0;b<a;b++){
        const p=allPoints[a],q=allPoints[b];
        assert.ok(Math.abs(p[0]-q[0])>=(p[2]+q[2])/2 || Math.abs(p[1]-q[1])>=(p[3]+q[3])/2,'Archive placements must not overlap');
    }
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


test('Website home is independent of artwork-detail destinations',()=>{
    assert.equal(websiteDestination(),'/?view=website');
    assert.equal(websiteDestination(null),'/?view=website');
    assert.equal(websiteDestination({id:'inscription-i0'}),'/inscription-i0?view=website');
    assert.equal(websiteDestination({id:'shop-print5',href:'/shop'}),'/shop?view=website&work=shop-print5');
});

test('new gallery collections enter in the middle, while the curated entry stays first',()=>{
    assert.equal(collectionEntry('Chrysalis',Array(8)),3);
    assert.equal(collectionEntry('Gentlemen',Array(25)),12);
    assert.equal(collectionEntry('Deprivation (Prints)',Array(1)),0);
    assert.equal(collectionEntry('Selected works',Array(8)),0);
});

test('the emoji outline retains the fruit, leaf and the indentation between them',()=>{
    assert.equal(lemonContains(0,0,100),true);
    assert.equal(lemonContains((20-96)*100,(60-86)*100,100),true);
    assert.equal(lemonContains((28-96)*100,(113-86)*100,100),false);
    assert.equal(lemonContains(20000,20000,100),false);
});
