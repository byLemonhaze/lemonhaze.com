import test from 'node:test';
import assert from 'node:assert/strict';

import { prependCollectionLeadArtworks } from '../src/app/collection-flow.js';

const BB_PARENT_ID = 'bcf16735647186ef853dedd820c9319e9895f99bfddedcfb782ace38093bb8fbi0';

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

test('prependCollectionLeadArtworks leaves unrelated collections untouched', () => {
    const items = [{ id: 'work-1', name: 'Gentleman Nº1', collection: 'Gentlemen' }];

    const result = prependCollectionLeadArtworks({
        items,
        collectionName: 'Gentlemen',
        allArtworks: items,
    });

    assert.equal(result, items);
});
