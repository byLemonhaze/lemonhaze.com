import test from 'node:test';
import assert from 'node:assert/strict';
import { rateNetwork, networkHash } from '../server/shop/http.js';
import { metadataFor } from '../src/seo/metadata.js';
import { structuredDataFor } from '../src/seo/structured-data.js';
import { onRequestGet } from '../functions/api/inscription-metadata.ts';
import { ARTWORKS } from '../shared/shop-artworks.js';
import { TEXTILES } from '../shared/shop-textiles.js';

test('IPv6 privacy addresses share the rate cap, distinct networks do not',async()=>{
 assert.equal(rateNetwork('2001:db8:1234:1::12'),rateNetwork('2001:0db8:1234:0001:ffff:abcd:12:34'));
 assert.notEqual(rateNetwork('2001:db8:1234:1::12'),rateNetwork('2001:db8:1234:2::12'));
 assert.equal(rateNetwork('::ffff:192.0.2.1'),'192.0.2.1');
 const env={SHOP_RATE_SECRET:'only-a-test-secret'};
 const hash=ip=>networkHash(env,new Request('https://example.test',{headers:{'cf-connecting-ip':ip}}));
 assert.equal(await hash('2001:db8::1'),await hash('2001:db8::f'));
 assert.doesNotMatch(await hash('2001:db8::1'),/2001/);
});
test('prelaunch search metadata matches the visible shop without offers',()=>{
 const metadata=metadataFor({path:'/shop'});
 assert.match(metadata.description,/Price on request/);
 assert.doesNotMatch(metadata.description,/500|800|169|420/);
 const data=structuredDataFor(metadata);
 assert.doesNotMatch(JSON.stringify(data),/"(?:offers|price|availability)"/i);
 const products=data['@graph'].filter(node=>Array.isArray(node['@type']));
 assert.equal(products.length,ARTWORKS.length+TEXTILES.length);
 assert.equal(products.filter(node=>node.artMedium.includes('print')).length,ARTWORKS.length);
 assert.ok(data['@graph'].some(node=>node['@id']===products[0].creator['@id']));
});
test('inscription metadata validates IDs and caches successful upstream reads only',async t=>{
 const originalFetch=globalThis.fetch, originalCaches=globalThis.caches;
 t.after(()=>{globalThis.fetch=originalFetch;globalThis.caches=originalCaches;});
 const values=new Map(),pending=[];let calls=0, fail=false;
 globalThis.caches={default:{match:async req=>values.get(req.url)?.clone(),put:async(req,res)=>{values.set(req.url,res);}}};
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);if(fail)throw Error('offline');return Response.json({number:null,address:'public-inscription-owner'});};
 const invoke=id=>onRequestGet({request:new Request('https://example.test/api/inscription-metadata?inscription_id='+encodeURIComponent(id)),waitUntil:p=>pending.push(p)});
 for(const id of ['bad','../path','a'.repeat(64)+'i01','A'.repeat(64)+'i0'])assert.equal((await invoke(id)).status,400);
 assert.equal(calls,0);
 const id='a'.repeat(64)+'i0';const first=await invoke(id);
 assert.equal((await first.json()).number,null);await Promise.all(pending);
 assert.match((await invoke(id)).headers.get('cache-control'),/max-age=300/);assert.equal(calls,1);
 fail=true;const failed=await invoke('b'.repeat(64)+'i0');assert.equal(failed.headers.get('cache-control'),'no-store');
 assert.equal((await failed.json()).warning,'hiro_unavailable');assert.equal(values.size,1);
});
