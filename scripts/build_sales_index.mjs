import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const COLLECTIONS_DIR = path.join(ROOT, 'data/sales-master/collections');
const OUTPUT_PATH = path.join(ROOT, 'public/data/sales-master/by-inscription.json');

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
    const sales = Array.isArray(payload?.sales) ? payload.sales : [];

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
