import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PROVENANCE_PATH = path.join(ROOT, 'public/data/provenance.json');
const SALES_INDEX_PATH = path.join(ROOT, 'public/data/sales-master/by-inscription.json');
const BUNDLE_INDEX_PATH = path.join(ROOT, 'data/sales-master/original-bundle-sales.json');
const OUTPUT_JSON_PATH = path.join(ROOT, 'public/data/sales-master/historical-sales-sheet.json');
const OUTPUT_CSV_PATH = path.join(ROOT, 'public/data/sales-master/historical-sales-sheet.csv');
const COLLECTION_NAME_OVERRIDES = {
  'deprivation-by-lemonhaze': 'Deprivation prints',
  'mirage-by-lemonhaze': 'Mirage prints',
  'prints-trilogy-by-lemonhaze': 'Trilogy prints',
  'minute-papillon-editions-by-lemonhaze': 'Minute, papillon! Edition',
};

function clean(value) {
  return String(value || '')
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .trim();
}

function round8(value) {
  return Number((value || 0).toFixed(8));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeInscriptionId(value) {
  return clean(value).toLowerCase();
}

function resolveCollectionName(collectionSlug, provenanceCollectionName) {
  return COLLECTION_NAME_OVERRIDES[clean(collectionSlug).toLowerCase()]
    || clean(provenanceCollectionName)
    || null;
}

function parseTimestampMs(value) {
  const raw = clean(value);
  if (!raw) return Number.NaN;

  const direct = Date.parse(raw);
  if (Number.isFinite(direct)) return direct;

  const normalized = raw.replace(' UTC', 'Z').replace(' ', 'T');
  const parsed = Date.parse(normalized);
  if (Number.isFinite(parsed)) return parsed;

  return Number.NaN;
}

function compareNewestFirst(a, b) {
  const ta = parseTimestampMs(a?.timestamp);
  const tb = parseTimestampMs(b?.timestamp);
  const aValid = Number.isFinite(ta);
  const bValid = Number.isFinite(tb);
  if (aValid && bValid && ta !== tb) return tb - ta;
  if (aValid) return -1;
  if (bValid) return 1;
  return (Number(b?.priceBTC) || 0) - (Number(a?.priceBTC) || 0);
}

function compareOldestFirst(a, b) {
  const ta = parseTimestampMs(a?.timestamp);
  const tb = parseTimestampMs(b?.timestamp);
  const aValid = Number.isFinite(ta);
  const bValid = Number.isFinite(tb);
  if (aValid && bValid && ta !== tb) return ta - tb;
  if (aValid) return -1;
  if (bValid) return 1;
  return (Number(a?.priceBTC) || 0) - (Number(b?.priceBTC) || 0);
}

function eventKey(event, entryType) {
  return [
    entryType,
    normalizeInscriptionId(event?.inscriptionId),
    clean(event?.timestamp),
    round8(Number(event?.priceBTC || 0)),
    clean(event?.source),
    clean(event?.bundleLabel),
    clean(event?.dateLabel),
  ].join('|');
}

function resolveSaleType(events) {
  const explicitPrimaryIndices = new Set(
    events
      .map((event, index) => ({ event, index }))
      .filter(({ event }) => clean(event?.saleType).toLowerCase() === 'primary')
      .map(({ index }) => index),
  );

  const explicitClassifiedCount = events.filter((event) => {
    const kind = clean(event?.saleType).toLowerCase();
    return kind === 'primary' || kind === 'secondary';
  }).length;

  let oldestIndex = -1;
  if (!explicitPrimaryIndices.size && !explicitClassifiedCount) {
    let oldestTimestamp = Number.POSITIVE_INFINITY;
    for (let index = 0; index < events.length; index += 1) {
      const timestampMs = parseTimestampMs(events[index]?.timestamp);
      const rank = Number.isFinite(timestampMs) ? timestampMs : Number.POSITIVE_INFINITY;
      if (rank < oldestTimestamp) {
        oldestTimestamp = rank;
        oldestIndex = index;
      }
    }
    if (oldestIndex < 0) oldestIndex = events.length - 1;
  }

  return events.map((event, index) => {
    const normalizedSaleType = explicitPrimaryIndices.size
      ? (explicitPrimaryIndices.has(index) ? 'primary' : 'secondary')
      : (!explicitClassifiedCount && index === oldestIndex ? 'primary' : 'secondary');

    const originalSaleType = clean(event?.saleType).toLowerCase();
    return {
      ...event,
      saleType: normalizedSaleType,
      ...(originalSaleType && originalSaleType !== normalizedSaleType
        ? { originalSaleType }
        : {}),
    };
  });
}

function buildProvenanceMaps(provenance) {
  const byId = new Map();
  for (const row of provenance) {
    const inscriptionId = normalizeInscriptionId(row?.id);
    if (!inscriptionId || byId.has(inscriptionId)) continue;
    byId.set(inscriptionId, {
      artworkName: clean(row?.name) || null,
      collectionName: clean(row?.collection) || null,
    });
  }
  return { byId };
}

function buildInscriptionRows({ salesIndex, provenanceById }) {
  const inscriptions = salesIndex?.inscriptions && typeof salesIndex.inscriptions === 'object'
    ? salesIndex.inscriptions
    : {};

  const rows = [];
  for (const [inscriptionIdRaw, eventsRaw] of Object.entries(inscriptions)) {
    const inscriptionId = normalizeInscriptionId(inscriptionIdRaw);
    const events = Array.isArray(eventsRaw)
      ? [...eventsRaw].sort(compareNewestFirst)
      : [];
    if (!inscriptionId || !events.length) continue;

    const normalizedEvents = resolveSaleType(events);
    const provenanceMeta = provenanceById.get(inscriptionId) || {};

    for (const event of normalizedEvents) {
      const row = {
        entryType: 'inscription-sale',
        inscriptionId,
        collectionSlug: clean(event?.collectionSlug) || null,
        collectionName: resolveCollectionName(event?.collectionSlug, provenanceMeta.collectionName),
        artworkName: provenanceMeta.artworkName || null,
        timestamp: clean(event?.timestamp) || null,
        saleType: clean(event?.saleType) || 'secondary',
        priceBTC: round8(Number(event?.priceBTC || 0)),
        source: clean(event?.source) || null,
      };

      if (event?.originalSaleType) row.originalSaleType = clean(event.originalSaleType);
      if (Number.isFinite(Number(event?.priceUSDOriginal))) {
        row.priceUSDOriginal = Number(event.priceUSDOriginal);
      }

      rows.push(row);
    }
  }

  return rows;
}

function buildBundleRows({ bundleIndex, provenanceById }) {
  const inscriptions = bundleIndex?.inscriptions && typeof bundleIndex.inscriptions === 'object'
    ? bundleIndex.inscriptions
    : {};

  const rows = [];
  for (const [inscriptionIdRaw, eventsRaw] of Object.entries(inscriptions)) {
    const inscriptionId = normalizeInscriptionId(inscriptionIdRaw);
    const events = Array.isArray(eventsRaw)
      ? [...eventsRaw].sort(compareNewestFirst)
      : [];
    if (!inscriptionId || !events.length) continue;

    const provenanceMeta = provenanceById.get(inscriptionId) || {};
    for (const event of events) {
      const row = {
        entryType: 'bundle-sale',
        inscriptionId,
        collectionSlug: clean(event?.collectionSlug) || null,
        collectionName: resolveCollectionName(event?.collectionSlug, provenanceMeta.collectionName),
        artworkName: provenanceMeta.artworkName || null,
        timestamp: clean(event?.timestamp) || null,
        saleType: clean(event?.saleType).toLowerCase() === 'primary' ? 'primary' : 'secondary',
        priceBTC: round8(Number(event?.priceBTC || 0)),
        source: clean(event?.source) || null,
      };

      const originalSaleType = clean(event?.saleType).toLowerCase();
      if (originalSaleType && originalSaleType !== row.saleType) {
        row.originalSaleType = originalSaleType;
      }

      if (event?.dateLabel) row.dateLabel = clean(event.dateLabel);
      if (event?.bundleType) row.bundleType = clean(event.bundleType);
      if (event?.bundleLabel) row.bundleLabel = clean(event.bundleLabel);
      if (Number.isFinite(Number(event?.bundleCount))) row.bundleCount = Number(event.bundleCount);
      if (Number.isFinite(Number(event?.unitPriceBTC))) row.unitPriceBTC = round8(Number(event.unitPriceBTC));
      if (Number.isFinite(Number(event?.aggregateSalesCount))) row.aggregateSalesCount = Number(event.aggregateSalesCount);

      rows.push(row);
    }
  }

  return rows;
}

function dedupeRows(rows) {
  const deduped = [];
  const seen = new Set();
  for (const row of rows) {
    const key = eventKey(row, row.entryType);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped;
}

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  if (!/[,"\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(rows) {
  const columns = [
    'entryType',
    'inscriptionId',
    'collectionSlug',
    'collectionName',
    'artworkName',
    'timestamp',
    'saleType',
    'priceBTC',
    'priceUSDOriginal',
    'source',
    'originalSaleType',
    'dateLabel',
    'bundleType',
    'bundleLabel',
    'bundleCount',
    'unitPriceBTC',
    'aggregateSalesCount',
  ];

  const lines = [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row?.[column])).join(',')),
  ];

  return `${lines.join('\n')}\n`;
}

function main() {
  const provenance = readJson(PROVENANCE_PATH);
  const salesIndex = readJson(SALES_INDEX_PATH);
  const bundleIndex = readJson(BUNDLE_INDEX_PATH);
  const { byId: provenanceById } = buildProvenanceMaps(provenance);

  const rows = dedupeRows([
    ...buildInscriptionRows({ salesIndex, provenanceById }),
    ...buildBundleRows({ bundleIndex, provenanceById }),
  ]).sort(compareOldestFirst);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'historical-sales-sheet',
    rowCount: rows.length,
    rows,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(OUTPUT_CSV_PATH, buildCsv(rows), 'utf8');

  console.log(`Wrote historical sales sheet JSON: ${OUTPUT_JSON_PATH}`);
  console.log(`Wrote historical sales sheet CSV: ${OUTPUT_CSV_PATH}`);
  console.log(`Rows: ${payload.rowCount}`);
}

main();
