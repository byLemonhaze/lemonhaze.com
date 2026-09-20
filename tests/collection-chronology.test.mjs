import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectionChronology, withCollectionChronology } from '../src/utils/collection-chronology.js';
import { sortedRows } from '../src/utils/sorting.js';
import { ORDINALS_SUPPLY_DATA, fetchFeaturedCollections } from '../src/data.js';
const read = async path => JSON.parse(await readFile(new URL('../public'+path,import.meta.url),'utf8'));
const originalFetch = globalThis.fetch;
let artworks;
try {
    globalThis.fetch = async url => ({ok:true,json:()=>read(url)});
    artworks = [...await read('/data/provenance.json'), ...await fetchFeaturedCollections()];
} finally { globalThis.fetch = originalFetch; }
const sorted = direction => sortedRows(withCollectionChronology(ORDINALS_SUPPLY_DATA, artworks),`chronology:${direction}`,{chronology:r=>r.chronology});
test('all Bitcoin collections have a date; newest follows parent chronology within the year',()=>{
    const rows=sorted('desc');
    assert.equal(rows.length,ORDINALS_SUPPLY_DATA.length);
    assert.ok(rows.every(row=>Number.isFinite(row.chronology)));
    assert.deepEqual(rows.slice(0,5).map(r=>r.name),['Tin Box of Solitude','Griffintown','Liminality','Into The Wild','1 of 1s (2026)']);
    assert.equal(rows[0].chronology,Date.parse('2026-09-12T03:44:32Z'));
    assert.equal(rows[3].chronology,Date.parse('2026-03-14T02:31:22Z'));
    assert.deepEqual(sorted('asc').map(r=>r.name),rows.map(r=>r.name).reverse());
});
test('annual buckets retain the actual parent date even when its year differs',()=>{
    assert.equal(collectionChronology('1 of 1s (2025)',artworks),Date.parse('2024-12-31T17:29:02Z'));
});
test('a later child cannot reorder its parent collection; missing dates remain last',()=>{
    const parent='a'.repeat(64)+'i0', child='b'.repeat(64)+'i0';
    const records=[{id:parent,collection:'Example',role:'parent',timestamp:'2024-01-03T05:00:00Z'},
        {id:child,collection:'Example',provenance:parent,timestamp:'2026-09-19T05:00:00Z'}];
    assert.equal(collectionChronology('Example',records),Date.parse('2024-01-03T05:00:00Z'));
    assert.equal(collectionChronology('Unknown',records),null);
    assert.equal(collectionChronology('L’Orphelinat',artworks),Date.parse('2023-08-16T11:00:08Z'));
    for(const direction of ['asc','desc'])assert.equal(sortedRows(withCollectionChronology([{name:'Unknown'},{name:'Example'}],records),`chronology:${direction}`,{chronology:r=>r.chronology}).at(-1).name,'Unknown');
});
