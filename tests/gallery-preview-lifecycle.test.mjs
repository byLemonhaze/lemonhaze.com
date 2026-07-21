import assert from 'node:assert/strict';
import test from 'node:test';

import {
    pauseGalleryOnchainPreviews,
    resumeGalleryOnchainPreviews,
} from '../src/modules/gallery-preview-lifecycle.js';

function makeFrame(src) {
    const attributes = new Map([['src', src]]);
    return {
        dataset: { onchainPreviewSrc: src },
        getAttribute(name) {
            return attributes.get(name) ?? null;
        },
        setAttribute(name, value) {
            attributes.set(name, value);
        },
    };
}

function makeRoot(frames) {
    return {
        querySelectorAll(selector) {
            assert.equal(selector, 'iframe[data-onchain-preview-src]');
            return frames;
        },
    };
}

test('pauses every on-chain gallery iframe while preserving its source', () => {
    const frames = [
        makeFrame('https://ordinals.com/content/parent'),
        makeFrame('https://ordinals.com/content/child'),
    ];
    const root = makeRoot(frames);

    assert.equal(pauseGalleryOnchainPreviews(root), 2);
    assert.deepEqual(frames.map((frame) => frame.getAttribute('src')), ['about:blank', 'about:blank']);
    assert.deepEqual(frames.map((frame) => frame.dataset.previewPaused), ['true', 'true']);

    assert.equal(pauseGalleryOnchainPreviews(root), 0);
    assert.deepEqual(
        frames.map((frame) => frame.dataset.onchainPreviewSrc),
        ['https://ordinals.com/content/parent', 'https://ordinals.com/content/child'],
    );
});

test('restores paused gallery iframes after the modal closes', () => {
    const frames = [
        makeFrame('https://ordinals.com/content/parent'),
        makeFrame('https://ordinals.com/content/child'),
    ];
    const root = makeRoot(frames);
    pauseGalleryOnchainPreviews(root);

    assert.equal(resumeGalleryOnchainPreviews(root), 2);
    assert.deepEqual(
        frames.map((frame) => frame.getAttribute('src')),
        ['https://ordinals.com/content/parent', 'https://ordinals.com/content/child'],
    );
    assert.deepEqual(frames.map((frame) => frame.dataset.previewPaused), [undefined, undefined]);

    assert.equal(resumeGalleryOnchainPreviews(root), 0);
});
