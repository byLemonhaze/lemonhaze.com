import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CHRONOLOGY_BY_YEAR } from '../src/data.js';
import { fetchFeaturedCollections } from '../src/data/featured-collections.js';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
    globalThis.fetch = originalFetch;
});

test('featured collection manifests load complete, ordered galleries', async () => {
    globalThis.fetch = async (url) => {
        const contents = readFileSync(new URL(`../public${url}`, import.meta.url), 'utf8');
        return {
            ok: true,
            status: 200,
            json: async () => JSON.parse(contents),
        };
    };

    const items = await fetchFeaturedCollections();
    const byCollection = Map.groupBy(items, (item) => item.collection);

    assert.equal(items.length, 210);
    assert.equal(new Set(items.map((item) => item.id)).size, 210);
    assert.equal(byCollection.get('Satoshi (Original & Editions)').length, 111);
    assert.equal(byCollection.get('Deprivation (Prints)').length, 33);
    assert.equal(byCollection.get('Mirage (Prints)').length, 33);
    assert.equal(byCollection.get('Trilogy (Prints)').length, 33);

    const satoshi = byCollection.get('Satoshi (Original & Editions)');
    assert.equal(satoshi[0].name, 'Satoshi (Original)');
    assert.equal(satoshi[1].name, 'Satoshi #1');
    assert.equal(satoshi.at(-1).name, 'Satoshi #110');
    assert.equal(satoshi[0].artwork_type, 'WEBP');
    assert.equal(satoshi[1].artwork_type, 'SVG');
    assert.equal(satoshi[1].provenance, satoshi[0].id);

    const trilogy = byCollection.get('Trilogy (Prints)');
    assert.match(trilogy[0].name, /^(Glass Breaker|Mending Out|Off-Kilter) #\d+$/);
    assert.ok(trilogy.every((item) => item.provenance));
    assert.ok(trilogy.every((item) => item.artwork_type === 'HTML'));
});

test('featured collections sit in the intended reverse chronology', () => {
    const year2023 = CHRONOLOGY_BY_YEAR['2023'];
    assert.ok(year2023.indexOf('Oaxaca') < year2023.indexOf('Satoshi (Original & Editions)'));
    assert.ok(year2023.indexOf('Satoshi (Original & Editions)') < year2023.indexOf('Old-Fashioned'));
    assert.ok(year2023.indexOf('Old-Fashioned') < year2023.indexOf('Deprivation (Prints)'));
    assert.ok(year2023.indexOf('Deprivation (Prints)') < year2023.indexOf('Orphelinat'));
    assert.ok(year2023.indexOf('Dark Days') < year2023.indexOf('Mending Fragments'));

    const year2024 = CHRONOLOGY_BY_YEAR['2024'];
    assert.ok(year2024.indexOf('DeVille') < year2024.indexOf('Mirage (Prints)'));
    assert.ok(year2024.indexOf('Mirage (Prints)') < year2024.indexOf('Unregulated Minds'));

    const year2025 = CHRONOLOGY_BY_YEAR['2025'];
    assert.ok(year2025.indexOf('BEST BEFORE') < year2025.indexOf('Trilogy (Prints)'));
    assert.ok(year2025.indexOf('Trilogy (Prints)') < year2025.indexOf('Ma ville en quatre temps'));
});
