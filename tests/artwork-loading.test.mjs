import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const source = await readFile(new URL('../src/ui/artwork-loading.js', import.meta.url), 'utf8');

test('prerendered loading feedback is replaced and clears when isolated artwork loads', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent(`<section aria-busy="true"><div class="artwork-loading" role="status">Loading artwork</div><iframe sandbox="allow-scripts"></iframe></section>`);
        await page.addScriptTag({ content: source.replace('export function', 'window.createArtworkLoadingIndicator = function') });
        await page.evaluate(() => {
            const panel = document.querySelector('section');
            window.indicator = createArtworkLoadingIndicator(panel);
            indicator.start();
            const frame = document.querySelector('iframe');
            indicator.watch(frame);
            frame.src = URL.createObjectURL(new Blob(['<button onclick="this.textContent=\'Interacted\'">Artwork ready</button>'], { type: 'text/html' }));
        });
        await page.frameLocator('iframe').getByRole('button').waitFor();
        await page.waitForFunction(() => document.querySelector('section').getAttribute('aria-busy') === null);
        assert.equal(await page.locator('.artwork-loading').count(), 1, 'only the live indicator should remain');
        assert.equal(await page.locator('.artwork-loading:not([hidden])').count(), 0, 'no frozen loading label should cover the artwork');
        await page.frameLocator('iframe').getByRole('button').click();
        assert.equal(await page.frameLocator('iframe').getByRole('button').textContent(), 'Interacted');
    } finally { await browser.close(); }
});

test('switching artwork ignores the previous request and clears feedback for images and video', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent('<section><img><video></video></section>');
        await page.addScriptTag({ content: source.replace('export function', 'window.createArtworkLoadingIndicator = function') });
        await page.evaluate(() => {
            window.indicator = createArtworkLoadingIndicator(document.querySelector('section'));
            indicator.start();
            indicator.watch(document.querySelector('img'));
            document.querySelector('img').dispatchEvent(new Event('load'));
            // Change artwork before the previous request's paint callbacks run.
            indicator.start();
            indicator.watch(document.querySelector('video'));
        });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.locator('section').getAttribute('aria-busy'), 'true');
        await page.locator('video').dispatchEvent('loadeddata');
        await page.waitForFunction(() => document.querySelector('.artwork-loading').hidden);
        assert.equal(await page.locator('section').getAttribute('aria-busy'), null);
        await page.evaluate(() => {
            indicator.start();
            indicator.watch(document.querySelector('img'));
            document.querySelector('img').src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';
        });
        await page.waitForFunction(() => document.querySelector('.artwork-loading').hidden);
    } finally { await browser.close(); }
});

test('generated artwork pages never preserve a build-time loading or failure overlay', async () => {
    const routes = JSON.parse(await readFile(new URL('../dist/seo/routes.json', import.meta.url), 'utf8'));
    for (const route of routes.filter(route => route.kind === 'artwork')) {
        const html = await readFile(new URL(`../dist${route.path}.html`, import.meta.url), 'utf8');
        assert.doesNotMatch(html, /class="artwork-loading(?:["\s])/, route.path);
        assert.doesNotMatch(html, /aria-busy="true"/, route.path);
    }
});
