// Build small local display derivatives. Original artwork files remain untouched.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import {fetchFeaturedCollections} from '../src/data/featured-collections.js';
import {assembleArtworkCatalog} from '../src/data/catalog.js';
import {normalizeBBCollection} from '../src/data.js';
import {createExperienceCatalog,previewSource} from '../src/immersive/model.js';
import {getArtworkImageSrc} from '../src/renderers/gallery.js';
import {getCdnMediaSrc,isHtmlArtwork,isStaticOnlyMedia} from '../src/modules/artwork-media.js';
const read=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url)));
const root=new URL('../public/',import.meta.url),savedFetch=globalThis.fetch;
globalThis.fetch=async url=>new Response(await readFile(new URL('.'+url,root)));
const featured=await fetchFeaturedCollections({strict:true});globalThis.fetch=savedFetch;
const catalog=createExperienceCatalog(assembleArtworkCatalog(await read('public/data/provenance.json'),normalizeBBCollection(await read('public/data/collections/best-before.json')),featured));
const directory=new URL('previews/immersive/',root);await mkdir(directory,{recursive:true});
const manifest={},failures=[],queue=[...catalog.explore];let done=0,totalBytes=0;
const refreshName=process.argv.find(arg=>arg.startsWith('--refresh-name='))?.slice('--refresh-name='.length);
const refreshCollection=process.argv.find(arg=>arg.startsWith('--refresh-collection='))?.slice('--refresh-collection='.length);
async function bytes(src){
 if(src.startsWith('/'))return readFile(new URL('.'+src,root));
 const response=await fetch(src,{signal:AbortSignal.timeout(15000)});
 if(!response.ok||!response.headers.get('content-type')?.startsWith('image/')||Number(response.headers.get('content-length'))>25000000)throw Error('Not an available image');
 return Buffer.from(await response.arrayBuffer());
}
async function make(work){
 const output=new URL(work.id+'.webp',directory);
 try{if((refreshName&&work.name.includes(refreshName))||(refreshCollection&&work.collection===refreshCollection))throw Error('Refresh requested');const metadata=await sharp(await readFile(output)).metadata();const d=String(work.dimensions||'').match(/(\d+)\s*[x×]\s*(\d+)/i);if(!process.argv.includes('--repair-ratios')||!d||Math.abs((metadata.width/metadata.height)/(Number(d[1])/Number(d[2]))-1)<.08){manifest[work.id]=[metadata.width,metadata.height];return;}}catch{}
 const preferred=previewSource(work),snapshot=`https://render.ord.net/v9/snapshots/${work.id}/512.webp`;
 // HTML screenshots can contain controls and built-in page margins. Prefer the
 // artist's static image for small previews, retaining snapshots as a fallback.
 const sources=isStaticOnlyMedia(work)?[preferred,getCdnMediaSrc(work,'png')]:preferred.startsWith('/')?[preferred]:isHtmlArtwork(work)||process.argv.includes('--repair-ratios')?[preferred,getCdnMediaSrc(work,'png'),snapshot]:[/^[a-f0-9]{64}i\d+$/.test(work.id)?snapshot:preferred,preferred,getArtworkImageSrc(work)];
 for(const src of [...new Set(sources)])try{
   let pipeline=sharp(await bytes(src),{limitInputPixels:300000000}).rotate();
   // Render-service snapshots have transparent padding. Remove only fully transparent
   // outside rows/columns; never crop any artwork pixels or invent a square ratio.
   if(src===snapshot){
     const {data,info}=await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject:true});let l=info.width,t=info.height,r=-1,b=-1;
     for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>0){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
     if(r<l)throw Error('Empty snapshot');
     pipeline=sharp(data,{raw:info}).extract({left:l,top:t,width:r-l+1,height:b-t+1});
   }
   const {data,info}=await pipeline.resize({width:360,height:360,fit:'inside',withoutEnlargement:true}).webp({quality:74}).toBuffer({resolveWithObject:true});
   await writeFile(output,data);manifest[work.id]=[info.width,info.height];totalBytes+=data.length;return;
 }catch{}
 failures.push({id:work.id,name:work.name,source:preferred});
}
await Promise.all(Array.from({length:10},async()=>{while(queue.length){await make(queue.shift());if(++done%100===0)console.log(`${done}/${catalog.explore.length}; unavailable ${failures.length}`);}}));
await writeFile(new URL('../src/immersive/preview-manifest.json',import.meta.url),JSON.stringify(manifest)+'\n');
await writeFile(new URL('../docs/immersive/preview-audit.json',import.meta.url),JSON.stringify({works:catalog.explore.length,localPreviews:Object.keys(manifest).length,failures},null,2)+'\n');
console.log({works:catalog.explore.length,previews:Object.keys(manifest).length,failures,totalBytes});
