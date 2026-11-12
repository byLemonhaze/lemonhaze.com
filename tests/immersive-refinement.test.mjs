import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
import originals from '../src/data/pixel-originals.json' with {type:'json'};
import {pixelOriginalSource} from '../src/data/pixel-art.js';
import {CORE_WORK_ID,coreWorkNote} from '../src/data/artwork-notes.js';
import {fieldLimits,overviewCamera,fieldPressure} from '../src/immersive/field-physics.js';

test('native pixel originals retain dimensions and core note is specific to Gentleman Nº1',async()=>{
 for(const [id,size] of Object.entries(originals)){
  const file=await readFile('public'+pixelOriginalSource({id}));
  assert.equal(file.subarray(1,4).toString(),'PNG');
  assert.equal(file.readUInt32BE(16),size.width);assert.equal(file.readUInt32BE(20),size.height);
 }
 assert.match(coreWorkNote({id:CORE_WORK_ID}),/master parent/);
 assert.equal(coreWorkNote({id:'another-work'}),'');
});

test('corner pressure varies continuously instead of flipping the lemon between axes',()=>{
 const bounds={left:-7210,right:7400,top:-7000,bottom:7300},camera=overviewCamera(bounds,1440,900),limits=fieldLimits(bounds,1440,900,camera.zoom);
 const a=fieldPressure({x:limits.maxX+100,y:limits.maxY+99},limits);
 const b=fieldPressure({x:limits.maxX+99,y:limits.maxY+100},limits);
 assert.ok(Math.abs(a.squash-b.squash)<.002);
});

test('first paint, native pixels and mobile pinch-to-detail remain stable',async()=>{
 const dist=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};
 const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname,file=resolve(dist,'.'+(path==='/'?'/index.html':extname(path)?path:path+'.html'));if(!file.startsWith(dist+'/'))throw Error();res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin=process.env.IMMERSIVE_TEST_ORIGIN||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true});
 try{
  // Delaying the application leaves only the document's first-paint theme.
  for(const theme of ['fresh','black','unavailable']){
   const context=await browser.newContext();
   if(theme==='black')await context.addInitScript(()=>localStorage.setItem('lh-presentation','black'));
   if(theme==='unavailable')await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Storage unavailable');}}));
   const page=await context.newPage();
   await page.route('**/*',r=>r.request().resourceType()==='script'||new URL(r.request().url()).origin!==origin?r.abort():r.continue());
   await page.goto(origin+'/');
   assert.equal(await page.locator('html').getAttribute('data-presentation'),theme==='black'?'black':'paper');
   const bg=await page.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor);
   assert.equal(bg,theme==='black'?'rgb(28, 28, 27)':'rgb(242, 240, 235)');
   await context.close();
  }
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:503,body:''}));
  await page.goto(origin+'/?view=explore');
  await page.locator('.explore-viewport.is-overview').waitFor();
  const scale=()=>page.locator('.explore-world').evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).a);
  const before=await scale(),cdp=await page.context().newCDPSession(page);
  const touch=async(type,distance)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:195-distance/2,y:420,id:1},{x:195+distance/2,y:420,id:2}]});
  await touch('touchStart',50);
  for(let d=60;d<=240;d+=20){await touch('touchMove',d);await page.waitForTimeout(18);}
  await touch('touchEnd',0);await page.waitForTimeout(450);
  assert.ok(await scale()>before*3,'pinch enlarges artwork field');
  assert.equal(await page.evaluate(()=>visualViewport.scale),1,'browser viewport must not inherit field zoom');
  // Tap a real visible artwork after the pinch, not an artificial click.
  const visible=await page.locator('.explore-world button').evaluateAll(nodes=>{const e=nodes.find(n=>{const b=n.getBoundingClientRect();return b.width>10&&b.x>35&&b.right<innerWidth-35&&b.y>150&&b.bottom<innerHeight-100;});return e?.dataset.work;});
  assert.ok(visible);await page.locator(`.explore-world [data-work="${visible}"]`).tap();
  await page.locator('.experience-detail:not([hidden])').waitFor();await page.waitForTimeout(750);
  const bounds=await page.locator('.experience-detail').boundingBox();
  assert.ok(bounds.x>=-1&&bounds.width<=391,'detail remains fitted to viewport after pinch');
  assert.equal(await page.evaluate(()=>visualViewport.scale),1);
  await mkdir('output/playwright/feedback-18',{recursive:true});
  await page.screenshot({scale:'css',path:'output/playwright/feedback-18/mobile-after-pinch.png'});
  await page.goto(origin+'/?view=explore&work='+CORE_WORK_ID);
  await page.locator('.detail-core-note').waitFor();await page.waitForTimeout(800);assert.match(await page.locator('.detail-core-note').textContent(),/master parent/);
  const closeBox=await page.locator('.detail-close').boundingBox(),themeBox=await page.locator('#appearance-toggle').boundingBox();
  assert.ok(closeBox.x+closeBox.width<=themeBox.x,'mobile close and appearance controls do not overlap');
  await page.screenshot({scale:'css',path:'output/playwright/feedback-18/mobile-core-note.png'});
  await page.setViewportSize({width:1440,height:900});
  await page.goto(origin+'/?view=gallery&series=Tad+Small&at=41cd3825f334160f69ca9faae9bb70f6a8ff02530c56ae92fbf2a2062bd1281ai0');
  const img=page.locator('.room-art[tabindex="0"] img');await img.evaluate(i=>i.decode());
  assert.equal(await img.evaluate(i=>i.naturalWidth),24);assert.equal(await img.evaluate(i=>getComputedStyle(i).imageRendering),'pixelated');
  await page.screenshot({scale:'css',path:'output/playwright/feedback-18/pixel-art-gallery.png'});
  await page.getByRole('button',{name:'Open Khaosan',exact:true}).click();
  const enter=page.getByRole('button',{name:'View Khaosan in solo view',exact:true});await enter.waitFor();
  await page.waitForTimeout(750);const split=await page.locator('.detail-poster').boundingBox(),url=page.url();
  await enter.click();await page.waitForTimeout(100);
  const solo=await page.locator('.detail-poster').boundingBox();
  assert.ok(solo.width>split.width&&Math.abs(solo.x+solo.width/2-720)<1,'solo artwork expands centrally without cropping');
  assert.equal(await page.locator('.detail-info').isVisible(),false);assert.equal(page.url(),url);
  await page.screenshot({scale:'css',path:'output/playwright/feedback-18/pixel-art-solo.png'});
  await page.keyboard.press('Escape');await enter.waitFor();
  assert.equal(await page.locator('.detail-info').isVisible(),true);assert.equal(page.url(),url);
  const restored=await page.locator('.detail-poster').boundingBox();assert.ok(Math.abs(restored.width-split.width)<1);
  await enter.click();await page.getByRole('button',{name:'Return to artwork details',exact:true}).click();await enter.waitFor();
  assert.equal(await page.locator('.detail-info h1').textContent(),'Khaosan');

 }finally{await browser.close();server.closeAllConnections();await new Promise(done=>server.close(done));}
});
