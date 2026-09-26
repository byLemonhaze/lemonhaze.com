import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(new URL('..',import.meta.url).pathname),dist=resolve(root,'dist');
const routes=JSON.parse(await readFile(resolve(dist,'seo/routes.json'),'utf8'));
const original=await readFile(resolve(dist,'index.html'),'utf8');
const types={'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
const server=createServer(async(req,res)=>{
 try {
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/api/market-watch/snapshot'){res.writeHead(200,{'Content-Type':'application/json'});res.end(await readFile(resolve(root,'src/market-watch/lib/initial.json')));return;}
  if(path.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"Live services are not captured during the build."}');return;}
  let file=resolve(dist,'.'+decodeURIComponent(path));
  if(!file.startsWith(dist+'/'))file=resolve(dist,'index.html');
  let data;
  try {if((await stat(file)).isDirectory())file=resolve(file,'index.html');data=await readFile(file);}catch{file=resolve(dist,'index.html');data=original;}
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(500);res.end('Build server error');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});
const selected=process.env.SEO_SAMPLE ? routes.filter(r=>['/','/about','/highlights','/explore','/archive','/practice','/supply','/gentlemen','/best-before','/manufactured','/montreal'].includes(r.path)||r.kind==='artwork'&&['/gentlemen','/best-before'].includes(r.collectionPath)).slice(0,25) : routes;
let count=0;
async function makeCapturePage() {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 // No live marketplaces, prices or inscription scripts are executed to build public HTML.
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(request.resourceType()==='image')return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ4kAAAAASUVORK5CYII=','base64')});
  if(url.origin===origin)return route.continue();
  if(request.isNavigationRequest())return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Artwork</title>'});
  return route.fulfill({status:503,contentType:'application/json',body:'{}'});
 });
 await page.goto(origin+'/about');
 await page.waitForFunction(()=>document.documentElement.dataset.appReady==='true',null,{timeout:30000});
 return page;
}
try {
 let page=await makeCapturePage();
 for(const entry of selected){
  // Bound browser memory while rendering large collections repeatedly.
  if(count && count%100===0){await page.close();page=await makeCapturePage();}
  await page.evaluate(path=>{history.replaceState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'));},entry.path);
  await page.waitForFunction(path=>document.documentElement.dataset.seoPath===path,entry.path,{timeout:10000});
  // Settle the site's close/open transitions before recording a route.
  if(entry.kind!=='artwork')await page.waitForTimeout(320);
  const html=await page.evaluate(async entry=>{
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const clone=document.documentElement.cloneNode(true);
   clone.dataset.prerendered='true';delete clone.dataset.appReady;
   const head=clone.querySelector('head');
   const canonical=head.querySelector('link[rel="canonical"]');
   if(canonical?.getAttribute('href')!==entry.canonical)throw Error('Wrong canonical '+entry.path);
   clone.querySelectorAll('.animate-fade-in').forEach(el=>{el.classList.remove('animate-fade-in');el.style.removeProperty('animation-delay');});
   // Runtime blobs and transient playback state are never meaningful public URLs.
   clone.querySelectorAll('iframe[src^="blob:"],iframe[data-onchain-preview-src]').forEach(el=>{
    const src=el.dataset.onchainPreviewSrc||(entry.kind==='artwork'?'https://ordinals.com/content'+entry.path:null);
    if(src)el.setAttribute('src',src);else el.removeAttribute('src');delete el.dataset.previewPaused;
   });
   if(entry.kind==='artwork'){
    const modal=clone.querySelector('#modal-overlay');
    if(modal.classList.contains('hidden'))throw Error('Artwork modal not open '+entry.path);
    modal.classList.remove('opacity-0');
    const frame=clone.querySelector('#modal-iframe');
    if(!frame.classList.contains('hidden'))frame.setAttribute('src','https://ordinals.com/content'+entry.path);
    // A normal link also works before JavaScript binds the close button.
    const close=clone.querySelector('#modal-close');
    const link=document.createElement('a');for(const a of close.attributes)link.setAttribute(a.name,a.value);
    link.href=entry.collectionPath;link.innerHTML=close.innerHTML;close.replaceWith(link);
   }
   clone.querySelector('#loading-indicator')?.classList.add('hidden');
   clone.querySelectorAll('.exchange-rate').forEach(el=>{el.textContent='';el.removeAttribute('title');});
   clone.querySelectorAll('script[src*="/press-engine"],script[data-build-only]').forEach(el=>el.remove());
   // Keep each page metadata exactly aligned with the recorded route.
   const title=head.querySelector('title');title.textContent=entry.title;
   head.querySelector('meta[name="description"]').setAttribute('content',entry.description);
   head.querySelector('meta[property="og:title"]').setAttribute('content',entry.title);
   head.querySelector('meta[property="og:description"]').setAttribute('content',entry.description);
   return '<!DOCTYPE html>\n'+clone.outerHTML;
  },entry);
  if(/(?:href|src)=["'](?:blob:|http:\/\/127\.0\.0\.1)/.test(html))throw Error('Local URL leaked into '+entry.path);
  const output=entry.path==='/'?resolve(dist,'index.html'):resolve(dist,entry.path.slice(1)+'.html');
  await mkdir(resolve(output,'..'),{recursive:true});await writeFile(output,html);
  if(++count%100===0)console.log(`Prerendered ${count}/${selected.length}`);
 }
 if(!process.env.SEO_SAMPLE){
  await writeFile(resolve(dist,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Lemonhaze</title></head><body style="background:#050505;color:#ddd;font-family:Arial,sans-serif;padding:40px"><h1>Page not found</h1><p><a style="color:inherit" href="/">Return to Lemonhaze</a></p></body></html>');
 }
 await writeFile(resolve(dist,'seo/build-report.json'),JSON.stringify({pages:count,complete:count===routes.length,paths:selected.map(r=>r.path)},null,2));
 console.log(`Prerender complete: ${count} pages. No production changes.`);
} finally {await browser.close();await new Promise(r=>server.close(r));}
