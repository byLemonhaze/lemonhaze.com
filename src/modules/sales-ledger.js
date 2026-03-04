const SALES_INDEX_URL = '/data/sales-master/by-inscription.json';
const BUNDLE_SALES_INDEX_URL = '/data/sales-master/original-bundle-sales.json';
const BTC_SPOT_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const BTC_SPOT_TTL_MS = 2 * 60 * 1000;

let salesIndexPromise = null;
let salesIndexCache = null;
let bundleSalesIndexPromise = null;
let bundleSalesIndexCache = null;

let btcSpotPromise = null;
let btcSpotValue = null;
let btcSpotFetchedAt = 0;

function normalizeInscriptionId(value) {
  return String(value || '').trim().toLowerCase();
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

async function loadSalesIndex() {
  if (salesIndexCache) return salesIndexCache;
  if (salesIndexPromise) return salesIndexPromise;

  salesIndexPromise = (async () => {
    try {
      const res = await fetch(SALES_INDEX_URL, { cache: 'no-store' });
      if (!res.ok) return { inscriptions: {} };
      const payload = await res.json();
      salesIndexCache = payload && typeof payload === 'object'
        ? payload
        : { inscriptions: {} };
      return salesIndexCache;
    } catch {
      salesIndexCache = { inscriptions: {} };
      return salesIndexCache;
    } finally {
      salesIndexPromise = null;
    }
  })();

  return salesIndexPromise;
}

async function loadBundleSalesIndex() {
  if (bundleSalesIndexCache) return bundleSalesIndexCache;
  if (bundleSalesIndexPromise) return bundleSalesIndexPromise;

  bundleSalesIndexPromise = (async () => {
    try {
      const res = await fetch(BUNDLE_SALES_INDEX_URL, { cache: 'no-store' });
      if (!res.ok) return { inscriptions: {} };
      const payload = await res.json();
      bundleSalesIndexCache = payload && typeof payload === 'object'
        ? payload
        : { inscriptions: {} };
      return bundleSalesIndexCache;
    } catch {
      bundleSalesIndexCache = { inscriptions: {} };
      return bundleSalesIndexCache;
    } finally {
      bundleSalesIndexPromise = null;
    }
  })();

  return bundleSalesIndexPromise;
}

export async function getSalesForInscription(inscriptionId) {
  const key = normalizeInscriptionId(inscriptionId);
  if (!key) return [];

  const payload = await loadSalesIndex();
  const events = Array.isArray(payload?.inscriptions?.[key])
    ? payload.inscriptions[key]
    : [];

  return [...events].sort((a, b) => {
    const ta = parseSalesTimestampMs(a?.timestamp);
    const tb = parseSalesTimestampMs(b?.timestamp);
    const aValid = Number.isFinite(ta);
    const bValid = Number.isFinite(tb);
    if (aValid && bValid) return tb - ta;
    if (aValid) return -1;
    if (bValid) return 1;
    return (Number(b?.priceBTC) || 0) - (Number(a?.priceBTC) || 0);
  });
}

export async function getBundleSalesForInscription(inscriptionId) {
  const key = normalizeInscriptionId(inscriptionId);
  if (!key) return [];

  const payload = await loadBundleSalesIndex();
  const events = Array.isArray(payload?.inscriptions?.[key])
    ? payload.inscriptions[key]
    : [];

  return [...events].sort((a, b) => {
    const ta = parseSalesTimestampMs(a?.timestamp);
    const tb = parseSalesTimestampMs(b?.timestamp);
    const aValid = Number.isFinite(ta);
    const bValid = Number.isFinite(tb);
    if (aValid && bValid) return tb - ta;
    if (aValid) return -1;
    if (bValid) return 1;
    return (Number(b?.priceBTC) || 0) - (Number(a?.priceBTC) || 0);
  });
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
