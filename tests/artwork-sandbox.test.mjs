import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { ARTWORK_SANDBOX, buildSandboxedArtworkHtml } from '../src/ui/artwork-sandbox.js';

test('HTML artwork is isolated from parent DOM/storage and still receives authenticated save commands',async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const page=await browser.newPage();
  await page.route('https://site.example/**',route=>route.fulfill({contentType:'text/html',body:`<iframe sandbox="${ARTWORK_SANDBOX}"></iframe>`}));
  await page.goto('https://site.example/');
  await page.evaluate(()=>localStorage.setItem('private-test','hidden'));
  const html=buildSandboxedArtworkHtml(`<html><body><button id="interaction">Interact</button><script>
   try { parent.document.body.dataset.compromised='true'; } catch { document.body.dataset.domBlocked='true'; }
   try { parent.localStorage.getItem('private-test'); } catch { document.body.dataset.storageBlocked='true'; }
   document.addEventListener('keydown',event=>{if(event.key==='s')document.body.dataset.saved=String(+(document.body.dataset.saved||0)+1)});
   document.querySelector('button').onclick=()=>document.body.dataset.clicked='true';
  </script></body></html>`,'test-token','https://site.example');
  await page.locator('iframe').evaluate((frame,html)=>{frame.src=URL.createObjectURL(new Blob([html],{type:'text/html'}));},html);
  const frame=page.frameLocator('iframe');await frame.locator('button').waitFor();
  assert.equal(await frame.locator('body').getAttribute('data-dom-blocked'),'true');
  assert.equal(await frame.locator('body').getAttribute('data-storage-blocked'),'true');
  assert.equal(await page.locator('body').getAttribute('data-compromised'),null);
  await frame.locator('button').click();assert.equal(await frame.locator('body').getAttribute('data-clicked'),'true');
  await page.locator('iframe').evaluate(frame=>frame.contentWindow.postMessage({channel:'lemonhaze-artwork-save',token:'wrong',type:'save'},'*'));
  await page.waitForTimeout(50);assert.equal(await frame.locator('body').getAttribute('data-saved'),null);
  await page.locator('iframe').evaluate(frame=>frame.contentWindow.postMessage({channel:'lemonhaze-artwork-save',token:'test-token',type:'save'},'*'));
  await frame.locator('body[data-saved="1"]').waitFor();
  assert.ok(!ARTWORK_SANDBOX.includes('allow-same-origin'));
 } finally {await browser.close();}
});
