const HISTORICAL_SALES_SHEET_URL = '/data/sales-master/historical-sales-sheet.json';
const BTC_SPOT_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const BTC_SPOT_TTL_MS = 2 * 60 * 1000;
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

let historicalSalesPromise = null;
let historicalSalesCache = null;
let salesIndexPromise = null;
let salesIndexCache = null;

let btcSpotPromise = null;
let btcSpotValue = null;
let btcSpotFetchedAt = 0;

const COLLECTION_SLUG_ALIASES = {
  cypherville: 'cypherville-by-lemonhaze',
  'portrait-2490': 'portrait-2490-by-lemonhaze',
  'deprivation-by-lemonhaze': 'deprivation-prints-by-lemonhaze',
  'mirage-by-lemonhaze': 'mirage-prints-by-lemonhaze',
  'prints-trilogy-by-lemonhaze': 'trilogy-prints-by-lemonhaze',
  'miscelleneous-by-lemonhaze': 'miscellaneous-by-lemonhaze',
  framed: 'framed-by-lemonhaze',
};

function normalizeInscriptionId(value) {
  return String(value || '').trim().toLowerCase();
}

function canonicalCollectionSlug(value) {
  const slug = clean(value).toLowerCase() || 'unknown';
  return COLLECTION_SLUG_ALIASES[slug] || slug;
}

function clean(value) {
  return String(value || '')
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .trim();
}

function parseRelativeTimestampMs(raw) {
  const m = raw
    .toLowerCase()
    .match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|mo|month|months|y|yr|yrs|year|years)\s*(ago)?$/);
  if (!m) return Number.NaN;

  const amount = Number(m[1]);
  const unit = m[2];
  if (!Number.isFinite(amount) || amount < 0) return Number.NaN;

  let factorMs = Number.NaN;
  if (unit === 's' || unit.startsWith('sec')) factorMs = 1000;
  else if (unit === 'm' || unit.startsWith('min')) factorMs = 60 * 1000;
  else if (unit === 'h' || unit.startsWith('hr') || unit.startsWith('hour')) factorMs = 60 * 60 * 1000;
  else if (unit === 'd' || unit.startsWith('day')) factorMs = 24 * 60 * 60 * 1000;
  else if (unit === 'w' || unit.startsWith('week')) factorMs = 7 * 24 * 60 * 60 * 1000;
  else if (unit === 'mo' || unit.startsWith('month')) factorMs = 30.4375 * 24 * 60 * 60 * 1000;
  else if (unit === 'y' || unit.startsWith('yr') || unit.startsWith('year')) factorMs = 365.25 * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(factorMs)) return Number.NaN;

  return Date.now() - Math.round(amount * factorMs);
}

export function parseSalesTimestampMs(value) {
  const raw = clean(value);
  if (!raw) return Number.NaN;

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
  }

  const relative = parseRelativeTimestampMs(raw);
  if (Number.isFinite(relative)) return relative;

  const direct = Date.parse(raw);
  if (Number.isFinite(direct)) return direct;

  const normalized = raw.replace(' UTC', 'Z').replace(' ', 'T');
  const parsed = Date.parse(normalized);
  if (Number.isFinite(parsed)) return parsed;

  return Number.NaN;
}

export function formatBtc(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(8).replace(/\.?0+$/, '');
}

export function formatBtcCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatUsdToday(btcValue, btcUsdSpot) {
  const btc = Number(btcValue);
  const spot = Number(btcUsdSpot);
  if (!Number.isFinite(btc) || !Number.isFinite(spot) || spot <= 0) return '—';
  return usdFormatter.format(btc * spot);
}

function compareEventsNewestFirst(a, b) {
  const ta = parseSalesTimestampMs(a?.timestamp);
  const tb = parseSalesTimestampMs(b?.timestamp);
  const aValid = Number.isFinite(ta);
  const bValid = Number.isFinite(tb);
  if (aValid && bValid) return tb - ta;
  if (aValid) return -1;
  if (bValid) return 1;
  return (Number(b?.priceBTC) || 0) - (Number(a?.priceBTC) || 0);
}

