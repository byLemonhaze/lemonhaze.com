import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const SHEET_PATH = path.join(ROOT, 'public/data/sales-master/historical-sales-sheet.json');
const CSV_PATH = path.join(ROOT, 'public/data/sales-master/historical-sales-sheet.csv');

const COLLECTIONS = [
  ['Gentlemen', 'gentlemen-by-lemonhaze'],
  ['1 of 1s (2024)', '1on1-by-lemonhaze'],
  ['Portrait 2490', 'portrait-2490-by-lemonhaze'],
  ['Manufactured', 'manufactured-by-lemonhaze'],
  ['DeVille', 'deville-by-lemonhaze'],
  ['BEST BEFORE', 'best-before-by-lemonhaze-x-ordinally'],
  ['Minute, papillon! Edition', 'minute-papillon-editions-by-lemonhaze'],
  ['1 of 1s (2025)', '1on1-2025-by-lemonhaze'],
  ['1 of 1s (2026)', '1-of-1s-2026-by-lemonhaze'],
  ['Bento Box', 'bento-box-by-lemonhaze'],
  ['Berlin', 'berlin-by-lemonhaze'],
  ['Candidly Yours', 'candidly-yours-by-lemonhaze'],
  ['Cypherville', 'cypherville-by-lemonhaze'],
  ['Dark Days', 'dark-days-by-lemonhaze'],
  ['Deprivation (Prints)', 'deprivation-prints-by-lemonhaze'],
  ['Discography', 'discography-by-lemonhaze'],
  ['Downtown', 'downtown-by-lemonhaze'],
  ['Fading', 'fading-by-lemonhaze'],
  ['Framed', 'framed-by-lemonhaze'],
  ['Games', 'games-by-lemonhaze'],
  ['Generative Composition', 'generative-composition-by-lemonhaze'],
  ['Into The Wild', 'into-the-wild-by-lemonhaze'],
  ['Jardin Secret', 'jardin-secret-by-lemonhaze'],
  ["L'Orphelinat", 'orphelinat-by-lemonhaze'],
  ['La Tentation', 'tentation-by-lemonhaze'],
  ['Le Bar à Tapas', 'bar-tapas-by-lemonhaze'],
  ['Griffintown', 'griffintown-by-lemonhaze'],
  ['Liminality', 'liminality-by-lemonhaze'],
  ['Little Get Away', 'little-get-away-by-lemonhaze'],
  ['Lotus', 'lotus-by-lemonhaze'],
  ['Ma ville en quatre temps', 'ma-ville-en-quatre-temps-by-lemonhaze'],
  ['Mending Fragments', 'mending-fragments-by-lemonhaze'],
  ['Mirage (Prints)', 'mirage-prints-by-lemonhaze'],
  ['Miscellaneous', 'miscellaneous-by-lemonhaze'],
  ['Montreal', 'montreal-by-lemonhaze'],
  ['Oaxaca', 'oaxaca-by-lemonhaze'],
  ['Old-Fashioned', 'old-fashioned-by-lemonhaze'],
  ['Ordinals Summer', 'ordinals-summer-by-lemonhaze'],
  ['Polaroid', 'polaroid-by-lemonhaze'],
  ['Satoshi (Original & Editions)', 'satoshi-by-lemonhaze'],
  ['Tad Small', 'tad-small-by-lemonhaze'],
  ['The Artifacts', 'artifacts-by-lemonhaze'],
  ['Tori no Roji', 'tori_no_roji_by_lemonhaze'],
  ['Trilogy (Prints)', 'trilogy-prints-by-lemonhaze'],
  ['Unregulated Minds', 'unregulated-minds-by-lemonhaze'],
  ['Untitled', 'untitled-by-lemonhaze'],
  ['Volatility', 'volatility-by-lemonhaze'],
  ['World Tour', 'world-tour-by-lemonhaze'],
];

const SAME_SALE_TOLERANCE_MS = 36 * 60 * 60 * 1000;
const PRIMARY_TOLERANCE_MS = 7 * 24 * 60 * 60 * 1000;
const ECLOSION_PRIMARY = {
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
};
const MANUFACTURED_SLUG = 'manufactured-by-lemonhaze';

function clean(value) {
  return String(value || '').trim();
}

function normalized(value) {
  return clean(value).toLowerCase();
}

