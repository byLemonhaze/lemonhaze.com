// Generate sharing-only JPEGs from the original artwork sources. This never
// replaces gallery, modal, recording or download assets. Run manually to refresh.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { CAROUSEL_WORK_IDS, selectedWorks } from '../src/curation/selection.js';
import { fetchFeaturedCollections } from '../src/data/featured-collections.js';
import { assembleArtworkCatalog } from '../src/data/catalog.js';
import { normalizeBBCollection } from '../src/data.js';
import { getArtworkImageSrc } from '../src/renderers/gallery.js';

const root=new URL('../',import.meta.url);
const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const originalFetch=globalThis.fetch;
let featured;
try {
    globalThis.fetch=async url=>new Response(JSON.stringify(await read('public'+url)));
    featured=await fetchFeaturedCollections({strict:true});
} finally {globalThis.fetch=originalFetch;}
const catalog=assembleArtworkCatalog(await read('public/data/provenance.json'),normalizeBBCollection(await read('public/data/collections/best-before.json')),featured);
const bb290='c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i289';
const ids=process.argv.slice(2).length ? process.argv.slice(2) : [...CAROUSEL_WORK_IDS,bb290,...featured.filter(w=>['Confabulation','Chrysalis'].includes(w.collection)).map(w=>w.id)];
const works=selectedWorks(catalog,[...new Set(ids)]);
const escape=s=>String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const cache=join(tmpdir(),'lemonhaze-social-originals');
const output=new URL('public/social/',root);await mkdir(output,{recursive:true});await mkdir(cache,{recursive:true});
async function source(work) {
    const src=getArtworkImageSrc(work);
    if(src.startsWith('/'))return 'data:image/jpeg;base64,'+(await readFile(new URL('public'+src,root))).toString('base64');
    const file=join(cache,createHash('sha256').update(src).digest('hex'));
    let data;
    try {data=await readFile(file);} catch {
        const response=await fetch(src,{signal:AbortSignal.timeout(60000)});
        if(!response.ok || !response.headers.get('content-type')?.startsWith('image/'))throw Error(`Invalid image for ${work.name}: ${src}`);
        data=Buffer.from(await response.arrayBuffer());await writeFile(file,data);
    }
    return 'data:application/octet-stream;base64,'+data.toString('base64');
}
const style=`*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f2f0eb;color:#252525;font-family:Arial,sans-serif}header{height:110px;margin:0 54px;border-bottom:1px solid #ccc9c2;display:flex;align-items:center;justify-content:space-between}.brand{font-size:29px;letter-spacing:7px;font-weight:600}.label{font-size:13px;letter-spacing:2px;color:#68655f}main{height:454px;margin:0 54px;display:flex;align-items:center;gap:32px}footer{margin:0 54px;padding-top:22px;border-top:1px solid #ccc9c2;display:flex;justify-content:space-between;font-size:15px;color:#68655f}img{display:block;object-fit:contain;width:100%;height:100%}.statement{width:290px;flex-shrink:0}.statement h1{font-size:57px;line-height:1.04;letter-spacing:-3px;font-weight:400;margin:0 0 26px}.statement p{font-size:15px;line-height:1.6;max-width:230px;color:#68655f}.triptych{display:flex;gap:16px;height:390px;flex:1;min-width:0}.triptych figure{flex:1;min-width:0;margin:0}.single{width:620px;height:390px;flex-shrink:0}.details{flex:1;min-width:0}.details h1{font-size:36px;font-weight:400;letter-spacing:-1px;line-height:1.16;margin:0 0 24px;overflow-wrap:anywhere}.details p{font-size:16px;line-height:1.6;color:#68655f}`;
function html(body,label='ARTIST & COUREUR DE BOIS') {return `<!doctype html><meta charset="utf-8"><style>${style}</style><header><div class="brand">LEMONHAZE</div><div class="label">${escape(label)}</div></header><main>${body}</main><footer><span>lemonhaze.com</span><span>Works on Bitcoin</span></footer>`;}
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
async function capture(markup,name){
    await page.setContent(markup);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
    const bytes=await page.screenshot({type:'jpeg',quality:94});
    const hash=createHash('sha256').update(bytes).digest('hex').slice(0,10);
    const filename=`${name}-${hash}.jpg`;await writeFile(new URL(filename,output),bytes);
    console.log(`${name}: ${Math.round(bytes.length/1024)} KB`);
    return `/social/${filename}`;
}
const manifest={};
try {
    const coverIds=['862fac8dc9236e8adb4cc7e6127421fe7f3cad8c4b07975b8cf0bdb9bea7c038i0',CAROUSEL_WORK_IDS[2],CAROUSEL_WORK_IDS[4]];
    const coverSources=await Promise.all(coverIds.map(id=>source(catalog.find(w=>w.id===id))));
    manifest.default=await capture(html(`<div class="statement"><h1>Image.<br>Texture.<br>Time.</h1><p>Selected works, collections<br>and notes from the studio.</p></div><div class="triptych">${coverSources.map(src=>`<figure><img src="${src}"></figure>`).join('')}</div>`),'lemonhaze');
    for(const work of works){
        const src=await source(work);
        manifest[work.id]=await capture(html(`<div class="single"><img src="${src}"></div><div class="details"><h1>${escape(work.name)}</h1><p>${escape(work.collection)}<br>By Lemonhaze</p></div>`,'SELECTED ARTWORK'),work.id);
    }
    await writeFile(new URL('src/seo/social-images.js',root),'// Generated by scripts/build_social_previews.mjs. Sharing assets only.\nexport const SOCIAL_IMAGES = '+JSON.stringify(manifest,null,2)+';\n');
} finally {await browser.close();}