function isBundleLikeRow(row) {
  return Boolean(
    clean(row?.bundleLabel)
    || clean(row?.bundleType)
    || Number.isFinite(Number(row?.bundleCount)),
  );
}

async function loadHistoricalSalesSheet() {
  if (historicalSalesCache) return historicalSalesCache;
  if (historicalSalesPromise) return historicalSalesPromise;

  historicalSalesPromise = (async () => {
    try {
      const res = await fetch(HISTORICAL_SALES_SHEET_URL, { cache: 'no-store' });
      if (!res.ok) return { rows: [] };
      const payload = await res.json();
      historicalSalesCache = payload && typeof payload === 'object'
        ? payload
        : { rows: [] };
      return historicalSalesCache;
    } catch {
      historicalSalesCache = { rows: [] };
      return historicalSalesCache;
    } finally {
      historicalSalesPromise = null;
    }
  })();

  return historicalSalesPromise;
}

function buildSalesIndexFromRows(rows, marketplaceCoverage = []) {
  const inscriptions = {};
  const safeRows = Array.isArray(rows) ? rows : [];

  for (const row of safeRows) {
    const inscriptionId = normalizeInscriptionId(row?.inscriptionId);
    if (!inscriptionId) continue;

    const entryType = clean(row?.entryType).toLowerCase();
    if (entryType === 'bundle-sale') continue;
    if (!entryType && isBundleLikeRow(row)) continue;

    if (!Array.isArray(inscriptions[inscriptionId])) inscriptions[inscriptionId] = [];
    inscriptions[inscriptionId].push(row);
  }

  for (const events of Object.values(inscriptions)) {
    events.sort(compareEventsNewestFirst);
  }

  return {
    inscriptions,
    summaryRows: safeRows,
    marketplaceCoverage: Array.isArray(marketplaceCoverage) ? marketplaceCoverage : [],
  };
}

async function loadSalesIndex() {
  if (salesIndexCache) return salesIndexCache;
  if (salesIndexPromise) return salesIndexPromise;

  salesIndexPromise = (async () => {
    const historicalSheet = await loadHistoricalSalesSheet();
    salesIndexCache = buildSalesIndexFromRows(
      historicalSheet?.rows,
      historicalSheet?.marketplaceCoverage,
    );
    return salesIndexCache;
  })().finally(() => {
    salesIndexPromise = null;
  });

  return salesIndexPromise;
}

export async function getSalesIndex() {
  return loadSalesIndex();
}

