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
