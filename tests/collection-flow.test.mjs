import test from 'node:test';
import assert from 'node:assert/strict';

import { prependCollectionLeadArtworks } from '../src/app/collection-flow.js';

const BB_PARENT_ID = 'bcf16735647186ef853dedd820c9319e9895f99bfddedcfb782ace38093bb8fbi0';
const LIMINALITY_PARENT_ID = 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0';

test('prependCollectionLeadArtworks prepends the configured BEST BEFORE parent', () => {
    const parent = {
        id: BB_PARENT_ID,
        name: 'BEST BEFORE (Engine and Diary)',
        collection: 'Provenance',
    };
    const firstWork = { id: 'bb-1', name: 'BEST BEFORE Nº1', collection: 'BEST BEFORE' };
    const secondWork = { id: 'bb-2', name: 'BEST BEFORE Nº2', collection: 'BEST BEFORE' };

    const result = prependCollectionLeadArtworks({
        items: [firstWork, secondWork],
        collectionName: 'BEST BEFORE',
        allArtworks: [firstWork, parent, secondWork],
    });

    assert.deepEqual(result.map((item) => item.id), [BB_PARENT_ID, 'bb-1', 'bb-2']);
});

test('prependCollectionLeadArtworks does not duplicate the parent when it is already present', () => {
    const parent = {
        id: BB_PARENT_ID,
        name: 'BEST BEFORE (Engine and Diary)',
        collection: 'Provenance',
    };
    const work = { id: 'bb-1', name: 'BEST BEFORE Nº1', collection: 'BEST BEFORE' };

    const result = prependCollectionLeadArtworks({
        items: [parent, work],
        collectionName: 'BEST BEFORE',
        allArtworks: [parent, work],
    });

    assert.deepEqual(result.map((item) => item.id), [BB_PARENT_ID, 'bb-1']);
});

test('prependCollectionLeadArtworks prepends the Liminality provenance parent', () => {
    const parent = {
        id: LIMINALITY_PARENT_ID,
        name: 'Liminality',
        collection: 'Provenance',
    };
    const works = [
        { id: 'liminality-1', name: 'Betwixt & Between', collection: 'Liminality' },
        { id: 'liminality-2', name: 'Eerie Night', collection: 'Liminality' },
    ];

    const result = prependCollectionLeadArtworks({
        items: works,
        collectionName: 'Liminality',
        allArtworks: [parent, ...works],
    });

    assert.deepEqual(result.map((item) => item.id), [LIMINALITY_PARENT_ID, 'liminality-1', 'liminality-2']);
});

test('prependCollectionLeadArtworks leaves unrelated collections untouched', () => {
    const items = [{ id: 'work-1', name: 'Gentleman Nº1', collection: 'Gentlemen' }];

    const result = prependCollectionLeadArtworks({
        items,
        collectionName: 'Gentlemen',
        allArtworks: items,
    });

    assert.equal(result, items);
});
