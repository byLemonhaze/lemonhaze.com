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
