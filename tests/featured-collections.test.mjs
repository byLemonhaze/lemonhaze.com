import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { CHRONOLOGY_BY_YEAR, COLLECTION_DETAILS } from '../src/data.js';
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

    assert.equal(items.length, 244);
    assert.equal(new Set(items.map((item) => item.id)).size, 244);
    assert.equal(byCollection.get('Satoshi (Original & Editions)').length, 111);
    assert.equal(byCollection.get('Deprivation (Prints)').length, 33);
    assert.equal(byCollection.get('Mirage (Prints)').length, 33);
    assert.equal(byCollection.get('Trilogy (Prints)').length, 33);
    assert.equal(byCollection.get('Minute, papillon! Edition').length, 21);
    assert.equal(byCollection.get('Griffintown').length, 3);
    assert.equal(byCollection.get('Liminality').length, 7);
    assert.equal(byCollection.get('Eclosion 1/1 - Amsterdam Blooms').length, 1);

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
    const trilogyPreviews = new Map([
        ['Glass Breaker', 'https://cdn.lemonhaze.com/assets/assets/58d21c5f1bbc25932fe1cc784ac47baf8b0ed9241ea989ad2a47b41839d132e7i0.png'],
        ['Mending Out', 'https://cdn.lemonhaze.com/assets/assets/a75945e142877ade9392a0855ef0fdab215af10a7f3e4381d31697c706836228i0.png'],
        ['Off-Kilter', 'https://cdn.lemonhaze.com/assets/assets/15ed0a345c10cb0b26fad820f364898f355924dbf0ce5527dd5d7237e0a25964i0.png'],
    ]);
    assert.ok(trilogy.every((item) => {
        const title = [...trilogyPreviews.keys()].find((candidate) => item.name.startsWith(candidate));
        return item.grid_preview === trilogyPreviews.get(title);
    }));

    const mirage = byCollection.get('Mirage (Prints)');
    assert.ok(mirage.every((item) => (
        item.grid_preview === 'https://cdn.lemonhaze.com/assets/assets/18328c7aeb829846f0c20d5786a2a383b1b546c985681382cd5f073cfa4e3e15i0.png'
    )));

    const minutePapillon = byCollection.get('Minute, papillon! Edition');
    assert.equal(minutePapillon[0].name, 'Minute, papillon! Edition 1 of 21');
    assert.equal(minutePapillon.at(-1).name, 'Minute, papillon! Edition 21 of 21');
    assert.ok(minutePapillon.every((item) => item.artwork_type === 'HTML'));
    assert.ok(minutePapillon.every((item) => (
        item.provenance === '611fad09e407fe63e70c54ee853e755f92cb4d69049eff21f31d3d414a2db74di0'
    )));
    assert.ok(minutePapillon.every((item) => (
        item.grid_preview === 'https://cdn.lemonhaze.com/assets/assets/611fad09e407fe63e70c54ee853e755f92cb4d69049eff21f31d3d414a2db74di0.png'
    )));
    assert.ok(minutePapillon.every((item) => item.timestamp));
    assert.ok(minutePapillon.every((item) => item.content_size));
    assert.ok(minutePapillon.every((item) => item.fee));
    assert.ok(minutePapillon.every((item) => item.sat));
    assert.ok(minutePapillon.every((item) => item.height));
    assert.ok(minutePapillon.every((item) => item.charms === 'palindrome, vindicated'));
    assert.ok(minutePapillon.every((item) => Number.isInteger(item.inscription_number)));
    assert.deepEqual(
        {
            timestamp: minutePapillon[0].timestamp,
            content_size: minutePapillon[0].content_size,
            fee: minutePapillon[0].fee,
            sat: minutePapillon[0].sat,
            height: minutePapillon[0].height,
            inscription_number: minutePapillon[0].inscription_number,
        },
        {
            timestamp: '2025-08-22 07:28:59 UTC',
            content_size: '1592 bytes',
            fee: '663',
            sat: '9820245420289',
            height: '911144',
            inscription_number: 104461784,
        }
    );

    const liminalityParent = items.find((item) => (
        item.id === 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0'
    ));

    const griffintownParent = items.find((item) => (
        item.id === '93bb1c5eb9e48f2efdd200d35339f0a8ad2c261bcf784f40ea83d165b90cfbbci0'
    ));
    assert.equal(griffintownParent.name, 'Griffintown');
    assert.equal(griffintownParent.collection, 'Provenance');
    assert.equal(griffintownParent.role, 'parent');
    assert.equal(griffintownParent.provenance, '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0');
    assert.equal(griffintownParent.inscription_number, 127002775);
    assert.equal(griffintownParent.content_size, '318285 bytes');

    const griffintown = byCollection.get('Griffintown');
    assert.deepEqual(
        griffintown.map((item) => item.name),
        ['Alfred Café', 'Rue des Bassins', 'Le Piano du Havre']
    );
    assert.deepEqual(
        griffintown.map((item) => item.id),
        [
            '313e86271590527ad6ac0b1b850190f4fe891b9783a6855cf1374b1db29517cai0',
            '9994154d4de8d87b818b7fd71f607fff5a54a10d85c3579068894b52dbcd8709i0',
            '21a9f6f82a281c72f1f3375004477f8130f4ad6a52926e48c382f35820d5fc00i0',
        ]
    );
    assert.ok(griffintown.every((item) => item.artwork_type === 'HTML'));
    assert.ok(griffintown.every((item) => item.artist === 'Lemonhaze'));
    assert.ok(griffintown.every((item) => item.series === 'Griffintown'));
    assert.ok(griffintown.every((item) => item.year === 2026));
    assert.ok(griffintown.every((item) => (
        item.provenance === '93bb1c5eb9e48f2efdd200d35339f0a8ad2c261bcf784f40ea83d165b90cfbbci0'
    )));

    assert.equal(liminalityParent.name, 'Liminality');
    assert.equal(liminalityParent.collection, 'Provenance');
    assert.equal(liminalityParent.role, 'parent');
    assert.equal(liminalityParent.provenance, '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0');
    assert.equal(liminalityParent.inscription_number, 126950634);
    assert.equal(liminalityParent.content_size, '39003 bytes');
    assert.equal(
        liminalityParent.grid_preview,
        '/images/liminality/a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0-frameless.png'
    );

    const liminality = byCollection.get('Liminality');
    assert.deepEqual(
        liminality.map((item) => item.name),
        ['Betwixt & Between', 'Eerie Night', 'Non-Place', 'Chlorine Dream', 'Melon Days', 'Porcelain Sunset', 'Terminal 36']
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
            'dfac609d390809809a738b83fbe0dfe70f4811982e20faf7b070011c4dbb3828i0',
        ]
    );
    assert.ok(liminality.every((item) => item.artwork_type === 'HTML'));
    assert.ok(liminality.every((item) => item.artist === 'Lemonhaze'));
    assert.ok(liminality.every((item) => item.series === 'Liminality'));
    assert.ok(liminality.every((item) => item.year === 2026));
    assert.ok(liminality.every((item) => item.about));
    assert.ok(liminality.every((item) => item.grid_preview?.startsWith('/images/liminality/')));
    assert.deepEqual(
        liminality.map((item) => item.inscription_number),
        [126951627, 126951940, 126952137, 126952246, 126955537, 126955717, 126956777]
    );
    assert.ok(liminality.every((item) => (
        item.provenance === 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0'
    )));

    const eclosion = byCollection.get('Eclosion 1/1 - Amsterdam Blooms')[0];
    assert.equal(eclosion.name, 'Eclosion 1/1');
    assert.equal(eclosion.year, 2023);
    assert.equal(eclosion.artwork_type, 'HTML');
    assert.equal(eclosion.content_type, 'text/html;charset=utf-8');
    assert.equal(eclosion.inscription_number, 35257919);
    assert.equal(eclosion.grid_preview, '/images/eclosion/eclosion-1-by-lemonhaze.jpg');

    const terminal36 = liminality.at(-1);
    assert.equal(terminal36.name, 'Terminal 36');
    assert.equal(terminal36.about, 'Departure delayed. Arrival unknown.');
    assert.equal(terminal36.timestamp, '2026-07-21 15:43:49 UTC');
    assert.equal(terminal36.content_size, '33701 bytes');
    assert.equal(terminal36.fee, '6044');
    assert.equal(terminal36.sat, '1694409632821029');
    assert.equal(terminal36.height, '959027');
});

