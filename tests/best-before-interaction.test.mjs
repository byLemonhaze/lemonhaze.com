import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { buildBestBeforeDocument } from '../src/ui/best-before-player.js';

test('the embedded renderer keeps its native lifespan card and save button interactive', async () => {
    const id = 'c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i289';
    const source = `<!doctype html><html><head><style>html,body{margin:0}</style></head><body>
      <div id="artwork-wrapper"><canvas id="artwork-canvas" width="900" height="1600"></canvas></div>
      <script>
        function getSelfId(){return window.location.pathname.split("/").pop();}
        const localMode = location.protocol === "file:" || location.origin === "null";
        const ACTIVE_PHASE = 'SEALED';
        document.querySelector('canvas').onclick = () => {
          const popup = document.createElement('div');
          popup.id = 'artwork-popup';
          popup.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#eee;z-index:1000';
          popup.innerHTML = '<p>LIFESPAN: 3,391,293 blocks</p><button id="saveBtn">S</button>';
          popup.querySelector('button').onclick = () => {document.documentElement.dataset.saved = 'true';};
          popup.onclick = () => popup.remove();
          document.querySelector('#artwork-wrapper').appendChild(popup);
        };
      </script></body></html>`;
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1000, height: 1800 } });
        await page.setContent('<iframe sandbox="allow-scripts allow-downloads" style="width:900px;height:1600px;border:0"></iframe>');
        await page.locator('iframe').evaluate((frame, source) => { frame.srcdoc = source; }, buildBestBeforeDocument(source, id, 'interaction-test'));
        const frame = page.frameLocator('iframe');
        await frame.locator('#artwork-canvas').click();
        await frame.locator('#artwork-popup').waitFor({ state: 'visible' });
        assert.match(await frame.locator('#artwork-popup').innerText(), /LIFESPAN: 3,391,293 blocks/);
        await frame.locator('#saveBtn').click();
        assert.equal(await frame.locator('html').getAttribute('data-saved'), 'true');
        await frame.locator('#artwork-popup').waitFor({ state: 'detached' });
        await frame.locator('#artwork-canvas').click();
        await frame.locator('#artwork-popup').click({ position: { x: 10, y: 10 } });
        await frame.locator('#artwork-popup').waitFor({ state: 'detached' });
    } finally {
        await browser.close();
    }
});