function timeMs(value) {
  if (typeof value === 'number') return value > 1e12 ? value : value * 1000;
  const parsed = Date.parse(clean(value).replace(' UTC', 'Z').replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isoTimestamp(value) {
  const ms = timeMs(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function pricesAreClose(left, right) {
  const a = Number(left);
  const b = Number(right);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= 0.0001 || Math.abs(a - b) <= Math.max(a, b) * 0.12;
}

function normalizeManufacturedHistory(row) {
  if (row.collectionSlug !== MANUFACTURED_SLUG || row.source !== 'bestinslot-v2api') return row;
  return {
    ...row,
    // Retain the item-level historical ledger. The raw source label is deliberately
    // normalised here: public presentation never exposes providers or settlement
    // metadata, while the detailed sale records remain available for reconciliation.
    source: row.saleType === 'primary' ? 'documented-release-primary' : 'historical-sales-archive',
    priceBasis: row.saleType === 'primary' ? 'gross' : 'marketplace-indexed',
  };
}

function loadManufacturedHistoryFromHead() {
  try {
    const previous = JSON.parse(execFileSync(
      'git',
      ['show', 'HEAD:public/data/sales-master/historical-sales-sheet.json'],
      { cwd: ROOT, encoding: 'utf8' },
    ));
    return (Array.isArray(previous.rows) ? previous.rows : [])
      .filter((row) => row.collectionSlug === MANUFACTURED_SLUG && row.source === 'bestinslot-v2api')
      .map(normalizeManufacturedHistory);
  } catch {
    return [];
  }
}

function isKnownTrade(activity, rows, collectionSlug) {
  const txid = normalized(activity.txid);
  const inscriptionId = normalized(activity.inscriptionId);
  const activityTime = timeMs(activity.time);
  const candidates = rows.filter((row) => normalized(row.inscriptionId) === inscriptionId);

  if (txid && rows.some((row) => (
    normalized(row.transactionId) === txid
    && normalized(row.inscriptionId) === inscriptionId
  ))) return true;

  for (const row of candidates) {
    const rowTime = timeMs(row.timestamp);
    const priceMatch = pricesAreClose(row.priceBTC, activity.price);
    if (Number.isFinite(rowTime) && Number.isFinite(activityTime)) {
      const delta = Math.abs(rowTime - activityTime);
      if (priceMatch && delta <= SAME_SALE_TOLERANCE_MS) return true;
      if (row.saleType === 'primary' && priceMatch && delta <= PRIMARY_TOLERANCE_MS) return true;
    }

    // Older Polaroid rows retain a relative date from the original import; match their
    // documented amount rather than adding the same Ord.net trade again.
    if (!Number.isFinite(rowTime) && priceMatch) return true;

    // Fading's launch records were manually dated in June, while Ord.net indexes the
    // matching July settlement transactions. They remain documented primaries.
    if (collectionSlug === 'fading-by-lemonhaze'
      && row.originalSaleType === 'otc-primary'
      && priceMatch
      && Number(activity.price) < 0.005) return true;
  }

  return false;
}

function sourceWithOrdnet(source) {
  const existing = clean(source);
  return existing && !existing.includes('ord.net') ? `${existing}+ord.net` : (existing || 'ord.net-public-insights');
}

function buildSecondaryRow({ collection, activity }) {
  return {
    entryType: 'inscription-sale',
    inscriptionId: activity.inscriptionId,
    collectionSlug: collection.slug,
    collectionName: collection.name,
    artworkName: activity.item?.name || `Inscription #${activity.inscriptionNumber || ''}`.trim(),
    timestamp: isoTimestamp(activity.time),
    saleType: 'secondary',
    priceBTC: Number(activity.price),
    source: 'ord.net-public-insights',
    transactionId: activity.txid,
    marketplace: 'ord.net',
    // The public feed is an indexer-reported marketplace amount. It is not labelled
    // gross unless another marketplace source independently supplies that value.
    priceBasis: 'marketplace-indexed',
    from: activity.from || null,
    to: activity.to || null,
    priceUSDAtSale: Number.isFinite(Number(activity.priceUsd)) ? Number(activity.priceUsd) : null,
  };
}

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function buildCsv(rows) {
  const columns = [
    'entryType', 'inscriptionId', 'collectionSlug', 'collectionName', 'artworkName',
    'timestamp', 'saleType', 'priceBTC', 'priceUSDOriginal', 'source', 'originalSaleType',
    'dateLabel', 'bundleType', 'bundleLabel', 'bundleCount', 'unitPriceBTC',
    'aggregateSalesCount',
  ];
  return `${[columns.join(','), ...rows.map((row) => (
    columns.map((column) => escapeCsv(row?.[column])).join(',')
  ))].join('\n')}\n`;
}

async function fetchCollection([name, slug]) {
  const [pageResponse, insightsResponse] = await Promise.all([
    fetch(`https://ord.net/collection/${slug}`),
    fetch(`https://ord.net/api/collections/${slug}/insights?activityFilter=sale`),
  ]);
  if (!pageResponse.ok || !insightsResponse.ok) {
    throw new Error(`${slug}: Ord.net returned ${pageResponse.status}/${insightsResponse.status}`);
  }
  const [page, insights] = await Promise.all([pageResponse.text(), insightsResponse.json()]);
  const volumeMatch = page.match(/totalVolumeAllTimeBtc:((?:[0-9]+(?:\.[0-9]+)?)|(?:\.[0-9]+))/);
  if (!volumeMatch) throw new Error(`${slug}: total volume missing from collection page`);
  return {
    name,
    slug,
    volumeBTC: Number(volumeMatch[1]),
    sourceUrl: `https://ord.net/collection/${slug}`,
    recentSales: Array.isArray(insights.activities)
      ? insights.activities.filter((activity) => activity?.type === 'sale')
      : [],
  };
}

async function loadAudit() {
  const fromIndex = process.argv.indexOf('--from');
  if (fromIndex >= 0) {
    const auditPath = process.argv[fromIndex + 1];
    if (!auditPath) throw new Error('Expected a JSON path after --from');
    const audit = JSON.parse(fs.readFileSync(path.resolve(auditPath), 'utf8'));
    return {
      generatedAt: audit.generatedAt || new Date().toISOString(),
      collections: (audit.collections || []).map((collection) => ({
        name: collection.name,
        slug: collection.slug,
        volumeBTC: Number(collection.totalVolumeBtc),
        sourceUrl: collection.url || `https://ord.net/collection/${collection.slug}`,
        recentSales: collection.recentSales || [],
      })),
    };
  }

  const collections = [];
  for (let index = 0; index < COLLECTIONS.length; index += 6) {
    collections.push(...await Promise.all(COLLECTIONS.slice(index, index + 6).map(fetchCollection)));
  }
  return { generatedAt: new Date().toISOString(), collections };
}

const audit = await loadAudit();
const sheet = JSON.parse(fs.readFileSync(SHEET_PATH, 'utf8'));
// Generated Ord.net rows are rebuilt on each refresh. Everything else is a
// documented ledger entry and remains untouched.
const rows = (Array.isArray(sheet.rows) ? sheet.rows : [])
  .filter((row) => (
    row.source !== 'ord.net-public-insights'
    && !(row.collectionSlug === MANUFACTURED_SLUG && row.source === 'documented-release-total')
  ))
  .map(normalizeManufacturedHistory);
const documentedRows = [...rows];
const additions = [];

if (!rows.some((row) => normalized(row.inscriptionId) === ECLOSION_PRIMARY.inscriptionId)) {
  rows.push(ECLOSION_PRIMARY);
}
if (!rows.some((row) => row.collectionSlug === MANUFACTURED_SLUG
  && (row.source === 'documented-release-primary' || row.source === 'historical-sales-archive'))) {
  const restoredManufacturedRows = loadManufacturedHistoryFromHead();
  rows.push(...restoredManufacturedRows);
  documentedRows.push(...restoredManufacturedRows);
}

for (const collection of audit.collections) {
  for (const activity of collection.recentSales) {
    if (!activity.inscriptionId || !Number.isFinite(Number(activity.price))) continue;
    if (isKnownTrade(activity, documentedRows, collection.slug)) continue;
    const row = buildSecondaryRow({ collection, activity });
    rows.push(row);
    additions.push(row);
  }
}

const dedupedCoverage = audit.collections
  .map(({ name, slug, volumeBTC, sourceUrl }) => ({
    collectionName: name,
    collectionSlug: slug,
    volumeBTC: Number(volumeBTC),
    source: 'ord.net-public-collection-page',
    sourceUrl,
    asOf: audit.generatedAt,
    priceBasis: 'marketplace-indexed',
  }))
  .sort((a, b) => a.collectionSlug.localeCompare(b.collectionSlug));

sheet.generatedAt = new Date().toISOString();
sheet.source = 'historical-sales-sheet+ord.net-reconciliation';
sheet.rowCount = rows.length;
sheet.rows = rows;
sheet.marketplaceCoverage = dedupedCoverage;

fs.writeFileSync(SHEET_PATH, `${JSON.stringify(sheet, null, 2)}\n`, 'utf8');
fs.writeFileSync(CSV_PATH, buildCsv(rows), 'utf8');

console.log(JSON.stringify({
  generatedAt: sheet.generatedAt,
  coverageAsOf: audit.generatedAt,
  collections: dedupedCoverage.length,
  addedSecondaryRows: additions.length,
  addedSecondaryBtc: Number(additions.reduce((sum, row) => sum + row.priceBTC, 0).toFixed(8)),
  rowCount: rows.length,
}, null, 2));
