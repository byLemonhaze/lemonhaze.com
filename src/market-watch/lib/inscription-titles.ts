import {artworkName,hasArtworkTitle,isGenericTitle} from './artwork-names';
import type {Result} from './types';
type TitleCache = {get<T>(key:string):Promise<T|null>;put(key:string,value:unknown):Promise<void>};
type CachedTitle = {name:string|null;checkedAt:number};
function clean(value:string) {
    return value.replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[\da-f]+|\d+);/gi, entity => {
        const named:Record<string,string> = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
        if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
        const n = entity[2].toLowerCase()==='x' ? parseInt(entity.slice(3,-1),16) : parseInt(entity.slice(2,-1),10);
        return n>0 && n<=0x10ffff ? String.fromCodePoint(n) : '';
    }).replace(/\s+/g,' ').trim().slice(0,200);
}
export function inscriptionTitle(content:string, type:string, metadataOnly=false) {
    let raw:string|undefined;
    if (type.includes('json')) {
        try {const data=JSON.parse(content);raw=data.name||data.title||data.meta?.name;} catch {return null;}
    } else if (/html|svg|xml/.test(type)) {
        // Read text only. Never execute an inscription's JavaScript or follow its redirects.
        const metadata=content.split(/<dt>metadata<\/dt>/i)[1]?.split(/<dt>metaprotocol<\/dt>|<dt>parent/i)[0];
        raw=metadata?.match(/<dt>(?:name|title)<\/dt>\s*<dd>([^<]*)/i)?.[1];
        if(!raw&&!metadataOnly)raw=content.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title\s*>/i)?.[1];
    }
    const name=typeof raw==='string'?clean(raw):'';
    return name && !isGenericTitle(name) ? name : null;
}
async function readTitlePage(id:string, metadataOnly:boolean) {
    const response=await fetch(`https://ordinals.com/${metadataOnly?'inscription':'content'}/${id}`,{signal:AbortSignal.timeout(6000),redirect:'error',headers:{Accept:'text/html,application/json,image/svg+xml'}});
    if (!response.ok || !response.body) return null;
    const type=response.headers.get('content-type')||'';
    if (!/html|json|svg|xml/.test(type)) {await response.body.cancel();return null;}
    const reader=response.body.getReader();const decoder=new TextDecoder();let content='';let bytes=0;
    try {
        while(bytes<65536) {
            const {value,done}=await reader.read();if(done)break;
            const chunk=value.subarray(0,65536-bytes);bytes+=chunk.length;content+=decoder.decode(chunk,{stream:true});
            if (!metadataOnly && /<\/title\s*>/i.test(content)) break;
        }
        content+=decoder.decode();
        return inscriptionTitle(content,type,metadataOnly);
    } finally {await reader.cancel();}
}
async function readTitle(id:string) {
    const metadata=await readTitlePage(id,true).catch(()=>null);
    return metadata || await readTitlePage(id,false);
}
export async function enrichArtworkTitles(result:Result, cache:TitleCache) {
    const missing=[...new Set(result.listings.filter(l=>!hasArtworkTitle(l.id)&&isGenericTitle(l.name)).map(l=>l.id.toLowerCase()))];
    const resolved=new Map<string,string>();
    const pending:string[]=[];
    await Promise.all(missing.map(async id=>{
        if(!/^[a-f0-9]{64}i\d+$/.test(id))return;
        const cached=await cache.get<CachedTitle>(`title:${id}`);
        if(cached&&(cached.name||Date.now()-cached.checkedAt<86400000)){
            if(cached.name)resolved.set(id,cached.name);
        } else pending.push(id);
    }));
    // Cached IDs don't consume this budget, so later scans can resolve the next works.
    await Promise.all(pending.slice(0,4).map(async id=>{
        try {
            const name=await readTitle(id);
            await cache.put(`title:${id}`,{name,checkedAt:Date.now()});
            if(name)resolved.set(id,name);
        } catch { /* A title lookup must not fail a market snapshot. */ }
    }));
    return {...result,listings:result.listings.map(l=>({...l,name:artworkName(l.id,resolved.get(l.id.toLowerCase())||'',l.name)}))};
}
