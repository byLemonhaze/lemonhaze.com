import {dateValue, sortedRows} from '../../utils/sorting.js';
import {markets, resultKey, type Collection, type Result, type Snapshot} from './types';
export const collectionSorts = [
 ['listed:desc','Most listed'], ['listed:asc','Fewest listed'],
 ['name:asc','Name A–Z'], ['name:desc','Name Z–A'],
 ['floor:asc','Lowest floor'], ['floor:desc','Highest floor'],
 ['supply:asc','Smallest supply'], ['supply:desc','Largest supply'],
 ['offer:desc','Highest top offer'], ['checked:desc','Recently checked'], ['checked:asc','Oldest check'],
];
export const crossSorts = [['name:asc','Name A–Z'],['name:desc','Name Z–A'],['price:asc','Lowest asking price'],['price:desc','Highest asking price'],['markets:desc','Most marketplaces'],['checked:desc','Recently checked']];
export const offerSorts = [['offer:desc','Highest offer'],['offer:asc','Lowest offer'],['bids:desc','Most public bids'],['name:asc','Name A–Z'],['name:desc','Name Z–A'],['checked:desc','Recently checked'],['checked:asc','Oldest check']];
const known = (values:(number|null|undefined)[]) => values.filter((v):v is number => typeof v === 'number' && Number.isFinite(v));
const minimum = (values:(number|null|undefined)[]) => {const v=known(values);return v.length?Math.min(...v):null};
const maximum = (values:(number|null|undefined)[]) => {const v=known(values);return v.length?Math.max(...v):null};
export function sortCollections(rows:Collection[], results:Snapshot['results'], sort:string) {
 const values=(c:Collection,field:keyof Result)=>markets.map(m=>results[resultKey(c.key,m)]?.[field]);
 return sortedRows(rows,sort,{
  name:(c:Collection)=>c.name,
  listed:(c:Collection)=>{const v=known(values(c,'listed') as (number|null)[]);return v.length?v.reduce((a,b)=>a+b,0):null},
  floor:(c:Collection)=>minimum(values(c,'floor') as (number|null)[]),
  supply:(c:Collection)=>c.supply,
  offer:(c:Collection)=>maximum(values(c,'topOffer') as (number|null)[]),
  checked:(c:Collection)=>maximum(values(c,'checkedAt').map(v=>dateValue(v))),
 });
}
export function sortCrossListings(rows:any[], sort:string) {
 return sortedRows(rows,sort,{
  name:(x:any)=>x.name,price:(x:any)=>minimum(x.observations.map((o:any)=>o.price)),
  markets:(x:any)=>x.observations.length,checked:(x:any)=>maximum(x.observations.map((o:any)=>dateValue(o.checkedAt))),
 },(x:any)=>x.name+' '+x.id);
}
export function sortOffers(rows:Result[], catalog:Collection[], sort:string) {
 const name=(r:Result)=>catalog.find(c=>c.key===r.key)?.name||r.key;
 return sortedRows(rows,sort,{name,offer:(r:Result)=>r.topOffer,bids:(r:Result)=>r.offerCount,checked:(r:Result)=>dateValue(r.checkedAt)},(r:Result)=>name(r)+' '+r.market);
}
