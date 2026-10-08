import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

test('Best Before adopts a prerendered viewport and restores the shared iframe on close', async () => {
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
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        await page.route('**/*', route => {
            const request = route.request();
            if (new URL(request.url()).origin === origin) return route.continue();
            if (request.url() === 'https://bestbefore.space/best-before.json') {
                return route.fulfill({ json: { inscriptions: [{ id, phase: 'OPEN' }] } });
            }
            if (request.isNavigationRequest()) return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Artwork fixture</title><div id="artwork-ready">Artwork loaded</div>' });
            return route.fulfill({ status: 503, body: '' });
        });
        const response = await page.goto(`${origin}/${id}`);
        assert.equal(response.status(), 200);
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true');
        await page.frameLocator('#modal-iframe').locator('#artwork-ready').waitFor();
        for (const size of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
            await page.setViewportSize(size);
            await page.waitForFunction(() => {
                const viewports = document.querySelectorAll('.best-before-viewport');
                if (viewports.length !== 1) return false;
                const viewport = viewports[0];
                const panel = viewport.parentElement;
                const expected = Math.min(panel.clientWidth * 0.9, panel.clientHeight * 0.9 * 9 / 16);
                return panel.classList.contains('modal-media-panel') && Math.abs(viewport.clientWidth - expected) < 1;
            }, null, { timeout: 5000 });
            const box = await page.locator('.best-before-viewport').boundingBox();
            assert.ok(Math.abs(box.width / box.height - 9 / 16) < 0.002);
        }
        await page.locator('#modal-close').click();
        assert.equal(await page.locator('.best-before-viewport').count(), 0);
        assert.equal(await page.locator('#modal-iframe').evaluate(frame => frame.style.length), 0);
        assert.equal(await page.locator('.modal-media-panel > #modal-iframe').count(), 1);
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
});
