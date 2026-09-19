import {createStore} from './store';
import {read,readJSON,discoverGamma,scanCollection} from './scanner';
import {ordCatalog,mergeGamma,mergeWallet} from './catalog';
import {markets,type Market} from './types';
export interface MarketEnv{MARKET_WATCH_DB:D1Database}
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleSnapshot(env:MarketEnv){try{return json(await createStore(env.MARKET_WATCH_DB).snapshot());}catch{return json({error:'Live snapshots are temporarily unavailable. The last published snapshot is shown.'},503);}}
export async function handleScan(request:Request,env:MarketEnv){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Refresh from the Market Watch page.'},403);
 if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Refresh from the Market Watch page.'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json'))return json({error:'JSON is required.'},415);
 try{
  const text=await request.text();if(text.length>1024)return json({error:'Request too large.'},413);
  let input;try{input=JSON.parse(text)}catch{return json({error:'Invalid request.'},400)}
  if(!input||typeof input!=='object')return json({error:'Invalid request.'},400);
  const store=createStore(env.MARKET_WATCH_DB);
  if(input.discover===true){
   const previous=await store.catalog();
   if(!await store.claim('discovery',300000)){const cached=await store.get('catalog');return json(cached||{catalog:previous,discoveredAt:'',discoveryWarning:'Collection discovery is already running. Known collections remain available.'});}
   const results=await Promise.allSettled([read('https://ord.net/collections?sort=marketCap&q=lemonhaze').then(ordCatalog),discoverGamma(),readJSON('https://turbo.ordinalswallet.com/v2/search/lemonhaze?limit=100&t=1&include_collection_objects=true&group_collection_objects=true')]);
   const warnings:string[]=[];let catalog=results[0].status==='fulfilled'?results[0].value:previous;
   if(results[0].status==='rejected')warnings.push('Ord.net discovery unavailable');
   if(results[1].status==='fulfilled')catalog=mergeGamma(catalog,results[1].value);else warnings.push('Gamma discovery unavailable');
   if(results[2].status==='fulfilled'&&Array.isArray(results[2].value.collections))catalog=mergeWallet(catalog,results[2].value.collections);else warnings.push('Ordinals Wallet discovery unavailable');
   for(const old of previous){const current=catalog.find(c=>c.key===old.key);if(current)current.refs={...old.refs,...current.refs};else catalog.push(old);}
   // Do not make old discovery-only offer summaries appear newly checked.
   for(const c of catalog){if(results[0].status==='rejected'&&c.stats)delete c.stats.ord;if(results[1].status==='rejected'&&c.stats)delete c.stats.gamma;}
   const value={catalog,discoveredAt:new Date().toISOString(),discoveryWarning:warnings.join('. ')};await store.put('catalog',value);return json(value);
  }
  if(typeof input.key!=='string'||!markets.includes(input.market))return json({error:'Invalid collection or marketplace.'},400);
  const market=input.market as Market;const catalog=await store.catalog();const c=catalog.find(c=>c.key===input.key);if(!c?.refs[market])return json({error:'Collection source has not been mapped.'},404);
  const old=await store.result(c.key,market);
  const unchanged=(scanNote:string,cooldown=false)=>json({...old,key:c.key,market,status:old?.status||'missing',listings:old?.listings||[],listed:old?.listed??null,checkedAt:old?.checkedAt||'',message:old?.message||'',scanNote,cached:true,cooldown});
  if(market==='satflow'){
   const cooldown=await store.get<number>('satflow:cooldown');if(cooldown&&cooldown>Date.now())return unchanged('Satflow requested a cooldown. Its last snapshot is retained.',true);
  }
  if(old&&Date.now()-Date.parse(old.attemptedAt)<300000)return unchanged('A recent shared snapshot was reused.');
  if(!await store.claim(`scan:${market}:${c.key}`,300000))return unchanged('Another scan is running or recently finished.');
  if(market==='satflow'&&!await store.claim('satflow:connection',2200))return unchanged('Satflow is serving another scan. Its last snapshot is retained.');
  const r=await scanCollection(c,market);const rateLimited=r.message.includes('HTTP 429');
  if(market==='satflow'&&rateLimited)await store.put('satflow:cooldown',Date.now()+300000);
  return json({...await store.save(r),cooldown:market==='satflow'&&rateLimited});
 }catch(error){console.error('Market Watch scan failed',error instanceof Error?error.message:'Unexpected failure');return json({error:'The scan could not finish. Existing snapshots are retained.'},503);}
}
