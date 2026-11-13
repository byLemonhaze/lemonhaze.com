import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

test('Best Before hydrates the metadata split, preserves its artwork ratio and releases live media on close', async () => {
    const dist = resolve('dist');
    const id = 'c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i289';
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    const server = createServer(async (req, res) => {
        try {
            const pathname = new URL(req.url, 'http://localhost').pathname;
            const file = resolve(dist, '.' + (pathname === '/' ? '/index.html' : extname(pathname) ? pathname : pathname + '.html'));
            if (!file.startsWith(dist + '/')) throw new Error('Invalid path');
            res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
            res.end(await readFile(file));
        } catch { res.writeHead(404); res.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = process.env.IMMERSIVE_TEST_ORIGIN || `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        await page.route('**/*', route => {
            const request = route.request();
            if (new URL(request.url()).origin === origin) return route.continue();
            if (request.url() === 'https://bestbefore.space/best-before.json') {
                return route.fulfill({ json: { inscriptions: [{ id, phase: 'OPEN' }] } });
            }
            if (request.url() === `https://ordinals.com/content/${id}`) return route.fulfill({
                contentType: 'text/html', headers: { 'access-control-allow-origin': '*' },
                body: '<!doctype html><html><head></head><body><div id="artwork-wrapper"><canvas id="artwork-canvas"></canvas><div id="artwork-ready">Artwork loaded</div></div><script>function getSelfId(){return window.location.pathname.split("/").pop();} const localMode = location.protocol === "file:" || location.origin === "null"; const ACTIVE_PHASE="SEALED";document.querySelector("canvas").getContext("2d").fillRect(0,0,100,100);</script></body></html>',
            });
            if (request.url() === 'https://ordinals.com/content/4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0') return route.fulfill({
                contentType:'text/html',headers:{'access-control-allow-origin':'*'},
                body:'<!doctype html><html><head><style>body{margin:0;position:fixed;inset:0;display:grid;place-items:center}canvas{width:min(92vmin,720px);aspect-ratio:1;display:block}</style></head><body><canvas width="800" height="800"></canvas><script>document.querySelector("canvas").getContext("2d").fillRect(0,0,800,800);</script></body></html>',
            });
            return route.fulfill({ status: 503, body: '' });
        });
        const response = await page.goto(`${origin}/${id}`);
        assert.equal(response.status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await page.frameLocator('.detail-original').locator('#artwork-ready').waitFor();
        await page.locator('.detail-original.is-ready').waitFor();
        await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.detail-poster')).opacity)===0);
        for (const size of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(size);
            await page.waitForFunction(() => {
                const frame=document.querySelector('.detail-original'),poster=document.querySelector('.detail-poster');
                return frame && poster?.naturalWidth && Math.abs(frame.clientWidth/frame.clientHeight-poster.naturalWidth/poster.naturalHeight)<.005;
            }, null, { timeout: 5000 });
            const box = await page.locator('.detail-original').boundingBox();
            assert.ok(Math.abs(box.width / box.height - 9 / 16) < 0.005);
            assert.equal(await page.locator('.detail-info h1').textContent(),'BEST BEFORE Nº290');
        }
        await page.locator('#immersive-experience > .detail-close').click();
        await page.locator('.detail-original').waitFor({state:'detached'});
        assert.equal(await page.locator('.experience-detail').count(),0);
        assert.equal(await page.locator('.best-before-viewport').count(), 0);
        assert.equal(await page.locator('.bb-capture').count(), 0);
        assert.equal(await page.locator('#modal-iframe').getAttribute('srcdoc'), null);
        assert.equal(await page.locator('#modal-iframe').getAttribute('sandbox'), 'allow-scripts allow-downloads allow-pointer-lock');
        assert.equal(await page.locator('#modal-iframe').evaluate(frame => frame.style.length), 0);
        assert.equal(await page.locator('.modal-media-panel > #modal-iframe').count(), 1);
        // A square inscription's own viewport margins must not shrink its live
        // canvas relative to the poster. Both share the same external mat.
        await page.goto(`${origin}/?view=explore&work=4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0`);
        await page.locator('.detail-original.is-ready').waitFor();
        for(const size of [{width:1440,height:1000},{width:390,height:844}]) {
            await page.setViewportSize(size);
            await page.waitForFunction(()=>{const p=document.querySelector('.detail-poster'),f=document.querySelector('.detail-original');return p&&f&&Math.abs(p.clientWidth-f.clientWidth)<1&&Math.abs(p.clientWidth/p.clientHeight-1)<.01;});
            await page.frameLocator('.detail-original').locator('canvas').evaluate(async canvas=>{
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                const r=canvas.getBoundingClientRect();
                if(Math.abs(r.width-innerWidth)>1||Math.abs(r.height-innerHeight)>1)throw new Error('Live artwork shrank inside the shared mat');
            });
            const fit=await page.locator('.detail-media').evaluate(media=>{const s=getComputedStyle(media);return {frame:parseFloat(s.getPropertyValue('--frame-width')),art:parseFloat(s.getPropertyValue('--original-width')),pad:parseFloat(s.getPropertyValue('--padding'))};});
            assert.ok(Math.abs(fit.frame-fit.art-2*fit.pad)<.1);
            assert.equal(await page.getByRole('button',{name:'Pause artwork'}).count(),0);
        }
        await mkdir('output/playwright/feedback-5',{recursive:true});
        await page.screenshot({path:'/tmp/lemonhaze-mobile-mat-fixture.png'});
        // The persistent wordmark and mode bar never move during mode changes;
        // on phones the menu owns a separate area and opens below both.
        for(const size of [{width:1440,height:1000},{width:390,height:844}]) {
            await page.setViewportSize(size);
            const positions=[];
            for(const mode of ['Explore','Gallery','Website']) {
                await page.locator('#view-switch').getByRole('link',{name:mode,exact:true}).click();
                await page.waitForFunction(view=>document.documentElement.dataset.view===view,mode.toLowerCase());
                positions.push(await page.locator('#site-wordmark').boundingBox());
            }
            assert.deepEqual(positions[0],positions[1]);assert.deepEqual(positions[1],positions[2]);
            if(size.width<768) {
                const logo=positions[2],menu=await page.locator('#menu-toggle').boundingBox();
                assert.ok(menu.x>=logo.x+logo.width+24);
                await page.waitForFunction(()=>[...document.querySelectorAll('.website-selected img')].filter(img=>img.getBoundingClientRect().top<innerHeight).every(img=>img.complete&&img.naturalWidth>0));
                await page.waitForTimeout(250); // Capture after the mode-control colour transition.
                await page.screenshot({path:'output/playwright/feedback-5/10-mobile-website.png'});
                await page.locator('#menu-toggle').click();
                await page.waitForFunction(()=>{const sidebar=document.querySelector('#sidebar').getBoundingClientRect();return sidebar.x>=-.1&&sidebar.y>=120;});
                await page.screenshot({path:'output/playwright/feedback-5/11-mobile-menu.png'});
                await page.locator('#sidebar').getByRole('link',{name:'Practice',exact:true}).click();
                await page.getByRole('heading',{name:'Image. Texture. Time.'}).waitFor();
            }
        }

        await page.setViewportSize({width:1440,height:900});
        await page.locator('#view-switch').getByRole('link',{name:'Explore',exact:true}).click();
        await page.getByRole('button',{name:'Show all Explore works',exact:true}).click();
        await page.waitForFunction(()=>{const m=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.explore-world')).transform);return m.a<.06;});
        await page.waitForTimeout(700);
        await page.waitForFunction(()=>[...document.querySelectorAll('.explore-world img[src]')].every(img=>img.complete&&img.naturalWidth>0));
        await mkdir('output/playwright/feedback-7',{recursive:true});
        await page.screenshot({path:'output/playwright/feedback-7/01-lemon-overview.png'});
        const edge=await page.locator('.explore-world > button').evaluateAll(items=>Math.max(...items.map(item=>item.getBoundingClientRect().right)));
        const mildX=720+(1440-24-edge)+60;
        const shape=()=>page.locator('.explore-world').evaluate(e=>{const m=new DOMMatrixReadOnly(getComputedStyle(e).transform);return {ratio:m.a/m.d,x:m.e};});
        await page.mouse.move(720,450);await page.mouse.down();
        await page.mouse.move(mildX,450,{steps:6});await page.waitForTimeout(300);
        const initialHold=await shape();
        await page.waitForTimeout(700);const sustained=await shape();
        assert.ok(sustained.ratio<.95,'holding against the wall must remain visibly compressed');
        assert.ok(Math.abs(initialHold.ratio-sustained.ratio)<.01,'pressure must not fade when the pointer stops moving');
        await page.mouse.move(mildX+100,450,{steps:6});await page.waitForTimeout(300);
        const firmer=await shape();assert.ok(firmer.ratio<sustained.ratio-.05,'pushing farther must squeeze more');
        await page.screenshot({path:'output/playwright/feedback-7/02-held-squeeze.png'});
        await page.mouse.up();
        // Juicy throws can already strike the opposite wall at a fixed 1.2s.
        // Observe recovery while moving away from this contact, not a later impact.
        await page.waitForFunction(previousX=>{
            const m=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.explore-world')).transform);
            return Math.abs(m.a/m.d-1)<.03&&m.e<previousX-20;
        },firmer.x,{timeout:5000});
        const released=await shape();
        assert.ok(Math.abs(released.ratio-1)<.03,'release must restore the undistorted field');
        assert.ok(released.x<firmer.x-20,'stored pressure must rebound away from the wall');
        await page.screenshot({path:'output/playwright/feedback-7/03-released.png'});

    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
});