export function computeSalesSummary(indexPayload) {
  const inscriptions = indexPayload?.inscriptions && typeof indexPayload.inscriptions === 'object'
    ? indexPayload.inscriptions
    : {};
  const rows = Array.isArray(indexPayload?.summaryRows)
    ? indexPayload.summaryRows
    : Object.values(inscriptions).flatMap((events) => (
      Array.isArray(events) ? events : []
    ));

  let primaryBtc = 0;
  let secondaryBtc = 0;
  let primarySales = 0;
  let secondarySales = 0;
  let excludedAggregateRows = 0;
  let unclassifiedSales = 0;
  const byCollection = new Map();

  for (const event of rows) {
    const price = Number(event?.priceBTC);
    if (!Number.isFinite(price)) continue;

    const saleType = clean(event?.saleType).toLowerCase();
    if (saleType !== 'primary' && saleType !== 'secondary') {
      unclassifiedSales += 1;
      continue;
    }

    const entryType = clean(event?.entryType).toLowerCase();
    const source = clean(event?.source).toLowerCase();
    const isPrimaryAdjustment = saleType === 'primary' && entryType === 'primary-adjustment';
    const isSecondaryAggregate = saleType === 'secondary'
      && entryType === 'bundle-sale'
      && (
        Number.isFinite(Number(event?.aggregateSalesCount))
        || source.includes('aggregate')
      );
    if (isSecondaryAggregate) {
      excludedAggregateRows += 1;
      continue;
    }

    const isPrimary = saleType === 'primary';
    if (isPrimary) {
      primaryBtc += price;
      if (!isPrimaryAdjustment) primarySales += 1;
    } else {
      secondaryBtc += price;
      secondarySales += 1;
    }

    const slug = canonicalCollectionSlug(event.collectionSlug);
    const current = byCollection.get(slug) || {
      slug,
      sales: 0,
      primarySales: 0,
      secondarySales: 0,
      primaryBtc: 0,
      secondaryBtc: 0,
      totalBtc: 0,
    };
    if (!isPrimaryAdjustment) current.sales += 1;
    if (isPrimary) {
      if (!isPrimaryAdjustment) current.primarySales += 1;
      current.primaryBtc += price;
    } else {
      current.secondarySales += 1;
      current.secondaryBtc += price;
    }
    current.totalBtc += price;
    byCollection.set(slug, current);
  }

  const marketplaceCoverage = Array.isArray(indexPayload?.marketplaceCoverage)
    ? indexPayload.marketplaceCoverage
    : [];
  for (const coverage of marketplaceCoverage) {
    const volumeBTC = Number(coverage?.volumeBTC);
    if (!Number.isFinite(volumeBTC) || volumeBTC < 0) continue;

    const slug = canonicalCollectionSlug(coverage?.collectionSlug);
    const current = byCollection.get(slug) || {
      slug,
      sales: 0,
      primarySales: 0,
      secondarySales: 0,
      primaryBtc: 0,
      secondaryBtc: 0,
      totalBtc: 0,
    };
    const secondaryFloor = Math.max(0, volumeBTC - current.primaryBtc);
    current.secondaryBtc = Math.max(current.secondaryBtc, secondaryFloor);
    current.totalBtc = current.primaryBtc + current.secondaryBtc;
    byCollection.set(slug, current);
  }

  secondaryBtc = [...byCollection.values()].reduce(
    (sum, collection) => sum + collection.secondaryBtc,
    0,
  );

  const collections = [...byCollection.values()]
    .map((entry) => ({
      ...entry,
      primaryBtc: Number(entry.primaryBtc.toFixed(8)),
      secondaryBtc: Number(entry.secondaryBtc.toFixed(8)),
      totalBtc: Number(entry.totalBtc.toFixed(8)),
    }))
    .sort((a, b) => b.totalBtc - a.totalBtc);

  return {
    primaryBtc: Number(primaryBtc.toFixed(8)),
    secondaryBtc: Number(secondaryBtc.toFixed(8)),
    totalBtc: Number((primaryBtc + secondaryBtc).toFixed(8)),
    primarySales,
    secondarySales,
    includedSales: primarySales + secondarySales,
    excludedAggregateRows,
    unclassifiedSales,
    collections,
  };
}

export async function getSalesForInscription(inscriptionId) {
  const key = normalizeInscriptionId(inscriptionId);
  if (!key) return [];

  const payload = await loadHistoricalSalesSheet();
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  const events = rows.filter((row) => normalizeInscriptionId(row?.inscriptionId) === key);
  return [...events].sort(compareEventsNewestFirst);
}

export async function getSalesForCollection(collectionSlug) {
  const slug = canonicalCollectionSlug(collectionSlug);
  if (!slug) return [];

  const payload = await loadHistoricalSalesSheet();
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  return rows
    .filter((row) => canonicalCollectionSlug(row?.collectionSlug) === slug)
    .sort(compareEventsNewestFirst);
}

export async function getBtcUsdSpot() {
  const now = Date.now();
  if (Number.isFinite(btcSpotValue) && now - btcSpotFetchedAt < BTC_SPOT_TTL_MS) {
    return btcSpotValue;
  }
  if (btcSpotPromise) return btcSpotPromise;

  btcSpotPromise = (async () => {
    try {
      const res = await fetch(BTC_SPOT_URL, { cache: 'no-store' });
      if (!res.ok) return null;
      const payload = await res.json();
      const amount = Number(payload?.data?.amount);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      btcSpotValue = amount;
      btcSpotFetchedAt = Date.now();
      return btcSpotValue;
    } catch {
      return null;
    } finally {
      btcSpotPromise = null;
    }
  })();

  return btcSpotPromise;
}
