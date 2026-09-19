import type {Collection, Ref, Result, Snapshot} from './types';

const aliases:Record<string,string> = {
    'glassbreaker':'trilogy-prints-by-lemonhaze',
    'offkilter':'trilogy-prints-by-lemonhaze',
    'mendingout':'trilogy-prints-by-lemonhaze',
    'minutepapillon':'minute-papillon-editions-by-lemonhaze',
    'minutepapillon21editions':'minute-papillon-editions-by-lemonhaze',
    'gamesmanufactured':'games-by-lemonhaze',
    'satoshi':'satoshi-by-lemonhaze',
};
export function normalize(name:string) {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
        .replace(/ by lemonhaze.*$/,'').replace(/\(prints\)/g,'').replace(/1\/1s/g,'1 of 1s')
        .replace(/[^a-z0-9]/g,'').replace('miscelleneous','miscellaneous');
}
export const excludedCollection = (name:string) => ['provenance','colors'].includes(normalize(name));
export function matchCollection(catalog:Collection[],name:string) {
    if(excludedCollection(name))return undefined;
    const normalized=normalize(name);
    const alias=aliases[normalized];
    return catalog.find(c=>alias?c.key===alias:normalize(c.name)===normalized);
}
export function gammaSources(ref:Ref) {return ref.sources?.length?ref.sources:[{id:ref.id,url:ref.url,type:ref.type,name:ref.name}];}
export function addGammaSource(collection:Collection,ref:Ref,stats?:Collection['stats']) {
    const old=collection.refs.gamma;
    const sources=[...gammaSources(old||ref)];
    let added=!old;
    for(const source of gammaSources(ref))if(!sources.some(s=>s.id===source.id)){sources.push(source);added=true;}
    collection.refs.gamma={...sources[0],sources};
    if(added&&stats?.gamma){
        const previous=old?collection.stats?.gamma:undefined;
        const current=stats.gamma;
        const floors=[previous?.floor,current.floor].filter((n):n is number=>n!=null);
        const offers=[previous?.topOffer,current.topOffer].filter((n):n is number=>n!=null);
        collection.stats={...collection.stats,gamma:{
            listed:previous?.listed!=null||current.listed!=null?(previous?.listed||0)+(current.listed||0):null,
            floor:floors.length?Math.min(...floors):null,
            topOffer:offers.length?Math.max(...offers):null,
        }};
    }
}
export function canonicalCatalog(input:Collection[]):Collection[] {
    const catalog=structuredClone(input.filter(c=>c.refs.ord&&!excludedCollection(c.name)));
    for(const c of catalog)if(c.key==='trilogy-prints-by-lemonhaze')c.name='Trilogy';
    for(const extra of input){
        if(extra.refs.ord||!extra.refs.gamma)continue;
        const target=matchCollection(catalog,extra.name);
        if(target)addGammaSource(target,{...extra.refs.gamma,name:extra.name},extra.stats);
    }
    return catalog;
}
export function combineGammaResults(key:string,parts:Result[],expected:number):Result {
    const successful=parts.filter(r=>r.status==='ok'||r.status==='partial');
    const listings=new Map<string,Result['listings'][number]>();
    for(const r of successful)for(const listing of r.listings){
        const old=listings.get(listing.id.toLowerCase());
        if(!old||listing.price<old.price)listings.set(listing.id.toLowerCase(),listing);
    }
    const values=[...listings.values()];
    const complete=parts.length===expected&&parts.every(r=>r.status==='ok');
    const offers=successful.map(r=>r.topOffer).filter((v):v is number=>v!=null);
    return {key,market:'gamma',checkedAt:successful.map(r=>r.checkedAt).filter(Boolean).sort()[0]||'',
        attemptedAt:parts.map(r=>r.attemptedAt).filter(Boolean).sort().at(-1)||'',
        status:complete?'ok':successful.length?'partial':'error',listed:successful.length?values.length:null,
        floor:values.length?Math.min(...values.map(l=>l.price)):null,topOffer:offers.length?Math.max(...offers):null,
        offerCount:null,listings:values,
        message:complete?'':`${successful.length} of ${expected} Gamma print sources available. Counts include the available sources only.`};
}
export function canonicalSnapshot(input:Snapshot):Snapshot {
    const catalog=canonicalCatalog(input.catalog);
    const results:Record<string,Result>={};
    for(const c of catalog){
        for(const market of Object.keys(c.refs)){
            const key=`${market}:${c.key}`;
            const direct=input.results[key];
            if(direct){results[key]=direct;continue;}
            if(market!=='gamma')continue;
            const children=input.catalog.filter(old=>!old.refs.ord&&old.refs.gamma&&matchCollection(catalog,old.name)?.key===c.key);
            const legacyKeys=new Set([...children.map(old=>`gamma:${old.key}`),...gammaSources(c.refs.gamma!).map(source=>`gamma:gamma-${source.id}`)]);
            const parts=[...legacyKeys].map(key=>input.results[key]).filter((r):r is Result=>Boolean(r));
            if(parts.length)results[key]=combineGammaResults(c.key,parts,gammaSources(c.refs.gamma!).length);
        }
    }
    return {...input,catalog,results};
}
