import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const source = await readFile(new URL('../src/renderers/home/carousel.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/ui/presentation.css', import.meta.url), 'utf8');

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`carousel startup keeps the first artwork visible at ${viewport.width}px and retains slide transitions`, async () => {
        const browser = await chromium.launch({ headless: true });
        try {
            const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
            await page.setContent('<main style="height:80vh"><section class="curated-carousel"><div class="carousel-stage"><a class="carousel-slide is-active"><img></a></div></section></main>');
            await page.addStyleTag({ content: styles });
            await page.addScriptTag({ content: source.replace(/^import .*;\n/, '').replace('export function', 'window.createHomeCarousel = function') });
            await page.evaluate(async () => {
                window.preview = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="90" height="160"><rect width="90" height="160" fill="blue"/></svg>';
                document.querySelector('img').src = preview;
                await document.querySelector('img').decode();
                await new Promise(requestAnimationFrame);
            });
            const samples = await page.evaluate(async () => {
                const carousel = createHomeCarousel({
                    appState: {}, selection: [{ id: 'first', name: 'First', year: 2026 }, { id: 'second', name: 'Second', year: 2026 }],
                    chronologyByYear: {}, toCollectionSlug: value => value,
                    onOpenArtworkById: () => {}, getCarouselImageSrc: () => preview,
                });
                const container = document.querySelector('main');
                container.replaceChildren();
                carousel.mount(container);
                window.carousel = carousel;
                const samples = [];
                for (let i = 0; i < 12; i++) {
                    await new Promise(requestAnimationFrame);
                    const slide = document.querySelector('.carousel-slide.is-active');
                    samples.push({ opacity: getComputedStyle(slide).opacity, visible: getComputedStyle(slide).visibility, loaded: slide.querySelector('img').naturalWidth > 0 });
                }
                return samples;
            });
            assert.ok(samples.every(sample => sample.opacity === '1' && sample.visible === 'visible' && sample.loaded), JSON.stringify(samples));
            await page.getByRole('button', { name: 'Next artwork', exact: true }).click();
            assert.equal(await page.locator('.carousel-slide.is-active').getAttribute('aria-label'), 'View Second');
            assert.equal(await page.locator('.carousel-position').textContent(), '02 / 02');
            assert.equal(await page.locator('.carousel-slide.is-active').evaluate(el => getComputedStyle(el).transitionDuration), '0.65s');
            await page.waitForFunction(() => getComputedStyle(document.querySelector('.carousel-slide.is-active')).opacity === '1');
            await page.evaluate(() => carousel.cleanup());
            assert.equal(await page.locator('.curated-carousel').count(), 0);
        } finally { await browser.close(); }
    });
}