test('featured collections sit in the intended reverse chronology', () => {
    const year2026 = CHRONOLOGY_BY_YEAR['2026'];
    assert.equal(year2026[0], 'Griffintown');
    assert.equal(year2026[1], 'Liminality');
    assert.ok(year2026.indexOf('Griffintown') < year2026.indexOf('Liminality'));
    assert.ok(year2026.indexOf('Liminality') < year2026.indexOf('Into The Wild'));

    const year2023 = CHRONOLOGY_BY_YEAR['2023'];
    assert.ok(year2023.indexOf('Candidly Yours') < year2023.indexOf('Eclosion 1/1 - Amsterdam Blooms'));
    assert.ok(year2023.indexOf('Eclosion 1/1 - Amsterdam Blooms') < year2023.indexOf('Untitled'));
    assert.ok(year2023.indexOf('Oaxaca') < year2023.indexOf('Satoshi (Original & Editions)'));
    assert.ok(year2023.indexOf('Satoshi (Original & Editions)') < year2023.indexOf('Old-Fashioned'));
    assert.ok(year2023.indexOf('Old-Fashioned') < year2023.indexOf('Deprivation (Prints)'));
    assert.ok(year2023.indexOf('Deprivation (Prints)') < year2023.indexOf('Orphelinat'));
    assert.ok(year2023.indexOf('Dark Days') < year2023.indexOf('Mending Fragments'));

    const year2024 = CHRONOLOGY_BY_YEAR['2024'];
    assert.ok(year2024.indexOf('DeVille') < year2024.indexOf('Mirage (Prints)'));
    assert.ok(year2024.indexOf('Mirage (Prints)') < year2024.indexOf('Unregulated Minds'));

    const year2025 = CHRONOLOGY_BY_YEAR['2025'];
    assert.ok(year2025.indexOf('BEST BEFORE') < year2025.indexOf('Minute, papillon! Edition'));
    assert.ok(year2025.indexOf('Minute, papillon! Edition') < year2025.indexOf('Trilogy (Prints)'));
    assert.ok(year2025.indexOf('Trilogy (Prints)') < year2025.indexOf('Ma ville en quatre temps'));
});

