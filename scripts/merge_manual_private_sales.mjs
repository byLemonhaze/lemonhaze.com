import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROVENANCE_PATH = path.join(ROOT, 'public/data/provenance.json');
const COLLECTIONS_DIR = path.join(ROOT, 'data/sales-master/collections');
const MASTER_PATH = path.join(ROOT, 'data/sales-master/master-of-sales.json');

function clean(value) {
  return String(value || '').trim();
}

function round8(value) {
  return Number((value || 0).toFixed(8));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function extractTrailingNumber(name) {
  const normalized = clean(name).replace(/\u00ba|\u00b0|\u2116/g, ' ');
  const match = normalized.match(/(?:#|n[o0]?|number)?\s*([0-9]{1,4})\s*$/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function toManualEvent({
  timestamp,
  inscriptionId,
  priceBTC,
  note,
  name,
}) {
  return {
    timestamp: clean(timestamp) || null,
    inscriptionId: clean(inscriptionId) || null,
    priceBTC: round8(priceBTC),
    raw: note ? `${name} | ${note}` : `${name} | Manual OTC/private sale`,
    hrefs: [],
    source: 'manual-private',
    saleType: 'otc-primary',
  };
}

function buildManualEvents(provenance) {
  const eventsBySlug = new Map();
  const push = (slug, event) => {
    if (!eventsBySlug.has(slug)) eventsBySlug.set(slug, []);
    eventsBySlug.get(slug).push(event);
  };

  // Unregulated Minds: #2,#3,#4,#5,#6 sold 0.033 BTC on 2024-10-31
  const unregulated = provenance.filter((row) => row.collection === 'Unregulated Minds');
  for (const row of unregulated) {
    const n = extractTrailingNumber(row.name);
    if (![2, 3, 4, 5, 6].includes(n)) continue;
    push(
      'unregulated-minds-by-lemonhaze',
      toManualEvent({
        timestamp: '2024-10-31 00:00:00 UTC',
        inscriptionId: row.id,
        priceBTC: 0.033,
        name: row.name,
        note: 'Manual OTC primary sale',
      })
    );
  }

  // La Tentation: all except #0,#1,#8,#13 sold for 0.0169 BTC, date = inscription timestamp
  const tentation = provenance.filter((row) => row.collection === 'La Tentation');
  for (const row of tentation) {
    const n = extractTrailingNumber(row.name);
    if (n == null) continue;
    if ([0, 1, 8, 13].includes(n)) continue;
    push(
      'tentation-by-lemonhaze',
      toManualEvent({
        timestamp: row.timestamp,
        inscriptionId: row.id,
        priceBTC: 0.0169,
        name: row.name,
        note: 'Manual OTC primary sale (date aligned to inscription timestamp)',
      })
    );
  }

  // Little Get Away: 0808, 0632, 1916 sold 0.033 BTC each
  const littleGetAway = provenance.filter((row) => row.collection === 'Little Get Away');
  for (const row of littleGetAway) {
    if (!['0808', '0632', '1916'].includes(clean(row.name))) continue;
    push(
      'little-get-away-by-lemonhaze',
      toManualEvent({
        timestamp: row.timestamp,
        inscriptionId: row.id,
        priceBTC: 0.033,
        name: row.name,
        note: 'Manual OTC/private sale',
      })
    );
  }

  // 1 of 1s (2025): Chanchanok's Temple sold 0.069 BTC on 2025-07-29
  const oneOfOnes2025 = provenance.filter((row) => clean(row.collection).toLowerCase().includes('2025'));
  for (const row of oneOfOnes2025) {
    if (clean(row.name) !== "Chanchanok's Temple") continue;
    push(
      '1on1-2025-by-lemonhaze',
      toManualEvent({
        timestamp: '2025-07-29 00:00:00 UTC',
        inscriptionId: row.id,
        priceBTC: 0.069,
        name: row.name,
        note: 'Manual OTC/private sale',
      })
    );
  }

  // Portrait 2490: all originally sold for 0.001 BTC at inscription timestamp
  const portrait = provenance.filter((row) => row.collection === 'Portrait 2490');
  for (const row of portrait) {
    push(
      'portrait-2490',
      toManualEvent({
        timestamp: row.timestamp,
        inscriptionId: row.id,
        priceBTC: 0.001,
        name: row.name,
        note: 'Manual primary sale (date aligned to inscription timestamp)',
      })
    );
  }

  // Ma ville en quatre temps: Gamma release primary sales on 2025-05-15
  const maVille = provenance.filter((row) => row.collection === 'Ma ville en quatre temps');
  const maVillePricesByInscription = new Map([
    ['8d3ac38068f242faeccadba00ec1525e22c2340dbcdb6ce1fe034b55d6610602i0', 0.02402382], // L’Automne s’envole
    ['d92dce003739ca8a96583195a4c513d159e928d6039878a9520685fa5ad44fadi0', 0.02785158], // Retour en classe
    ['298a55a78a48faafe5ac119cb48dd2235dc9c37210e30c793f39c280b2618f32i0', 0.05081814], // L'Hiver, la nuit
    ['14bc4ad6dde2cb2440b5edb59ae56fc75b6b4783776af54b0e04f53a6629427ci0', 0.069], // Un Été à Montréal
  ]);
  for (const row of maVille) {
    const manualPrice = maVillePricesByInscription.get(row.id);
    if (manualPrice == null) continue;
    push(
      'ma-ville-en-quatre-temps-by-lemonhaze',
      toManualEvent({
        timestamp: '2025-05-15 00:00:00 UTC',
        inscriptionId: row.id,
        priceBTC: manualPrice,
        name: row.name,
        note: 'Manual primary sale from Gamma release',
      })
    );
  }

  return eventsBySlug;
}

function saleDedupKey(sale) {
  return [
    clean(sale.inscriptionId),
    clean(sale.timestamp),
    round8(Number(sale.priceBTC || 0)),
    clean(sale.source || 'scraped'),
  ].join('|');
}

function mergeEventsIntoCollection(record, manualEvents) {
  const merged = Array.isArray(record.sales) ? [...record.sales] : [];
  const existing = new Set(merged.map(saleDedupKey));

  let added = 0;
  for (const event of manualEvents) {
    const key = saleDedupKey(event);
    if (existing.has(key)) continue;
    existing.add(key);
    merged.push(event);
    added += 1;
  }

  record.sales = merged;
  record.totalSales = merged.length;
  record.totalVolumeBTC = round8(merged.reduce((sum, row) => sum + Number(row.priceBTC || 0), 0));
  record.manualSalesAdded = (record.manualSalesAdded || 0) + added;
  return added;
}

function rebuildMasterFromCollections() {
  const files = fs
    .readdirSync(COLLECTIONS_DIR)
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  const collections = {};
  let totalSales = 0;
  let totalVolumeBTC = 0;

  for (const file of files) {
    const slug = file.replace(/\.json$/, '');
    const payload = readJson(path.join(COLLECTIONS_DIR, file));
    collections[slug] = {
      collectionUrl: payload.collectionUrl,
      totalSales: payload.totalSales || 0,
      totalVolumeBTC: payload.totalVolumeBTC || 0,
      sales: payload.sales || [],
    };
    totalSales += payload.totalSales || 0;
    totalVolumeBTC += Number(payload.totalVolumeBTC || 0);
  }

  const master = {
    scrapedAt: new Date().toISOString(),
    source: 'bestinslot-playwright+manual-private',
    collectionCount: files.length,
    totalSales,
    totalVolumeBTC: round8(totalVolumeBTC),
    collections,
  };

  writeJson(MASTER_PATH, master);
}

function main() {
  if (!fs.existsSync(PROVENANCE_PATH)) {
    throw new Error(`Provenance file not found: ${PROVENANCE_PATH}`);
  }
  if (!fs.existsSync(COLLECTIONS_DIR)) {
    throw new Error(`Collections dir not found: ${COLLECTIONS_DIR}`);
  }

  const provenance = readJson(PROVENANCE_PATH);
  const eventsBySlug = buildManualEvents(provenance);
  let totalAdded = 0;

  for (const [slug, events] of eventsBySlug.entries()) {
    const filePath = path.join(COLLECTIONS_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${slug}: no collection file found.`);
      continue;
    }

    const payload = readJson(filePath);
    const added = mergeEventsIntoCollection(payload, events);
    totalAdded += added;
    writeJson(filePath, payload);
    console.log(`${slug}: added ${added} manual sales (total=${payload.totalSales}, volume=${payload.totalVolumeBTC} BTC)`);
  }

  rebuildMasterFromCollections();
  console.log(`Done. Added ${totalAdded} manual sales and rebuilt master file.`);
}

main();
