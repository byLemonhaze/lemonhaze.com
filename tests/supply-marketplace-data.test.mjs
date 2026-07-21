import assert from 'node:assert/strict';
import test from 'node:test';

import {
    LINK_OVERRIDES,
    MARKET_LINKS,
    ORDINALS_SUPPLY_DATA,
} from '../src/data.js';

const EXPECTED_LEGACY_ROWS = [
    { name: 'Satoshi CC Edition', year: 2023, inscribed: 110, circulating: 109 },
    { name: 'Deprivation prints', year: 2023, inscribed: 33, circulating: 33 },
    { name: 'Mirage prints', year: 2024, inscribed: 33, circulating: 33 },
    { name: 'Trilogy prints', year: 2025, inscribed: 33, circulating: 33 },
    {
        name: 'Satoshi 1/1 - Counterfeit Cards S00 - C08',
        year: 2023,
        inscribed: 1,
        circulating: 1,
    },
];

const GALLERY_ALIASES = [
    [
        'Satoshi CC Edition',
        'Satoshi (Original & Editions)',
        '/satoshi-original-and-editions',
        'satoshi-by-lemonhaze',
    ],
    ['Deprivation prints', 'Deprivation (Prints)', '/deprivation-prints', 'deprivation-by-lemonhaze'],
    ['Mirage prints', 'Mirage (Prints)', '/mirage-prints', 'mirage-by-lemonhaze'],
    ['Trilogy prints', 'Trilogy (Prints)', '/trilogy-prints', 'prints-trilogy-by-lemonhaze'],
];

test('preserves the historical supply ledger rows and separates the Satoshi original', () => {
    const rowsByName = new Map(ORDINALS_SUPPLY_DATA.map((row) => [row.name, row]));

    for (const expected of EXPECTED_LEGACY_ROWS) {
        assert.deepEqual(rowsByName.get(expected.name), expected);
    }

    assert.equal(rowsByName.has('Satoshi (Original & Editions)'), false);
    assert.equal(rowsByName.has('Deprivation (Prints)'), false);
    assert.equal(rowsByName.has('Mirage (Prints)'), false);
    assert.equal(rowsByName.has('Trilogy (Prints)'), false);
});

test('tracks the Liminality parent burn in the collection supply', () => {
    const row = ORDINALS_SUPPLY_DATA.find((item) => item.name === 'Liminality');
    assert.deepEqual(row, {
        name: 'Liminality',
        year: 2026,
        inscribed: 8,
        circulating: 7,
    });
});

test('tracks the Into The Wild burn in the collection supply', () => {
    const row = ORDINALS_SUPPLY_DATA.find((item) => item.name === 'Into The Wild');
    assert.deepEqual(row, {
        name: 'Into The Wild',
        year: 2026,
        inscribed: 5,
        circulating: 4,
    });
});

test('keeps supply marketplace keys and gallery aliases linked to the same markets', () => {
    for (const [supplyName, galleryName, galleryPath, ordnetSlug] of GALLERY_ALIASES) {
        assert.deepEqual(MARKET_LINKS[supplyName], MARKET_LINKS[galleryName]);
        assert.ok(MARKET_LINKS[supplyName].gamma);
        assert.equal(MARKET_LINKS[supplyName].ordnet, `https://ord.net/collection/${ordnetSlug}`);
        assert.equal(LINK_OVERRIDES[supplyName], `https://lemonhaze.com${galleryPath}`);
        assert.equal(LINK_OVERRIDES[galleryName], `https://lemonhaze.com${galleryPath}`);
    }

    assert.equal(
        LINK_OVERRIDES['Satoshi 1/1 - Counterfeit Cards S00 - C08'],
        'https://lemonhaze.com/satoshi-original-and-editions'
    );
    assert.equal(
        MARKET_LINKS['Satoshi 1/1 - Counterfeit Cards S00 - C08'].ordnet,
        'https://ord.net/collection/satoshi-by-lemonhaze'
    );
});
