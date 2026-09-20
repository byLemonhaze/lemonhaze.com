import {assembleArtworkCatalog} from '../src/data/catalog.js';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {CHRONOLOGY_BY_YEAR,COL_DESCRIPTIONS,normalizeBBCollection} from '../src/data.js';
import {fetchFeaturedCollections} from '../src/data/featured-collections.js';
import {createCollectionResolver} from '../src/data/collections.js';
import {PAGE_METADATA,metadataFor} from '../src/seo/metadata.js';
const root=new URL('../',import.meta.url);
const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
const previousFetch=globalThis.fetch;
let featured;
try {
 globalThis.fetch=async url=>new Response(JSON.stringify(await read('public'+url)));
 featured=await fetchFeaturedCollections({strict:true});
} finally {globalThis.fetch=previousFetch;}
const provenance=await read('public/data/provenance.json');
const bb=normalizeBBCollection(await read('public/data/collections/best-before.json'));
const artworks=assembleArtworkCatalog(provenance,bb,featured);
const resolver=createCollectionResolver({chronologyByYear:CHRONOLOGY_BY_YEAR,getArtworks:()=>artworks});resolver.rebuildCollectionSlugs();
const routes=Object.keys(PAGE_METADATA).map(path=>metadataFor({path}));
for(const name of new Set([...Object.values(CHRONOLOGY_BY_YEAR).flat(),...artworks.map(a=>a.collection)])){
 if(!name||name==='Home')continue;
 const path='/'+resolver.toCollectionSlug(name);
 routes.push(metadataFor({path,name,description:COL_DESCRIPTIONS[name],kind:'collection'}));
}
for(const a of artworks){
 if(!/^[a-f0-9]{64}i\d+$/.test(a.id))continue; // Viewer state examples are not inscriptions.
 routes.push({...metadataFor({path:'/'+a.id,name:a.name,kind:'artwork',collection:a.collection,image:a.grid_preview||`https://cdn.lemonhaze.com/assets/assets/${a.id}.png`}),collectionPath:'/'+resolver.toCollectionSlug(a.collection)});
}
if(new Set(routes.map(r=>r.path)).size!==routes.length)throw Error('Duplicate SEO routes');
await mkdir(new URL('public/seo/',root),{recursive:true});
await writeFile(new URL('public/seo/routes.json',root),JSON.stringify(routes,null,2)+'\n');
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;');
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+routes.map(r=>`  <url><loc>${escape(r.canonical)}</loc></url>`).join('\n')+'\n</urlset>\n';
await writeFile(new URL('public/sitemap.xml',root),sitemap);
console.log(`SEO routes: ${routes.length} (${routes.filter(r=>r.kind==='artwork').length} artworks).`);
