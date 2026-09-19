import type { Collection } from './types';
import {dataBlock,svelteJSON} from './parsers';
import {normalize,canonicalCatalog,excludedCollection,matchCollection,addGammaSource} from './collection-policy';
export {normalize} from './collection-policy';
const satAliases:Record<string,string>={"deprivation-prints-by-lemonhaze": "deprivation-by-lemonhaze", "trilogy-prints-by-lemonhaze": "prints-trilogy-by-lemonhaze", "portrait-2490-by-lemonhaze": "portrait-2490", "framed-by-lemonhaze": "framed", "mirage-prints-by-lemonhaze": "mirage-by-lemonhaze", "cypherville-by-lemonhaze": "cypherville-ordinals"};
export function ordCatalog(html:string):Collection[]{
 const map=new Map<string,Collection>();for(const m of html.matchAll(/\{dbId:"[^"\n]+",slug:"[^"\n]+",name:"[^"\n]*[Ll]emonhaze[^"\n]*"/g)){const raw=svelteJSON(dataBlock(html.slice(m.index),''));if(!raw.slug||!Number.isFinite(raw.supply)||excludedCollection(raw.name))continue;const key=raw.slug;map.set(key,{key,name:raw.name,kind:/print|edition/i.test(raw.name)?'Prints & editions':/1 of 1/i.test(raw.name)?'1 of 1s':'Collection',image:raw.image||null,supply:raw.supply,refs:{ord:{id:key,url:`https://ord.net/collection/${key}`},satflow:{id:satAliases[key]||key,url:`https://www.satflow.com/ordinals/${satAliases[key]||key}`} ,ow:{id:key,url:`https://ordinalswallet.com/collection/${key}`}},stats:{ord:{listed:raw.listed,floor:raw.floor===null?null:Math.round(raw.floor*1e8),topOffer:raw.topOffer===null?null:Math.round(raw.topOffer*1e8)}}});}if(!map.size)throw Error('No Lemonhaze collections found in Ord.net page');return canonicalCatalog([...map.values()]);
}
export function mergeGamma(catalog:Collection[],stats:any[]):Collection[]{
 const result=canonicalCatalog(catalog);
 // A successful discovery replaces Gamma mappings; it never expands the Ord.net roster.
 for(const c of result){delete c.refs.gamma;if(c.stats)delete c.stats.gamma;}
 for(const s of stats){
  const g=s.collection;if(g?.chain!=='bitcoin'||g.creator_user_ref?.slug!=='lemonhaze')continue;
  const c=matchCollection(result,g.name);if(!c)continue;
  addGammaSource(c,{id:g.id,url:new URL(g.location_url.trim(),'https://gamma.io').href,type:g.type,name:g.name},{gamma:{
   listed:s.current_secondary_listings_quantity??g.stats?.listed_count??null,
   floor:s.secondary_floor_price_token_amount?.unit==='sats'?s.secondary_floor_price_token_amount.amount:null,
   topOffer:s.current_best_offer_price_token_amount?.unit==='sats'?s.current_best_offer_price_token_amount.amount:null,
  }});
 }
 return result;
}
export function mergeWallet(catalog:Collection[],collections:any[]):Collection[]{
 const result=canonicalCatalog(catalog);
 for(const g of collections){
  if(!g.name?.toLowerCase().includes('lemonhaze'))continue;
  const c=matchCollection(result,g.name);if(!c)continue;
  const old=c.refs.ow;const aliases=[...new Set([...(old?.aliases||[]),...(old?[old.id]:[]),g.slug])];
  c.refs.ow={id:old?.id||g.slug,url:old?.url||`https://ordinalswallet.com/collection/${g.slug}`,aliases};
  if(!c.image&&g.icon)c.image=g.icon;
 }
 return result;
}
