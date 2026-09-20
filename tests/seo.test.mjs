import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assembleArtworkCatalog} from '../src/data/catalog.js';
import {normalizeBBCollection} from '../src/data.js';
import {metadataFor} from '../src/seo/metadata.js';

const id = number => number.toString(16).padStart(64, '0')+'i0';
test('catalogue preserves known burned works and parents absent from the live manifest', () => {
    const burned = {id:id(1),name:'Burned work',collection:'BEST BEFORE',charms:'Burned'};
    const parent = {id:id(2),name:'Engine and diary',collection:'Provenance'};
    const placeholder = {id:'SEALED',collection:'BEST BEFORE'};
    const live = {id:id(3),name:'BEST BEFORE Nº 1',collection:'BEST BEFORE'};
    const result=assembleArtworkCatalog([burned,parent,placeholder,live],[live],[]);
    assert.deepEqual(new Set(result.map(x=>x.id)),new Set([id(1),id(2),id(3)]));
    assert.equal(result.find(x=>x.id===id(1)).charms,'Burned');
});
test('official BEST BEFORE manifest provides all 420 unique inscription IDs', async () => {
    const data=JSON.parse(await readFile(new URL('../public/data/collections/best-before.json',import.meta.url),'utf8'));
    const items=normalizeBBCollection(data);
    assert.equal(items.length,420);
    assert.equal(new Set(items.map(x=>x.id)).size,420);
    assert.ok(items.every(x=>/^[a-f0-9]{64}i\d+$/.test(x.id)));
});
test('sitemap includes every generated route once, with production canonicals', async () => {
    const routes=JSON.parse(await readFile(new URL('../public/seo/routes.json',import.meta.url),'utf8'));
    const sitemap=await readFile(new URL('../public/sitemap.xml',import.meta.url),'utf8');
    assert.equal(new Set(routes.map(r=>r.path)).size,routes.length);
    assert.equal((sitemap.match(/<loc>/g)||[]).length,routes.length);
    for(const route of routes){
        assert.equal(route.canonical,'https://lemonhaze.com'+route.path);
        assert.ok(route.description);
        assert.ok(sitemap.includes('<loc>'+route.canonical+'</loc>'));
    }
    assert.ok(routes.some(r=>r.path==='/bcf16735647186ef853dedd820c9319e9895f99bfddedcfb782ace38093bb8fbi0'),'Burned BEST BEFORE parent has a page');
});
test('artwork metadata identifies the work and does not include description markup', () => {
    const result=metadataFor({path:'/'+id(1),name:'Test & Title',kind:'artwork',collection:'Gentlemen',description:'<p>Artist notes.</p>'});
    assert.equal(result.title,'Test & Title | Lemonhaze');
    assert.equal(result.description,'Artist notes.');
});
