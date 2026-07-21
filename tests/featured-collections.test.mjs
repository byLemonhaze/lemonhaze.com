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

    assert.equal(items.length, 217);
    assert.equal(new Set(items.map((item) => item.id)).size, 217);
    assert.equal(byCollection.get('Satoshi (Original & Editions)').length, 111);
    assert.equal(byCollection.get('Deprivation (Prints)').length, 33);
    assert.equal(byCollection.get('Mirage (Prints)').length, 33);
    assert.equal(byCollection.get('Trilogy (Prints)').length, 33);
    assert.equal(byCollection.get('Liminality').length, 6);

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

    const liminalityParent = items.find((item) => (
        item.id === 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0'
    ));
    assert.equal(liminalityParent.name, 'Liminality');
    assert.equal(liminalityParent.collection, 'Provenance');
    assert.equal(liminalityParent.role, 'parent');
    assert.equal(liminalityParent.provenance, '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0');
    assert.equal(liminalityParent.inscription_number, 126950634);
    assert.equal(liminalityParent.content_size, '39003 bytes');

    const liminality = byCollection.get('Liminality');
    assert.deepEqual(
        liminality.map((item) => item.name),
        ['Betwixt & Between', 'Eerie Night', 'Non-Place', 'Chlorine Dream', 'Melon Days', 'Porcelain Sunset']
    );
    assert.deepEqual(
        liminality.map((item) => item.id),
        [
            'b1b64766543cbcb089d252f67f77d0f562ae96bbee28ad4effee25d42b19da04i0',
            '7a267ee7dd4c56950d1e4b70c914389793cab7e738ace8b591ec56fec0312674i0',
            '38368e42ce7817d6994e459f27b85574e9be0eadaee6645af0fba81829ca8102i0',
            '30e88e8a5ac33a3607d7b4b35042d48ef3a9a9f1d4af014a4667d6b4e29f04d9i0',
            'ba1d7eaf918d78821037fc256789f5e070dd7e58fcec6e15cef64a4e51ab7ba3i0',
            '4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0',
        ]
    );
    assert.ok(liminality.every((item) => item.artwork_type === 'HTML'));
    assert.ok(liminality.every((item) => item.artist === 'Lemonhaze'));
    assert.ok(liminality.every((item) => item.series === 'Liminality'));
    assert.ok(liminality.every((item) => item.year === 2026));
    assert.ok(liminality.every((item) => item.about));
    assert.deepEqual(
        liminality.map((item) => item.inscription_number),
        [126951627, 126951940, 126952137, 126952246, 126955537, 126955717]
    );
    assert.ok(liminality.every((item) => (
        item.provenance === 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0'
    )));
});

test('featured collections sit in the intended reverse chronology', () => {
    const year2026 = CHRONOLOGY_BY_YEAR['2026'];
    assert.equal(year2026[0], 'Liminality');
    assert.ok(year2026.indexOf('Liminality') < year2026.indexOf('Into The Wild'));

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
