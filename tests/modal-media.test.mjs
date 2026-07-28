import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldUseDirectModalIframe } from '../src/renderers/modal/artwork.js';

test('recursive print HTML renders directly in the artwork modal', () => {
    const item = {
        collection: 'Deprivation (Prints)',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };

    assert.equal(shouldUseDirectModalIframe(item, true), true);
});

test('static print grid previews do not replace the live modal HTML', () => {
    const item = {
        collection: 'Trilogy (Prints)',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
        grid_preview: 'https://cdn.lemonhaze.com/assets/assets/master.png',
    };

    assert.equal(shouldUseDirectModalIframe(item, true), true);
});

test('Liminality HTML renders directly in the artwork modal', () => {
    const item = {
        collection: 'Liminality',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };

    assert.equal(shouldUseDirectModalIframe(item, true), true);
});

test('Eclosion HTML renders directly in the artwork modal', () => {
    const item = {
        collection: 'Eclosion 1/1 - Amsterdam Blooms',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
        grid_preview: '/images/eclosion/eclosion-1-by-lemonhaze.jpg',
    };

    assert.equal(shouldUseDirectModalIframe(item, true), true);
});

test('Liminality parent renders directly despite belonging to provenance', () => {
    const item = {
        id: 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0',
        collection: 'Provenance',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };

    assert.equal(shouldUseDirectModalIframe(item, true), true);
});

test('Griffintown HTML and its provenance parent render directly in the artwork modal', () => {
    const child = {
        collection: 'Griffintown',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };
    const parent = {
        id: '93bb1c5eb9e48f2efdd200d35339f0a8ad2c261bcf784f40ea83d165b90cfbbci0',
        collection: 'Provenance',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };

    assert.equal(shouldUseDirectModalIframe(child, true), true);
    assert.equal(shouldUseDirectModalIframe(parent, true), true);
});

test('recursive Satoshi SVG editions render directly while the original stays an image', () => {
    const edition = {
        collection: 'Satoshi (Original & Editions)',
        artwork_type: 'SVG',
        content_type: 'image/svg+xml',
    };
    const original = {
        collection: 'Satoshi (Original & Editions)',
        artwork_type: 'WEBP',
        content_type: 'image/webp',
    };

    assert.equal(shouldUseDirectModalIframe(edition, false), true);
    assert.equal(shouldUseDirectModalIframe(original, false), false);
});
