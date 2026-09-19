import { Collection, Listing, Market, Result } from './types';
import {balanced,dataBlock,svelteJSON,rscText,jsonBlock,canonicalId,sats} from './parsers';
const MAX_PAGES=25;
export async function read(url:string){const res=await fetch(url,{headers:{Accept:'application/json,text/html;q=0.9','Cache-Control':'no-cache','User-Agent':'LemonhazeMarketWatch/1.0 (read-only personal collection tracker)'},signal:AbortSignal.timeout(18000)});if(!res.ok)throw Error(`Source returned HTTP ${res.status}`);const text=await res.text();if(text.length>8_000_000)throw Error('Source response too large');return text;}
export const readJSON=async(url:string)=>JSON.parse(await read(url));
export function gammaURL(path:string,params:Record<string,unknown>){const u=new URL('https://gamma.io/api/'+path);for(const [k,v]of Object.entries(params))if(v!==undefined&&v!==null)u.searchParams.set(k,String(v));return u.href;}
export async function discoverGamma(){const all:any[]=[];let page:unknown;const seen=new Set();for(let i=0;i<MAX_PAGES;i++){const d=await readJSON(gammaURL('get-collection-stats',{created_by_user_slug_or_address:'lemonhaze',chain:'bitcoin',sort:'newest',page}));if(!Array.isArray(d.collection_stats))throw Error('Gamma collection format changed');all.push(...d.collection_stats);if(d.next_page==null)return all;if(seen.has(d.next_page))throw Error('Gamma pagination repeated');seen.add(d.next_page);page=d.next_page;}throw Error('Gamma discovery page limit reached');}
function ordData(html:string){const p=html.indexOf('pageData:{');if(p<0)throw Error('Ord.net page data unavailable');const s=html.slice(p);const collection=svelteJSON(balanced(s,s.indexOf('collection:{')+'collection:'.length));const items=svelteJSON(balanced(s,s.indexOf('items:[')+'items:'.length));return {collection,items};}
function validListings(items:Listing[]){const map=new Map<string,Listing>();for(const l of items){const id=canonicalId(l.id);if(!id||!sats(l.price))continue;if(l.expiresAt&&Date.parse(l.expiresAt)<Date.now())continue;const old=map.get(id);if(!old||l.price<old.price)map.set(id,{...l,id});}return [...map.values()];}
function minPrice(l:Listing[]){return l.length?Math.min(...l.map(x=>x.price)):null;}
export async function scanCollection(c:Collection,market:Market):Promise<Result>{const stamp=new Date().toISOString();const base:Result={key:c.key,market,checkedAt:stamp,attemptedAt:stamp,status:'ok',listed:null,floor:null,topOffer:null,offerCount:null,listings:[],message:''};const ref=c.refs[market];if(!ref)throw Error('No verified source mapping');
 try{
 if(market==='ord'){
  const html=await read(ref.url);const {collection,items}=ordData(html);if(collection.slug!==ref.id)throw Error('Collection identity mismatch');base.listed=collection.listed;base.floor=collection.floor==null?null:Math.round(collection.floor*1e8);base.topOffer=c.stats?.ord?.topOffer??null;
  base.listings=validListings(items.filter((x:any)=>x.listingState==='buyable').map((x:any)=>({id:x.inscriptionId,name:x.name,price:x.priceSats,url:`https://ord.net/inscription/${x.inscriptionId}`,expiresAt:x.listingExpiresAt})));
  if(base.listings.length!==base.listed){base.status='partial';base.message=`${base.listings.length} inscription IDs resolved of ${base.listed} reported listings. Lots or further pages may be present.`;}
  return base;
 }
 if(market==='gamma'){
  const listings:Listing[]=[];let cursor:any={};let complete=false;const seen=new Set();
  for(let page=0;page<MAX_PAGES;page++){
   const d=await readJSON(gammaURL('get-inscriptions',{[ref.type==='print'?'print_id':'collection_id_or_slug']:ref.id,availability:'for_sale',sort:'lowest_price',...cursor}));if(!Array.isArray(d.items))throw Error('Gamma listing format changed');
   for(const item of d.items){const l=item.market_summary?.listing;if(!l||l.has_in_progress_purchase||l.is_auction)continue;if(l.price_amount?.unit!=='sats')continue;listings.push({id:item.id,name:item.name||c.name,price:l.price_amount.amount,url:`https://gamma.io/ordinals/inscriptions/${item.id}`});}
   if(!d.next_cursor){complete=true;break}const token=JSON.stringify(d.next_cursor);if(seen.has(token))break;seen.add(token);cursor={offset:d.next_cursor.next_offset,fetch_unlisted:d.next_cursor.fetch_unlisted};
  }
  base.listings=validListings(listings);base.listed=base.listings.length;base.floor=minPrice(base.listings);base.topOffer=c.stats?.gamma?.topOffer??null;
  if(!complete){base.status='partial';base.message='Pagination incomplete; counts are a lower bound.'}return base;
 }
 if(market==='ow'){
  const listings:Listing[]=[];let partial=false;let successes=0;let expected=0;
  for(const id of ref.aliases||[ref.id]){
   try{
    const stats=await readJSON(`https://turbo.ordinalswallet.com/collection/${encodeURIComponent(id)}/stats`);if(!Number.isInteger(stats.listed))throw Error('Statistics unavailable');successes++;expected+=stats.listed;if(stats.listed===0)continue;
    const local:Listing[]=[];const seen=new Set();let done=false;
    for(let page=0;page<MAX_PAGES;page++){
     const items=await readJSON(`https://turbo.ordinalswallet.com/collection/${encodeURIComponent(id)}/inscriptions?offset=${page*64}&order=PriceAsc&listed=true&limit=64`);if(!Array.isArray(items))throw Error('Listing format changed');let newIds=0;
     for(const item of items){if(!seen.has(item.id)){seen.add(item.id);newIds++}const e=item.escrow;if(e&&sats(e.satoshi_price)&&!e.bought_at&&!e.buyer_address)local.push({id:item.id,name:item.meta?.name||c.name,price:e.satoshi_price,url:`https://ordinalswallet.com/inscription/${item.id}`});}
     if(validListings(local).length>=stats.listed||items.length<64){done=true;break}if(!newIds)break;
    }
    listings.push(...local);if(!done||validListings(local).length!==stats.listed)partial=true;
   }catch{partial=true;}
  }
  if(!successes)throw Error('Collection statistics unavailable on Ordinals Wallet');base.listings=validListings(listings);base.listed=base.listings.length;base.floor=minPrice(base.listings);
  if(partial){base.status='partial';base.message=`${expected} listings reported across collection aliases; ${base.listed} active inscription IDs resolved. Displayed count is a lower bound.`;}return base;
 }
 if(market==='satflow'){
  const html=await read(ref.url);const serialized=rscText(html);if(!serialized.includes('"collectionData":'))throw Error('No public collection page found at the mapped Satflow URL');const stats=jsonBlock(serialized,'"collectionData":')[0];if(stats?.collectionSlug!==ref.id)throw Error('Collection mapping unavailable on Satflow');
  const snapshot=await satOrderbook(ref.id);
  const {orders,complete}=snapshot;const asks=orders.filter((o:any)=>o.orderType==='ask');const bids=orders.filter((o:any)=>o.orderType==='bid'&&(!o.expiry||o.expiry>Date.now()));
  base.listings=validListings(asks.filter((o:any)=>!o.lotId).map((o:any)=>({id:o.inscription?.id,name:o.inscription?.metadata?.meta?.token?.name||c.name,price:o.price,url:`https://www.satflow.com/ordinal/${o.inscription?.id}`,origin:o.platforms?.join(', ')||'unknown'})));
  base.listed=base.listings.length;base.floor=minPrice(base.listings);base.bids=bids.filter((b:any)=>sats(b.price)).map((b:any)=>({id:b._id,price:b.price,scope:canonicalId(b.inscription?.id)?'inscription':'collection',inscriptionId:canonicalId(b.inscription?.id)||undefined,expiresAt:b.expiry?new Date(b.expiry).toISOString():null,url:ref.url}));base.offerCount=bids.length;base.topOffer=bids.length?Math.max(...bids.map((b:any)=>sats(b.price)||0))||null:null;
  if(!complete||asks.some((x:any)=>x.lotId)){base.status='partial';base.message='Orderbook snapshot is incomplete or contains lots. Counts are a lower bound.'}else if(Number.isInteger(stats.listedItems)&&stats.listedItems!==base.listed){base.status='partial';base.message=`The collection summary reports ${stats.listedItems} listings; ${base.listed} inscription IDs were returned by the orderbook. The source may be delayed or using different market coverage.`;}return base;
 }
 }catch(error){base.status='error';base.message=error instanceof Error?error.message:'Source unavailable';base.checkedAt='';}
 return base;
}
async function satOrderbook(slug:string):Promise<{orders:any[];complete:boolean}>{
 // Public anonymous orderbook subscription. No wallet, signature, or trade methods.
 const response=await fetch('https://backend.satflow.com',{headers:{Upgrade:'websocket'},signal:AbortSignal.timeout(12000)});
 const ws=response.webSocket;if(!ws)throw Error(`Satflow public orderbook unavailable (HTTP ${response.status})`);ws.accept();
 return new Promise((resolve,reject)=>{const orders=new Map<string,any>();let pages=0,settled=false;let prior='';const timer=setTimeout(()=>finish(false),16000);
 function finish(complete:boolean,error?:string){if(settled)return;settled=true;clearTimeout(timer);try{ws!.close(1000,'Snapshot captured')}catch{}if(error)reject(Error(error));else if(!complete&&!orders.size)reject(Error('Satflow orderbook timed out'));else resolve({orders:[...orders.values()],complete});}
 function filter(cursors:Record<string,unknown>={}){ws!.send(JSON.stringify({action:'filter-orders',data:{'filter-orders':{orderType:['ask','bid'],inscriptionType:['collectionItem'],collectionSlug:[slug],cursors}}}));}
 ws.addEventListener('message',event=>{try{const d=JSON.parse(String(event.data));if(d.error)return finish(false,'Satflow: '+String(d.error).slice(0,100));if(d['filter-orders'])ws!.send(JSON.stringify({action:'init',data:{requestId:crypto.randomUUID()}}));for(const o of d.orders||[])orders.set(o._id,o);if(d.init?.message?.includes('complete')){if(d.init.endReached===true)return finish(true);const cursor=JSON.stringify(d.init.cursors||{});if(cursor===prior||++pages>=10)return finish(false);prior=cursor;filter(d.init.cursors);}}catch{finish(false,'Satflow response format changed')}});
 ws.addEventListener('error',()=>finish(false,'Satflow connection failed'));ws.addEventListener('close',()=>{if(!settled)finish(false)});filter();
 });
}