test('collection details expose tools and documented print launch prices', () => {
    assert.equal(COLLECTION_DETAILS.Gentlemen.medium, undefined);
    assert.match(COLLECTION_DETAILS.Gentlemen.tools, /AI/);
    assert.equal(COLLECTION_DETAILS.Manufactured.tools, 'p5.js');
    assert.equal(COLLECTION_DETAILS['Satoshi (Original & Editions)'].tools, 'AI · Krita · collage');

    assert.equal(COLLECTION_DETAILS['Deprivation (Prints)'].primaryPriceBTC, 0.00069);
    assert.equal(COLLECTION_DETAILS['Mirage (Prints)'].primaryPriceBTC, 0.00169);
    assert.equal(COLLECTION_DETAILS['Trilogy (Prints)'].primaryPriceBTC, 0.00169);
    assert.equal(COLLECTION_DETAILS['Eclosion 1/1 - Amsterdam Blooms'].tools, 'Krita · AI · p5.js');
    assert.equal(COLLECTION_DETAILS['Eclosion 1/1 - Amsterdam Blooms'].primaryPriceBTC, 0.08);
    assert.equal(COLLECTION_DETAILS['Deprivation (Prints)'].primarySaleInHistory, true);
    assert.equal(COLLECTION_DETAILS['Mirage (Prints)'].primarySaleInHistory, true);
    assert.equal(COLLECTION_DETAILS['Trilogy (Prints)'].primarySaleInHistory, true);
});
