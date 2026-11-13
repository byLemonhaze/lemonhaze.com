import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

test('embedded notes load on demand, preserve original text and never execute source',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  await page.setContent('<section id="work"></section>');
  await page.addScriptTag({content:(await readFile('src/modules/embedded-notes.js','utf8')).replaceAll('export function','function')});
  await page.evaluate(()=>{
   window.calls=0;
   window.fetch=async()=>{window.calls++;return new Response('<!-- My original words.\n♥ Montréal --><html><head><!-- Second note --></head><body><script>window.unsafe=true;<\/script></body></html>');};
   window.release=mountEmbeddedNotes(document.querySelector('#work'),'test-id');
  });
  assert.equal(await page.evaluate(()=>window.calls),0);
  await page.locator('.embedded-notes>summary').click();
  await page.waitForFunction(()=>document.querySelector('.embedded-notes-text').textContent.includes('Second note'));
  assert.equal(await page.locator('.embedded-notes-text').textContent(),'My original words.\n♥ Montréal\n\nSecond note');
  assert.equal(await page.evaluate(()=>window.unsafe),undefined);
  await page.locator('.embedded-notes>summary').click();await page.locator('.embedded-notes>summary').click();
  assert.equal(await page.evaluate(()=>window.calls),1);
  await page.evaluate(()=>window.release());
  assert.equal(await page.locator('.embedded-notes').count(),0);
  // A response for a previous work cannot populate its replacement.
  await page.evaluate(()=>{
   window.fetch=(_url,{signal})=>new Promise(resolve=>{window.oldSignal=signal;window.resolveOld=resolve;});
   window.release=mountEmbeddedNotes(document.querySelector('#work'),'old');
  });
  await page.locator('.embedded-notes>summary').click();
  await page.waitForFunction(()=>Boolean(window.oldSignal));
  await page.evaluate(()=>{window.release();mountEmbeddedNotes(document.querySelector('#work'),'new');window.resolveOld(new Response('<!-- Wrong work -->'));});
  assert.equal(await page.evaluate(()=>window.oldSignal.aborted),true);
  assert.equal(await page.locator('.embedded-notes-text').textContent(),'');
 }finally{await browser.close();}
});
