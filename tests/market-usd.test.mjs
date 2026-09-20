import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const built=await build({entryPoints:[new URL('../src/market-watch/lib/btc-usd.ts',import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false});
const {usdFromSats,fetchBtcUsdQuote,RATE_MAX_AGE_MS}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const now=1_700_000_000_000;
const quote={usd:100_000,checkedAt:now};
test('market estimates convert satoshis, retain zero, and represent sub-cent amounts',()=>{
 assert.equal(usdFromSats(50_000_000,quote,now),'$50,000.00');
 assert.equal(usdFromSats(100_000,quote,now),'$100.00');
 assert.equal(usdFromSats(0,quote,now),'$0.00');
 assert.equal(usdFromSats(1,quote,now),'<$0.01');
 assert.equal(usdFromSats(100_000,{...quote,usd:90_000},now),'$90.00');
});
test('missing, invalid, and expired prices never display a misleading USD amount',()=>{
 for(const value of [null,undefined,NaN,Infinity,-1])assert.equal(usdFromSats(value,quote,now),null);
 for(const q of [null,{...quote,usd:0},{...quote,usd:NaN},{...quote,checkedAt:NaN},{...quote,checkedAt:now+1}])assert.equal(usdFromSats(100_000,q,now),null);
 assert.equal(usdFromSats(100_000,quote,now+RATE_MAX_AGE_MS+1),null);
});
test('spot request bypasses cache and validates currency, amount and HTTP status',async t=>{
 let body={data:{base:'BTC',currency:'USD',amount:'98765.43'}};let status=200;let request;
 t.mock.method(globalThis,'fetch',async(url,options)=>{request={url,options};return new Response(JSON.stringify(body),{status});});
 const signal=new AbortController().signal;
 const q=await fetchBtcUsdQuote(signal);
 assert.equal(q.usd,98765.43);assert.ok(q.checkedAt>0);
 assert.match(request.url,/BTC-USD\/spot$/);assert.equal(request.options.cache,'no-store');assert.equal(request.options.signal,signal);
 for(const data of [{currency:'EUR',amount:'1000'},{base:'ETH',currency:'USD',amount:'1000'},{currency:'USD',amount:'bad'},{currency:'USD',amount:'0'},{currency:'USD',amount:'-1'},{}]){
  body={data};await assert.rejects(fetchBtcUsdQuote(signal));
 }
 status=503;await assert.rejects(fetchBtcUsdQuote(signal));
});
