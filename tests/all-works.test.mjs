import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fetchFeaturedCollections} from '../src/data/featured-collections.js';
import {assembleArtworkCatalog} from '../src/data/catalog.js';
import {collectionIndex,searchCollections,representativeWorks} from '../src/curation/all-works.js';

test('All Works keeps unlisted collections discoverable and searches titles, accents and year',()=>{
    const works=[{id:'1',name:'Café at dusk',collection:'New Studio Series',timestamp:'2022-01-01'}, {id:'2',name:'Lucky Belly',collection:'Into The Wild',timestamp:'2026-03-25'}];
    const index=collectionIndex(works,name=>name.toLowerCase().replaceAll(' ','-'));
    const extra=index.find(g=>g.name==='New Studio Series');
    assert.equal(extra.year,'2022');assert.equal(extra.href,'/new-studio-series');
    assert.equal(searchCollections(index,'cafe')[0].matches[0].id,'1');
    assert.equal(searchCollections(index,'lucky belly')[0].name,'Into The Wild');
    assert.ok(searchCollections(index,'2022').some(g=>g===extra||g.name===extra.name));
    assert.equal(searchCollections(index,'no-such-artwork-name').length,0);
    assert.equal(new Set(index.flatMap(g=>g.works.map(w=>w.id))).size,works.length);
});

test('collection covers sample actual works instead of the parent and collection lead',()=>{
    const works=[{id:'parent',role:'parent'},{id:'lead'},...Array.from({length:7},(_,i)=>({id:String(i)}))];
    assert.deepEqual(representativeWorks(works,['lead']).map(w=>w.id),['0','3','6']);
    assert.deepEqual(representativeWorks([{id:'only'}]).map(w=>w.id),['only']);
    assert.deepEqual(representativeWorks([]),[]);
});

test('1 of 1s 2026 uses the artist-selected parent, Passe-Partout and Wilderness covers',async()=>{
    const works=JSON.parse(await readFile(new URL('../public/data/provenance.json',import.meta.url)));
    const group=collectionIndex(works,()=> 'one-of-ones').find(group=>group.name==='1 of 1s (2026)');
    assert.deepEqual(group.covers.map(work=>work.name),['Gentleman: Special Edition 2026','Paint Engine v1.07 [Passe-Partout]','Wilderness']);
});

test('artist-selected Gentlemen and Miscellaneous covers retain their exact order',async()=>{
    const works=JSON.parse(await readFile(new URL('../public/data/provenance.json',import.meta.url)));
    const index=collectionIndex(works,()=> 'collection');
    assert.deepEqual(index.find(g=>g.name==='Gentlemen').covers.map(w=>w.name),['Gentleman Nº1','Gentleman Nº3','Gentleman Nº5']);
    assert.deepEqual(index.find(g=>g.name==='Miscellaneous').covers.map(w=>w.name),['Saint-Tropez','C mon ❤️','Kahnawake']);
});

test('edition covers use distinct originals and collections follow newest-first dates',async()=>{
    const works=JSON.parse(await readFile(new URL('../public/data/provenance.json',import.meta.url)));
    const originalFetch=globalThis.fetch;let featured;
    try{globalThis.fetch=async url=>new Response(await readFile(new URL('../public'+url,import.meta.url)));featured=await fetchFeaturedCollections({strict:true});}
    finally{globalThis.fetch=originalFetch;}
    const index=collectionIndex(assembleArtworkCatalog(works,[],featured),()=> 'collection');
    assert.deepEqual(index.find(g=>g.name==='Tin Box of Solitude').covers.map(w=>w.name),['Fisherman','Tea Pot','Bacon & Butcher']);
    assert.deepEqual(index.find(g=>g.name==='La Tentation').covers.map(w=>w.name),['La Tentation Nº 1','La Tentation Nº 8','La Tentation Nº0']);
    assert.deepEqual(index.find(g=>g.name==='Manufactured').covers.map(w=>w.name),['Manufactured Nº77','Manufactured Nº7','Manufactured Nº107']);
    assert.deepEqual(index.find(g=>g.name==='1 of 1s (2025)').covers.map(w=>w.name),['Gentleman SE25',"Chanchanok's Temple",'Minute, papillon!']);
    const trilogy=index.find(g=>g.name==='Trilogy (Prints)').covers;
    assert.equal(trilogy.length,3);assert.equal(new Set(trilogy.map(w=>w.id)).size,3);
    assert.deepEqual(new Set(trilogy.map(w=>w.name)),new Set(['Off-Kilter','Glass Breaker','Mending Out']));
    assert.equal(index.find(g=>g.name==='Satoshi (Original & Editions)').covers.length,1);
    assert.ok(index.find(g=>g.name==='1 of 1s (2025)').covers.every(w=>!trilogy.some(t=>t.id===w.id)));
    for(let i=1;i<index.length;i++)if(index[i].year===index[i-1].year)assert.ok((index[i-1].chronology||0)>=(index[i].chronology||0));
});

test('five verified Ethereum releases have local previews and direct token links',async()=>{
    const works=JSON.parse(await readFile(new URL('../src/data/ethereum-works.json',import.meta.url)));
    assert.equal(works.length,5);
    for(const work of works){
        assert.match(work.marketplace,new RegExp('/'+work.contract+'/'+work.tokenId+'$'));
        const image=await readFile(new URL('../public'+work.preview,import.meta.url));
        assert.equal(image.subarray(0,4).toString(),'RIFF');
    }
    const index=collectionIndex(works,()=> 'unused').filter(g=>g.ethereum);
    assert.deepEqual(index.map(g=>g.name),['Marilyn Monero','Boulogne Editions','Rich Bean Editions',"Murky by John D'Oeufs",'Bell Street Style']);
    assert.equal(searchCollections(index,'marilyn')[0].matches[0].id,'eth-marilyn');
});
