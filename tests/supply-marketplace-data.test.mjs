import assert from 'node:assert/strict';
import test from 'node:test';

import {
    EXTRA_ORDINALS_SUPPLY_DATA,
    LINK_OVERRIDES,
    MARKET_LINKS,
    ORDINALS_SUPPLY_DATA,
} from '../src/data.js';

const GALLERY_ROWS = [
    ['Satoshi (Original & Editions)', '/satoshi-original-and-editions', 'satoshi-by-lemonhaze'],
    ['Deprivation (Prints)', '/deprivation-prints', 'deprivation-prints-by-lemonhaze'],
    ['Mirage (Prints)', '/mirage-prints', 'mirage-prints-by-lemonhaze'],
    ['Trilogy (Prints)', '/trilogy-prints', 'trilogy-prints-by-lemonhaze'],
    ['1 of 1s (2024)', '/collection?name=1%20of%201s%20(2024)', '1on1-by-lemonhaze'],
    ['1 of 1s (2025)', '/collection?name=1%20of%201s%20(2025)', '1on1-2025-by-lemonhaze'],
];

test('Supply uses the complete 47-collection Ord.net roster without a Provenance collection', () => {
    assert.equal(ORDINALS_SUPPLY_DATA.length, 47);
    assert.equal(ORDINALS_SUPPLY_DATA.some((row) => row.name === 'Provenance'), false);

    const rowsByName = new Map(ORDINALS_SUPPLY_DATA.map((row) => [row.name, row]));
    assert.deepEqual(rowsByName.get('Satoshi (Original & Editions)'), {
        name: 'Satoshi (Original & Editions)', year: 2023, inscribed: 111, circulating: 110,
    });
    assert.deepEqual(rowsByName.get('Manufactured'), {
        name: 'Manufactured', year: 2024, inscribed: 422, circulating: 239,
    });
    assert.deepEqual(rowsByName.get('BEST BEFORE'), {
        name: 'BEST BEFORE', year: 2025, inscribed: 421, circulating: 420,
    });
    assert.deepEqual(rowsByName.get('Liminality'), {
        name: 'Liminality', year: 2026, inscribed: 8, circulating: 7,
    });
    assert.deepEqual(rowsByName.get('Into The Wild'), {
        name: 'Into The Wild', year: 2026, inscribed: 5, circulating: 4,
    });

    const totals = [...ORDINALS_SUPPLY_DATA, ...EXTRA_ORDINALS_SUPPLY_DATA]
        .reduce((sum, row) => ({
            inscribed: sum.inscribed + row.inscribed,
            circulating: sum.circulating + row.circulating,
        }), { inscribed: 0, circulating: 0 });
    assert.deepEqual(totals, { inscribed: 1626, circulating: 1300 });
    assert.equal(totals.inscribed - totals.circulating, 326);
});

test('keeps non-Ord.net works separate from the indexed collection roster', () => {
    assert.deepEqual(
        EXTRA_ORDINALS_SUPPLY_DATA.map((row) => row.name),
        [
            'Stuntman',
            'Text & Unclassified',
            'Split collectible',
            'Colors',
            'Cypherville Comics',
            'Eclosion 1/1 - Amsterdam Blooms',
            'Skull 506 [Remix] 1/1 - Skullx',
        ],
    );
    assert.equal(EXTRA_ORDINALS_SUPPLY_DATA.some((row) => row.name === 'Provenance'), false);
});

test('keeps the collection marketplace links aligned with their gallery routes', () => {
    for (const [name, path, ordnetSlug] of GALLERY_ROWS) {
        assert.ok(MARKET_LINKS[name].gamma);
        assert.equal(MARKET_LINKS[name].ordnet, `https://ord.net/collection/${ordnetSlug}`);
        assert.equal(LINK_OVERRIDES[name], `https://lemonhaze.com${path}`);
    }

    assert.equal(
        LINK_OVERRIDES['Skull 506 [Remix] 1/1 - Skullx'],
        'https://gamma.io/ordinals/collections/skullx-the-artist-series/items',
    );
});

test('includes an Ord.net collection link for each of the 47 indexed collections', () => {
    for (const row of ORDINALS_SUPPLY_DATA) {
        assert.match(
            MARKET_LINKS[row.name]?.ordnet || '',
            /^https:\/\/ord\.net\/collection\/[a-z0-9_-]+$/,
            `${row.name} should link to its live Ord.net collection`,
        );
    }
});
