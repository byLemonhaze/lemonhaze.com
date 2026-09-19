import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
async function load(file){const r=await build({entryPoints:[new URL(file,import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
const {deduplicate}=await load('../src/market-watch/lib/types.ts');
const {svelteJSON,canonicalId}=await load('../src/market-watch/lib/parsers.ts');
const {handleScan}=await load('../src/market-watch/lib/service.ts');
const id='a'.repeat(64)+'i1';
const row=(market,key='a',status='ok',inscription=id)=>({market,key,status,checkedAt:'2026-09-19',listings:[{id:inscription,name:'Edition',price:10000,url:'https://example.com'}]});
test('Market Watch counts exact IDs once across aliases and distinguishes editions',()=>{const r=deduplicate([row('ord'),row('ord','alias'),row('gamma'),row('satflow','b','ok','a'.repeat(64)+'i2')]);assert.equal(r.length,2);assert.equal(r[0].observations.length,2)});
test('stale or unavailable snapshots cannot assert current cross-listings',()=>{assert.equal(deduplicate([row('ord'),row('gamma','a','error')])[0].observations.length,1);assert.equal(canonicalId('Manufactured #1'),null)});
test('public-page parsing accepts data but never evaluates page code',()=>{assert.deepEqual(svelteJSON('{name:"Braces {inside}",floor:.0039}'),{name:'Braces {inside}',floor:.0039});assert.throws(()=>svelteJSON('{bad:alert("execute")}'))});
test('scan endpoints reject cross-origin calls before accessing storage',async()=>{const request=new Request('https://lemonhaze.com/api/market-watch/scan',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'},body:'{}'});assert.equal((await handleScan(request,{})).status,403)});
test('scan endpoints reject non-JSON, oversized and malformed inputs',async()=>{const req=(body,headers={})=>new Request('https://lemonhaze.com/api/market-watch/scan',{method:'POST',headers,body});assert.equal((await handleScan(req('{}'),{})).status,415);assert.equal((await handleScan(req('x'.repeat(1025),{'Content-Type':'application/json'}),{})).status,413);assert.equal((await handleScan(req('broken',{'Content-Type':'application/json'}),{})).status,400)});
const {artworkName}=await load('../src/market-watch/lib/artwork-names.ts');
const {inscriptionTitle,enrichArtworkTitles}=await load('../src/market-watch/lib/inscription-titles.ts');
test('cross-listing titles use the actual BEST BEFORE edition regardless of market order',()=>{
 const inscription='c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i340';
 const a=row('ord','best-before','ok',inscription);a.listings[0].name='BEST BEFORE by Lemonhaze x ORDINALLY #106556133';
 const b=row('gamma','best-before','ok',inscription);b.listings[0].name='BEST BEFORE Nº341';
 for(const results of [[a,b],[b,a]])assert.equal(deduplicate(results)[0].name,'BEST BEFORE Nº341');
 assert.equal(artworkName(inscription,a.listings[0].name),'BEST BEFORE Nº341');
});
test('unknown artwork prefers an edition title and never promotes inscription numbers to editions',()=>{
 assert.equal(artworkName(id,'Collection #106556133','Print #6'),'Print #6');
 assert.equal(artworkName(id,'#106556133'),'Untitled work');
});
test('inscription metadata takes precedence over the explorer page title',()=>{
 const page='<title>Inscription 106556133</title><dt>metadata</dt><dd><dl><dt>Name</dt><dd>BEST BEFORE N&#186;341</dd></dl></dd>';
 assert.equal(inscriptionTitle(page,'text/html',true),'BEST BEFORE Nº341');
 assert.equal(inscriptionTitle('<title>Inscription 106556133</title>','text/html',true),null);
 assert.equal(inscriptionTitle('<title>Print &amp; ink #7</title><script>throw Error()</script>','image/svg+xml'),'Print & ink #7');
});
test('scan title fallback reads inscription metadata once, then reuses its cache',async t=>{
 let requests=0;const values=new Map();const cache={get:async k=>values.get(k)||null,put:async(k,v)=>{values.set(k,v)}};
 t.mock.method(globalThis,'fetch',async url=>{
  requests++;assert.equal(url,`https://ordinals.com/inscription/${id}`);
  return new Response('<title>Inscription 12345678</title><dt>metadata</dt><dd><dl><dt>Name</dt><dd>Artwork Nº7</dd></dl></dd>',{headers:{'Content-Type':'text/html'}});
 });
 const r=row('ord');r.listings[0].name='#12345678';
 assert.equal((await enrichArtworkTitles(r,cache)).listings[0].name,'Artwork Nº7');
 assert.equal((await enrichArtworkTitles(r,cache)).listings[0].name,'Artwork Nº7');
 assert.equal(requests,1);
});

test('embedded styles are scoped and keep the host visible at phone widths',async()=>{
 const {readFile}=await import('node:fs/promises');const {default:postcss}=await import('postcss');
 const css=postcss.parse(await readFile(new URL('../src/market-watch/market-watch.css',import.meta.url),'utf8'));
 css.walkRules(rule=>{
  if(rule.parent.name?.includes('keyframes'))return;
  for(const selector of rule.selectors){
   assert.ok(selector.startsWith('.market-watch'),`Unscoped selector: ${selector}`);
   if(selector.trim()==='.market-watch')rule.walkDecls('display',decl=>assert.notEqual(decl.value,'none'));
  }
 });
});

const {canonicalSnapshot,canonicalCatalog}=await load('../src/market-watch/lib/collection-policy.ts');
const {mergeGamma,mergeWallet}=await load('../src/market-watch/lib/catalog.ts');
const {scanCollection}=await load('../src/market-watch/lib/scanner.ts');
const {readFile}=await import('node:fs/promises');
const seed=JSON.parse(await readFile(new URL('../src/market-watch/lib/initial.json',import.meta.url),'utf8'));
test('Ord.net defines the roster; excluded and duplicate market rows leave every total',()=>{
 const s=canonicalSnapshot(seed);
 assert.equal(s.catalog.length,49);
 assert.ok(s.catalog.every(c=>c.refs.ord));
 assert.ok(!s.catalog.some(c=>/provenance|colors|^off-kilter$|^glass breaker$|^mending out$/i.test(c.name)));
 assert.ok(Object.values(s.results).every(r=>s.catalog.some(c=>c.key===r.key)));
 const trilogy=s.catalog.find(c=>c.name==='Trilogy');
 assert.equal(trilogy.refs.gamma.sources.length,3);
 assert.equal(s.results['gamma:'+trilogy.key].listed,1);
 assert.equal(s.results['gamma:minute-papillon-editions-by-lemonhaze'].listed,1);
 assert.deepEqual(canonicalSnapshot(s),s);
});
test('legacy print snapshots survive a saved canonical catalogue before the next scan',()=>{
 const s=canonicalSnapshot({...seed,catalog:canonicalCatalog(seed.catalog)});
 assert.equal(s.results['gamma:trilogy-prints-by-lemonhaze'].listed,1);
 assert.equal(s.results['gamma:minute-papillon-editions-by-lemonhaze'].listed,1);
});
test('Gamma and wallet discovery attach sources but cannot create collection rows',()=>{
 const catalog=canonicalCatalog(seed.catalog);
 const stats=seed.catalog.filter(c=>c.refs.gamma).map(c=>({collection:{id:c.refs.gamma.id,name:c.name,chain:'bitcoin',creator_user_ref:{slug:'lemonhaze'},type:c.refs.gamma.type,location_url:c.refs.gamma.url}}));
 const merged=mergeGamma(catalog,stats);
 assert.equal(merged.length,catalog.length);
 assert.equal(merged.find(c=>c.name==='Trilogy').refs.gamma.sources.length,3);
 const wallet=mergeWallet(merged,[{name:'Colors by Lemonhaze',slug:'colors-by-lemonhaze'},{name:'Provenance by Lemonhaze',slug:'provenance-by-lemonhaze'},{name:'New unmapped by Lemonhaze',slug:'new'}]);
 assert.equal(wallet.length,catalog.length);
});
test('Trilogy scans all three Gamma print feeds and deduplicates their inscriptions',async t=>{
 const c=canonicalCatalog(seed.catalog).find(c=>c.name==='Trilogy');const calls=[];
 t.mock.method(globalThis,'fetch',async raw=>{
  const url=new URL(raw);const print=url.searchParams.get('print_id');calls.push(print);
  assert.ok(c.refs.gamma.sources.some(s=>s.id===print));
  return Response.json({items:[{id,name:'Print #1',market_summary:{listing:{price_amount:{unit:'sats',amount:10000+calls.length}}}}]});
 });
 const r=await scanCollection(c,'gamma');
 assert.equal(calls.length,3);assert.equal(r.status,'ok');assert.equal(r.listed,1);assert.equal(r.floor,10001);
});
test('a failed Gamma print feed leaves the combined row partial, not falsely complete',async t=>{
 const c=canonicalCatalog(seed.catalog).find(c=>c.name==='Trilogy');let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{
  if(++calls===1)return new Response('Unavailable',{status:503});
  return Response.json({items:[{id,name:'Print #1',market_summary:{listing:{price_amount:{unit:'sats',amount:10000}}}}]});
 });
 const r=await scanCollection(c,'gamma');
 assert.equal(r.status,'partial');assert.equal(r.listed,1);assert.match(r.message,/2 of 3/);
});
