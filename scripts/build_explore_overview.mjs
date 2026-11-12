// One small texture for the distant field avoids decoding 1,500 thumbnails on phones.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {fetchFeaturedCollections} from '../src/data/featured-collections.js';
import {assembleArtworkCatalog} from '../src/data/catalog.js';
import {normalizeBBCollection} from '../src/data.js';
import {createExperienceCatalog,thumbnailSource} from '../src/immersive/model.js';
import {buildExploreLayout} from '../src/immersive/layout.js';
const root=new URL('../public/',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root)));
const savedFetch=globalThis.fetch;
globalThis.fetch=async url=>new Response(await readFile(new URL('.'+url,root)));
const featured=await fetchFeaturedCollections({strict:true});globalThis.fetch=savedFetch;
const works=createExperienceCatalog(assembleArtworkCatalog(await read('data/provenance.json'),normalizeBBCollection(await read('data/collections/best-before.json')),featured)).explore;
const {bounds,placements}=buildExploreLayout(works);
const width=bounds.right-bounds.left,height=bounds.bottom-bounds.top,scale=2000/Math.max(width,height),layers=[];
for(const work of works){
 const [x,y,w,h]=placements.get(work.id),src=thumbnailSource(work);
 if(!src.startsWith('/'))throw Error('Overview requires a local thumbnail: '+work.name);
 const {data,info}=await sharp(await readFile(new URL('.'+src,root))).resize({width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale)),fit:'inside'}).png().toBuffer({resolveWithObject:true});
 layers.push({input:data,left:Math.round((x-bounds.left)*scale-info.width/2),top:Math.round((y-bounds.top)*scale-info.height/2)});
}
const image=await sharp({create:{width:Math.ceil(width*scale),height:Math.ceil(height*scale),channels:4,background:'#00000000'}}).composite(layers).webp({quality:88}).toBuffer();
await writeFile(new URL('previews/explore-overview.webp',root),image);
const version=createHash('sha256').update(image).digest('hex').slice(0,12);
const fingerprint=createHash('sha256').update(JSON.stringify([...placements])).digest('hex');
await writeFile(new URL('../src/immersive/overview.json',import.meta.url),JSON.stringify({version,bounds,works:works.length,fingerprint,width:Math.ceil(width*scale),height:Math.ceil(height*scale)})+'\n');
console.log({works:works.length,width:Math.ceil(width*scale),height:Math.ceil(height*scale)});
