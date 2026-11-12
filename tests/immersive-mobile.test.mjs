import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';

test('mobile overview limits decoded media, Gallery clears shared chrome, and collections fit short viewports',async()=>{
 const dist=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.mp4':'video/mp4','.jpg':'image/jpeg'};
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(dist,'.'+(path==='/'?'/index.html':extname(path)?path:path+'.html'));if(!file.startsWith(dist+'/'))throw Error();res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin=process.env.IMMERSIVE_TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
 if(!process.env.IMMERSIVE_TEST_ORIGIN){
  const html=await readFile(resolve(dist,'index.html'),'utf8');
  assert.doesNotMatch(html,/<main[^>]+id="immersive-experience"/,'root must not ship a desktop camera to phones');
  assert.match(html,/<picture id="mobile-explore-preview"/);
  assert.doesNotMatch(html,/data-quality=/,'root must not eagerly request sharp desktop images');
 }
 const browser=await (process.env.MOBILE_TEST_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:650},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:503,body:''}));
  await page.goto(origin+'/?view=explore');
  await page.locator('.explore-overview[src]').evaluate(i=>i.decode());
  await page.locator('.explore-viewport.is-overview').waitFor();
  assert.equal(await page.locator('.explore-world img[src]').count(),1,'overview decodes one texture, not all 1414 works');
  const field=await page.locator('.explore-overview').boundingBox();
  assert.ok(field.x>=23&&field.x+field.width<=367&&field.y>=119&&field.y+field.height<=571,'whole lemon fits between chrome and toolbar');
  await page.getByRole('button',{name:'Focus Impossible Folds 01',exact:true}).click();
  await page.waitForFunction(()=>{const b=document.querySelector('.explore-world [data-work="shop-print6"]')?.getBoundingClientRect();return b&&b.top>=135&&Math.abs(b.x+b.width/2-innerWidth/2)<1&&b.bottom<=innerHeight-79;});
  await page.getByRole('button',{name:'Show all Explore works',exact:true}).click();
  await page.locator('.explore-viewport.is-overview').waitFor();
  await page.getByRole('button',{name:'Open Gentleman Nº1',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.detail-info h1')?.textContent==='Gentleman Nº1');
  await page.locator('#view-switch a[data-view=explore]').click();
  await page.locator('.experience-detail').waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Show all Explore works',exact:true}).click();
  await page.locator('.explore-viewport.is-overview').waitFor();
  await page.getByRole('button',{name:'Switch to night mode'}).click();
  await page.reload();await page.locator('#appearance-toggle').waitFor();
  assert.equal(await page.locator('html').getAttribute('data-presentation'),'black');
  await page.locator('#view-switch a[data-view=website]').click();
  assert.equal(await page.locator('html').getAttribute('data-presentation'),'black');
  await page.goto(origin+'/?view=gallery&at=b32cc2fbacb3aa3b83408a8426873a3a649291da44538a462d76b3a84699f1e9i0');
  await page.waitForFunction(()=>document.querySelector('.room-title')?.textContent==="Chanchanok's Temple");
  await page.waitForFunction(()=>{const i=document.querySelector('.room-art[tabindex="0"] img');return i?.complete&&i.naturalWidth>0;});
  for(const height of [650,568,844]){
   await page.setViewportSize({width:390,height});
   const art=await page.locator('.room-art[tabindex="0"]').boundingBox(),brand=await page.locator('#site-wordmark').boundingBox(),footer=await page.locator('.room-footer').boundingBox();
   assert.ok(art.y>brand.y+brand.height+12,`art clears wordmark at ${height}`);
   assert.ok(art.y+art.height<footer.y-12,`art clears footer at ${height}`);
  }
  await page.locator('.collection-trigger').click();
  assert.equal(await page.getByLabel('Find a collection').evaluate(n=>n===document.activeElement),false,'opening picker does not summon keyboard');
  assert.equal(await page.locator('.collection-menu').evaluate(d=>d.matches(':modal')),true);
  await page.getByLabel('Find a collection').fill('Gentlemen');
  await page.setViewportSize({width:390,height:360});
  await page.waitForFunction(()=>{const d=document.querySelector('.collection-menu').getBoundingClientRect();return d.top>=0&&d.bottom<=innerHeight;});
  const close=page.getByRole('button',{name:'Close collections'});
  assert.equal(await close.evaluate(n=>{const b=n.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===n}),true);
  await page.locator('.collection-option').filter({hasText:'Gentlemen'}).click();
  await page.waitForFunction(()=>document.querySelector('.collection-name')?.textContent==='Gentlemen');
  await page.setViewportSize({width:390,height:650});
  await page.getByRole('button',{name:'Next artwork',exact:true}).click();
  await page.waitForFunction(()=>{const b=document.querySelector('.room-art[tabindex="0"]')?.getBoundingClientRect();return b&&Math.abs(b.x+b.width/2-innerWidth/2)<1});
  await mkdir('output/playwright/feedback-16',{recursive:true});
  await page.screenshot({path:`output/playwright/feedback-16/${process.env.MOBILE_TEST_BROWSER||'chromium'}-gallery.png`});
  await page.locator('#view-switch a[data-view=explore]').click();
  await page.locator('.experience-detail').waitFor({state:'hidden'});
  await page.locator('.explore-viewport:not(.is-overview)').waitFor();
  for(const sequence of [['website','gallery','explore'],['website','explore','gallery'],['explore','gallery','website'],['gallery','website','gallery']]){
   await page.evaluate(views=>views.forEach(view=>document.querySelector(`#view-switch [data-view="${view}"]`).click()),sequence);
   const last=sequence.at(-1);
   await page.waitForFunction(view=>document.documentElement.dataset.view===view&&document.querySelector('#view-switch [aria-current]')?.dataset.view===view,last);
   assert.equal(new URL(page.url()).searchParams.get('view'),last);
   if(last!=='website')assert.equal(await page.locator('#immersive-experience').getAttribute('data-mode'),last);
  }
  assert.equal(await page.locator('#appearance-toggle svg').count(),1);
  assert.equal(await page.locator('[data-presentation-choice]').count(),0);
  await page.locator('#view-switch a[data-view=website]').click();
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await page.locator('#all-works-nav > summary').click();
  const before=await page.locator('#sidebar [data-section=archive]').boundingBox();
  await page.locator('#sidebar [data-year-toggle]').first().click();
  const after=await page.locator('#sidebar [data-section=archive]').boundingBox();
  assert.ok(Math.abs(before.y-after.y)<1,'opening a year cannot push utility links down');
  const lab=await page.locator('#sidebar [data-section=lab]').boundingBox(),footer=await page.locator('#sidebar > div:last-child').boundingBox();
  assert.ok(lab.y+lab.height<=footer.y,'Lab remains above the fixed footer');

  await page.goto(origin+'/gentlemen?view=website');
  await page.waitForFunction(()=>document.querySelector('#current-view-title')?.textContent?.toLowerCase()==='gentlemen');
  await page.locator('#appearance-toggle').click();
  const headerBackground=await page.locator('body > main > .site-header').evaluate(n=>getComputedStyle(n).backgroundColor);
  assert.equal(headerBackground,'rgba(0, 0, 0, 0)','header shares the collection canvas during theme changes');
  await page.locator('#gallery-grid img').evaluateAll(imgs=>imgs.slice(0,4).forEach(i=>i.loading='eager'));
  await page.waitForFunction(()=>{const imgs=[...document.querySelectorAll('#gallery-grid img')].slice(0,4);return imgs.length===4&&imgs.every(i=>i.complete&&i.naturalWidth>0);});
  await page.goto(origin+'/archive?view=website#good-night-print');
  await page.locator('#good-night-print[open]').waitFor();
  assert.equal(await page.locator('#good-night-print > summary .studio-note-preview').isVisible(),false);
  assert.equal(await page.locator('#good-night-print .archive-media-grid img').isVisible(),true);
  await page.goto(origin+'/practice?view=website#physical');
  const signing=page.getByLabel('Signing Hosoi prints');await signing.waitFor();
  assert.equal(await signing.evaluate(v=>v.autoplay&&v.muted&&v.loop&&v.playsInline),true);
  assert.equal(await page.locator('.experience-error').count(),0);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
});
