import test from 'node:test';
import assert from 'node:assert/strict';
import { getArtworkOwnership } from '../src/modules/artwork-ownership.js';

test('burned charm explains an absent owner without guessing from a null address', () => {
    assert.deepEqual(getArtworkOwnership({}, { charms: ['nineball', 'burned'], address: null, ownerLookupSucceeded: true }), { label: 'Burned', status: 'burned' });
    assert.equal(getArtworkOwnership({}, { address: null, ownerLookupSucceeded: true }).label, 'Not reported');
    assert.equal(getArtworkOwnership({}, {}).label, 'Temporarily unavailable');
});

test('recorded burns survive lookup failure; parents and collection totals imply no burn', () => {
    assert.equal(getArtworkOwnership({ charms: 'Block 9, Burned' }).label, 'Burned');
    assert.equal(getArtworkOwnership({ role: 'parent' }).status, 'unknown');
    assert.equal(getArtworkOwnership({ burned: 1 }).status, 'unknown');
    assert.equal(getArtworkOwnership({}, { address: 'bc1-owner' }).label, 'bc1-owner');
});


test('only the artist-confirmed address receives the artist collection label', () => {
    const address = 'bc1pf94n8hfurp7j4l8mmywd2mzdeqw6s0h59r68p7khjuzzn8uelg5svwk5zr';
    assert.deepEqual(getArtworkOwnership({}, { address }), { label: 'Lemonhaze · Artist’s collection', status: 'artist', address });
    assert.equal(getArtworkOwnership({}, { address: 'bc1-another-wallet' }).status, 'owned');
    assert.equal(getArtworkOwnership({}, { address, charms: ['burned'] }).status, 'burned');
});
