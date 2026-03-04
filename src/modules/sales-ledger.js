const SALES_INDEX_URL = '/data/sales-master/by-inscription.json';
const BTC_SPOT_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const BTC_SPOT_TTL_MS = 2 * 60 * 1000;

let salesIndexPromise = null;
let salesIndexCache = null;

let btcSpotPromise = null;
let btcSpotValue = null;
let btcSpotFetchedAt = 0;

function normalizeInscriptionId(value) {
  return String(value || '').trim().toLowerCase();
}

function clean(value) {
  return String(value || '').trim();
}

function toTimestampMs(value) {
  const raw = clean(value);
  if (!raw) return Number.NaN;

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

export async function getSalesForInscription(inscriptionId) {
  const key = normalizeInscriptionId(inscriptionId);
  if (!key) return [];

  const payload = await loadSalesIndex();
  const events = Array.isArray(payload?.inscriptions?.[key])
    ? payload.inscriptions[key]
    : [];

  return [...events].sort((a, b) => {
    const ta = toTimestampMs(a?.timestamp);
    const tb = toTimestampMs(b?.timestamp);
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
