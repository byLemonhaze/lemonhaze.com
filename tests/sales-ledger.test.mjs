import test from "node:test";
import assert from "node:assert/strict";

import {
  computeSalesSummary,
  formatBtc,
  formatBtcCompact,
  formatUsdToday,
  parseSalesTimestampMs,
} from "../src/modules/sales-ledger.js";

test("computeSalesSummary uses explicit sale types and avoids aggregate resale double counting", () => {
  const summary = computeSalesSummary({
    summaryRows: [
      {
        priceBTC: "0.1",
        saleType: "primary",
        collectionSlug: "best-before",
      },
      {
        priceBTC: "0.2",
        saleType: "secondary",
        collectionSlug: "best-before",
      },
      {
        priceBTC: "0.05",
        collectionSlug: "manufactured",
      },
      {
        priceBTC: "0.07",
        collectionSlug: "manufactured",
      },
      {
        entryType: "bundle-sale",
        bundleCount: 33,
        priceBTC: "0.33",
        saleType: "primary",
        collectionSlug: "prints",
      },
      {
        entryType: "bundle-sale",
        aggregateSalesCount: 8,
        priceBTC: "0.5",
        saleType: "secondary",
        collectionSlug: "prints",
        source: "manual-aggregate",
      },
      {
        priceBTC: "not-a-number",
        saleType: "secondary",
        collectionSlug: "ignored",
      },
    ],
  });

  assert.equal(summary.primaryBtc, 0.43);
  assert.equal(summary.secondaryBtc, 0.2);
  assert.equal(summary.totalBtc, 0.63);
  assert.equal(summary.primarySales, 2);
  assert.equal(summary.secondarySales, 1);
  assert.equal(summary.includedSales, 3);
  assert.equal(summary.excludedAggregateRows, 1);
  assert.equal(summary.unclassifiedSales, 2);
  assert.deepEqual(summary.collections, [
    {
      slug: "prints",
      sales: 1,
      primarySales: 1,
      secondarySales: 0,
      primaryBtc: 0.33,
      secondaryBtc: 0,
      totalBtc: 0.33,
    },
    {
      slug: "best-before",
      sales: 2,
      primarySales: 1,
      secondarySales: 1,
      primaryBtc: 0.1,
      secondaryBtc: 0.2,
      totalBtc: 0.3,
    },
  ]);
});

test("sales ledger formatters handle valid and invalid values", () => {
  assert.equal(formatBtc(1.23), "1.23");
  assert.equal(formatBtcCompact(1.23456), "1.2346");
  assert.equal(formatBtcCompact(0.001), "0.001");
  assert.equal(formatBtc("invalid"), "—");
  assert.equal(formatUsdToday(0.5, 100000), "$50,000");
  assert.equal(formatUsdToday("invalid", 100000), "—");
  assert.equal(parseSalesTimestampMs("1711843200"), 1711843200000);
  assert.equal(
    parseSalesTimestampMs("2025-01-01 00:00:00 UTC"),
    Date.parse("2025-01-01T00:00:00Z"),
  );
});

test("collection coverage raises resale volume without fabricating a trade count", () => {
  const summary = computeSalesSummary({
    summaryRows: [
      { priceBTC: 0.1, saleType: 'primary', collectionSlug: 'manufactured-by-lemonhaze' },
      { priceBTC: 0.2, saleType: 'secondary', collectionSlug: 'manufactured-by-lemonhaze' },
    ],
    marketplaceCoverage: [
      { collectionSlug: 'manufactured-by-lemonhaze', volumeBTC: 0.8 },
    ],
  });

  assert.equal(summary.primaryBtc, 0.1);
  assert.equal(summary.secondaryBtc, 0.7);
  assert.equal(summary.secondarySales, 1);
  assert.equal(summary.totalBtc, 0.8);
});
