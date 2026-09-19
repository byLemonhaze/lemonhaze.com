import initial from './initial.json';
import type {Collection,Result,Snapshot} from './types';
export function createStore(db:D1Database){
 if(!db)throw Error('Market snapshot storage is unavailable');
 async function get<T>(key:string):Promise<T|null>{const row=await db.prepare('SELECT value FROM market_watch_snapshots WHERE key=?').bind(key).first<{value:string}>();return row?JSON.parse(row.value):null;}
 async function put(key:string,value:unknown){await db.prepare('INSERT INTO market_watch_snapshots (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(key,JSON.stringify(value),new Date().toISOString()).run();}
 async function claim(name:string,ttl:number){const now=Date.now();const row=await db.prepare('INSERT INTO market_watch_leases(name,expires_at) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET expires_at=excluded.expires_at WHERE market_watch_leases.expires_at <= ? RETURNING name').bind(name,now+ttl,now).first();return !!row;}
 async function snapshot():Promise<Snapshot>{const rows=await db.prepare('SELECT key,value FROM market_watch_snapshots').all<{key:string;value:string}>();const s=structuredClone(initial) as Snapshot;for(const row of rows.results){const v=JSON.parse(row.value);if(row.key==='catalog')Object.assign(s,v);else if(row.key.startsWith('result:'))s.results[row.key.slice(7)]=v;}return s;}
 async function catalog(){return (await get<{catalog:Collection[]}>('catalog'))?.catalog||(initial as Snapshot).catalog;}
 async function result(key:string,market:string){return await get<Result>(`result:${market}:${key}`)||(initial as Snapshot).results[`${market}:${key}`]||null;}
 async function save(r:Result){const old=await result(r.key,r.market);if(r.status==='error'&&old?.checkedAt)r={...old,status:'error',attemptedAt:r.attemptedAt,message:r.message};await put(`result:${r.market}:${r.key}`,r);return r;}
 return {get,put,claim,snapshot,catalog,result,save};
}
