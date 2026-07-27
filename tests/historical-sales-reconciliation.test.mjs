import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sheet = JSON.parse(readFileSync(
    new URL('../public/data/sales-master/historical-sales-sheet.json', import.meta.url),
    'utf8',
));

test('sales sheet includes reconciled Satoshi and latest Gentlemen trades', () => {
    assert.equal(sheet.rowCount, sheet.rows.length);
    assert.equal(sheet.rows.length, 1673);

    const satoshi = sheet.rows.filter((row) => row.collectionSlug === 'satoshi-by-lemonhaze');
    const satoshiSecondary = satoshi.filter((row) => row.saleType === 'secondary');
    const satoshiPrimary = satoshi.filter((row) => row.saleType === 'primary');
    assert.equal(satoshi.length, 40);
    assert.equal(satoshiSecondary.length, 39);
    assert.ok(satoshiSecondary.every((row) => row.source === 'satflow' || row.source === 'ord.net+satflow'));
    assert.equal(satoshiPrimary.length, 1);
    assert.equal(satoshiPrimary[0].source, 'reconstructed-issuance');
    assert.equal(satoshiPrimary[0].priceBTC, 0.08929222);
    assert.equal(satoshiPrimary[0].bundleCount, 110);

    const gentlemenTrade = sheet.rows.find((row) => (
        row.transactionId === '1ec36a0b25b8d5936a293e72dce44e4696158c9c1ca430bc670225816aebe1b5'
    ));
    assert.equal(gentlemenTrade?.collectionSlug, 'gentlemen-by-lemonhaze');
    assert.equal(gentlemenTrade?.saleType, 'secondary');
    assert.equal(gentlemenTrade?.priceBTC, 0.11);
    assert.equal(gentlemenTrade?.settlementPriceBTC, 0.10723255);
    assert.equal(gentlemenTrade?.timestamp, '2026-07-26T09:23:56.480Z');
});

test('records Éclosion and recent Ord.net resale coverage without reclassifying primary sales', () => {
    const eclosion = sheet.rows.find((row) => (
        row.inscriptionId === 'aaf0e314aab67783d7e92b0987b0c34ae610b41f64aa1ff7cae8c4fbeebf9029i0'
    ));
    assert.deepEqual(eclosion, {
        entryType: 'inscription-sale',
        inscriptionId: 'aaf0e314aab67783d7e92b0987b0c34ae610b41f64aa1ff7cae8c4fbeebf9029i0',
        collectionSlug: 'eclosion-amsterdam-blooms',
        collectionName: 'Eclosion 1/1 - Amsterdam Blooms',
        artworkName: 'Eclosion 1/1 - Amsterdam Blooms',
        timestamp: '2024-01-26T14:37:31.000Z',
        saleType: 'primary',
        priceBTC: 0.08,
        source: 'gamma-activity+mempool',
        transactionId: '3001ba37187ae1512e4381171caafa2db2074c580b716d7d73a458f4ab828d4d',
        marketplace: 'gamma',
        priceBasis: 'gross',
    });

    const ordnetRows = sheet.rows.filter((row) => row.source === 'ord.net-public-insights');
    assert.equal(ordnetRows.length, 70);
    assert.ok(ordnetRows.every((row) => row.saleType === 'secondary'));
    const manufacturedRows = sheet.rows.filter((row) => row.collectionSlug === 'manufactured-by-lemonhaze');
    const manufacturedResales = manufacturedRows.filter((row) => row.saleType === 'secondary');
    const manufacturedPrimary = manufacturedRows.filter((row) => row.saleType === 'primary');
    assert.equal(manufacturedRows.length, 553);
    assert.equal(manufacturedResales.length, 344);
    assert.equal(manufacturedResales.filter((row) => row.source === 'ord.net-public-insights').length, 62);
    assert.equal(manufacturedResales.filter((row) => row.source === 'historical-sales-archive').length, 282);
    assert.equal(manufacturedPrimary.length, 209);
    assert.equal(
        Number(manufacturedPrimary.reduce((sum, row) => sum + row.priceBTC, 0).toFixed(8)),
        0.8752861,
    );
    assert.ok(manufacturedPrimary.every((row) => (
        row.source === 'documented-release-primary' && row.priceBasis === 'gross'
    )));
    assert.equal(
        manufacturedRows.filter((row) => row.source === 'bestinslot-v2api').length,
        0,
    );
    assert.equal(sheet.marketplaceCoverage.length, 47);
    assert.equal(
        sheet.marketplaceCoverage.find((row) => row.collectionSlug === 'manufactured-by-lemonhaze')?.volumeBTC,
        7.08096671,
    );
});

test('print launch bundles stay primary while marketplace trades are resales', () => {
    const expectedUnitPrices = new Map([
        ['deprivation-by-lemonhaze', 0.00069],
        ['mirage-by-lemonhaze', 0.00169],
        ['prints-trilogy-by-lemonhaze', 0.00169],
    ]);

    for (const [slug, unitPrice] of expectedUnitPrices) {
        const rows = sheet.rows.filter((row) => row.collectionSlug === slug);
        const marketplaceTrades = rows.filter((row) => row.entryType === 'inscription-sale');
        const launchBundles = rows.filter((row) => (
            row.entryType === 'bundle-sale' && row.saleType === 'primary'
        ));

        assert.ok(marketplaceTrades.length > 0);
        assert.ok(marketplaceTrades.every((row) => row.saleType === 'secondary'));
        assert.ok(launchBundles.length > 0);
        assert.ok(launchBundles.every((row) => row.unitPriceBTC === unitPrice));
    }
});

test('canonical CSV carries the same reconciled sale rows', () => {
    const csv = readFileSync(
        new URL('../public/data/sales-master/historical-sales-sheet.csv', import.meta.url),
        'utf8',
    );
    const [header, ...lines] = csv.trimEnd().split('\n');

    assert.match(header, /^entryType,inscriptionId,collectionSlug/);
    assert.equal(lines.length, sheet.rows.length);
    assert.match(
        csv,
        /gentlemen-by-lemonhaze,Gentlemen,Gentleman Nº10,2026-07-26T09:23:56\.480Z,secondary,0\.11/,
    );
});
