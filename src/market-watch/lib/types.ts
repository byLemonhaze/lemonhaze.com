import {artworkName} from './artwork-names';
export const markets = ['ord','gamma','satflow','ow'] as const;
export type Market = typeof markets[number];
export const marketNames: Record<Market,string> = {ord:'Ord.net',gamma:'Gamma',satflow:'Satflow',ow:'Ordinals Wallet'};
export type Ref = {id:string;url:string;type?:string;name?:string;aliases?:string[];sources?:{id:string;url:string;type?:string;name?:string}[]};
export type Collection = {key:string;name:string;kind:string;image:string|null;supply:number|null;refs:Partial<Record<Market,Ref>>;stats?:Partial<Record<Market,{listed:number|null;floor:number|null;topOffer:number|null}>>};
export type Listing = {id:string;name:string;price:number;url:string;origin?:string;expiresAt?:string|null};
export type Bid = {id:string;price:number;scope:'collection'|'inscription';inscriptionId?:string;expiresAt:string|null;url:string};
export type Result = {key:string;market:Market;checkedAt:string;attemptedAt:string;status:'ok'|'partial'|'error'|'missing';listed:number|null;floor:number|null;topOffer:number|null;offerCount:number|null;bids?:Bid[];listings:Listing[];message:string};
export type Snapshot = {catalog:Collection[];results:Record<string,Result>;discoveredAt:string;discoveryWarning?:string};
export const resultKey=(key:string,market:Market)=>`${market}:${key}`;
export function deduplicate(results:Result[]){const byId=new Map<string,{id:string;name:string;observations:(Listing&{market:Market;key:string;checkedAt:string})[]}>();for(const r of results){if(r.status==='error'||r.status==='missing')continue;for(const l of r.listings){const id=l.id.toLowerCase();if(!/^[a-f0-9]{64}i\d+$/.test(id))continue;let group=byId.get(id);if(!group){group={id,name:artworkName(id,l.name),observations:[]};byId.set(id,group)}group.name=artworkName(id,...group.observations.map(o=>o.name),l.name);if(!group.observations.some(o=>o.market===r.market))group.observations.push({...l,id,market:r.market,key:r.key,checkedAt:r.checkedAt});}}return [...byId.values()];}
