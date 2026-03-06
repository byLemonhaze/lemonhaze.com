import test from "node:test";
import assert from "node:assert/strict";

import {
  computeSalesSummary,
  formatBtc,
  formatUsdToday,
  parseSalesTimestampMs,
} from "../src/modules/sales-ledger.js";

test("computeSalesSummary preserves explicit sale types and infers the oldest sale as primary", () => {
  const summary = computeSalesSummary({
    inscriptions: {
      alpha: [
        {
          priceBTC: "0.1",
          saleType: "primary",
          collectionSlug: "best-before",
          timestamp: "2025-01-01T00:00:00Z",
        },
        {
          priceBTC: "0.2",
          saleType: "secondary",
          collectionSlug: "best-before",
          timestamp: "2025-02-01T00:00:00Z",
        },
      ],
      beta: [
        {
          priceBTC: "0.05",
          collectionSlug: "manufactured",
          timestamp: "2024-01-01T00:00:00Z",
        },
        {
          priceBTC: "0.07",
          collectionSlug: "manufactured",
          timestamp: "2024-06-01T00:00:00Z",
        },
      ],
      ignored: [
        {
          priceBTC: "not-a-number",
          collectionSlug: "ignored",
          timestamp: "2024-01-01T00:00:00Z",
        },
      ],
    },
  });

  assert.equal(summary.primaryBtc, 0.15);
  assert.equal(summary.secondaryBtc, 0.27);
  assert.equal(summary.totalBtc, 0.42);
  assert.deepEqual(summary.collections, [
    {
      slug: "best-before",
      sales: 2,
      primaryBtc: 0.1,
      secondaryBtc: 0.2,
      totalBtc: 0.3,
    },
    {
      slug: "manufactured",
      sales: 2,
      primaryBtc: 0.05,
      secondaryBtc: 0.07,
      totalBtc: 0.12,
    },
  ]);
});

test("sales ledger formatters handle valid and invalid values", () => {
  assert.equal(formatBtc(1.23), "1.23");
  assert.equal(formatBtc("invalid"), "—");
  assert.equal(formatUsdToday(0.5, 100000), "$50,000 today");
  assert.equal(formatUsdToday("invalid", 100000), "—");
  assert.equal(parseSalesTimestampMs("1711843200"), 1711843200000);
  assert.equal(
    parseSalesTimestampMs("2025-01-01 00:00:00 UTC"),
    Date.parse("2025-01-01T00:00:00Z"),
  );
});
