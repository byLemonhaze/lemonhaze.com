import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const COLLECTIONS_DIR = path.join(ROOT, 'data/sales-master/collections');
const OUTPUT_PATH = path.join(ROOT, 'public/data/sales-master/by-inscription.json');
const MANUFACTURED_SLUG = 'manufactured-by-lemonhaze';
const MANUFACTURED_PRIMARY_PRICE_MAX = 0.0042;
const MANUFACTURED_PRIMARY_WINDOW_START = Date.parse('2024-04-18T00:00:00.000Z');
const MANUFACTURED_PRIMARY_WINDOW_END = Date.parse('2024-04-20T23:59:59.999Z');

function clean(value) {
  return String(value || '').trim();
}

function round8(value) {
  return Number((value || 0).toFixed(8));
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saleDedupKey(sale) {
  return [
    clean(sale?.inscriptionId).toLowerCase(),
    clean(sale?.timestamp),
    round8(Number(sale?.priceBTC || 0)),
    clean(sale?.source),
  ].join('|');
}

function compareOldestFirst(a, b) {
  const ta = toTimestampMs(a?.timestamp);
  const tb = toTimestampMs(b?.timestamp);
  const aValid = Number.isFinite(ta);
  const bValid = Number.isFinite(tb);
  if (aValid && bValid && ta !== tb) return ta - tb;
  if (aValid) return -1;
  if (bValid) return 1;
  return (Number(a?.priceBTC) || 0) - (Number(b?.priceBTC) || 0);
}

function pickManufacturedCappedRows(rowsOldestFirst) {
  if (rowsOldestFirst.length <= 5) return rowsOldestFirst;

  const oldest = rowsOldestFirst[0];
  const mostRecent = rowsOldestFirst[rowsOldestFirst.length - 1];
  let highest = rowsOldestFirst[0];

  for (const row of rowsOldestFirst) {
    const price = Number(row?.priceBTC) || 0;
    const highestPrice = Number(highest?.priceBTC) || 0;
    if (price > highestPrice) {
      highest = row;
      continue;
    }
    if (price !== highestPrice) continue;

    const rowTs = toTimestampMs(row?.timestamp);
    const highestTs = toTimestampMs(highest?.timestamp);
    if (Number.isFinite(rowTs) && Number.isFinite(highestTs) && rowTs < highestTs) {
      highest = row;
    }
  }

  const keepKeys = new Set([
    saleDedupKey(oldest),
    saleDedupKey(highest),
    saleDedupKey(mostRecent),
  ]);
  return rowsOldestFirst.filter((row) => keepKeys.has(saleDedupKey(row)));
}

function normalizeManufacturedSalesForIndex(sales) {
  const byInscription = new Map();

  for (const sale of sales) {
    const inscriptionId = clean(sale?.inscriptionId).toLowerCase();
    const priceBTC = Number(sale?.priceBTC);
    if (!inscriptionId || !Number.isFinite(priceBTC)) continue;

    const copy = {
      ...sale,
      inscriptionId,
      priceBTC,
    };
    if (!byInscription.has(inscriptionId)) byInscription.set(inscriptionId, []);
    byInscription.get(inscriptionId).push(copy);
  }

  const normalized = [];

  for (const rows of byInscription.values()) {
    const deduped = [];
    const seen = new Set();
    for (const row of rows) {
      const key = saleDedupKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
    }

    deduped.sort(compareOldestFirst);
    if (!deduped.length) continue;

    const kept = pickManufacturedCappedRows(deduped);
    const oldest = deduped[0];
    const oldestPrice = Number(oldest?.priceBTC);
    const oldestTimestamp = toTimestampMs(oldest?.timestamp);
    const hasPrimary = Number.isFinite(oldestPrice)
      && oldestPrice > 0
      && oldestPrice <= MANUFACTURED_PRIMARY_PRICE_MAX + Number.EPSILON
      && Number.isFinite(oldestTimestamp)
      && oldestTimestamp >= MANUFACTURED_PRIMARY_WINDOW_START
      && oldestTimestamp <= MANUFACTURED_PRIMARY_WINDOW_END;
    const primaryKey = hasPrimary ? saleDedupKey(oldest) : null;

    for (const row of kept) {
      const key = saleDedupKey(row);
      normalized.push({
        ...row,
        saleType: primaryKey && key === primaryKey ? 'primary' : 'secondary',
      });
    }
  }

  return normalized;
}

function buildIndexFromCollections() {
  const files = fs
    .readdirSync(COLLECTIONS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  const inscriptions = {};
  let saleCount = 0;

  for (const file of files) {
    const collectionSlug = file.replace(/\.json$/, '');
    const payload = readJson(path.join(COLLECTIONS_DIR, file));
    const rawSales = Array.isArray(payload?.sales) ? payload.sales : [];
    const sales = collectionSlug === MANUFACTURED_SLUG
      ? normalizeManufacturedSalesForIndex(rawSales)
      : rawSales;

    for (const sale of sales) {
      const inscriptionId = clean(sale?.inscriptionId).toLowerCase();
      const priceBTC = Number(sale?.priceBTC);
      if (!inscriptionId || !Number.isFinite(priceBTC)) continue;

      const event = {
        timestamp: clean(sale?.timestamp) || null,
        priceBTC,
        collectionSlug,
        source: clean(sale?.source) || null,
        saleType: clean(sale?.saleType) || null,
      };
      const usdOriginal = Number(sale?.priceUSDOriginal);
      if (Number.isFinite(usdOriginal) && usdOriginal > 0) {
        event.priceUSDOriginal = usdOriginal;
      }

      if (!inscriptions[inscriptionId]) inscriptions[inscriptionId] = [];
      inscriptions[inscriptionId].push(event);
      saleCount += 1;
    }
  }

  for (const inscriptionId of Object.keys(inscriptions)) {
    inscriptions[inscriptionId].sort((a, b) => {
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

  return {
    generatedAt: new Date().toISOString(),
    source: 'sales-master-collections',
    collectionCount: files.length,
    saleCount,
    inscriptionCount: Object.keys(inscriptions).length,
    inscriptions,
  };
}

function main() {
  if (!fs.existsSync(COLLECTIONS_DIR)) {
    throw new Error(`Collections directory not found: ${COLLECTIONS_DIR}`);
  }

  const indexPayload = buildIndexFromCollections();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(indexPayload, null, 2), 'utf8');

  console.log(`Wrote sales index: ${OUTPUT_PATH}`);
  console.log(`Collections: ${indexPayload.collectionCount}`);
  console.log(`Sales: ${indexPayload.saleCount}`);
  console.log(`Inscriptions: ${indexPayload.inscriptionCount}`);
}

main();
