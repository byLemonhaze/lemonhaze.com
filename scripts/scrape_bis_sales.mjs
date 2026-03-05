import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), 'data/sales-master');
const COLLECTIONS_DIR = 'collections';
const MASTER_FILE = 'master-of-sales.json';

const DEFAULT_COLLECTION_URLS = [
  'https://bestinslot.xyz/ordinals/collections/manufactured-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/best-before-by-lemonhaze-x-ordinally',
  'https://bestinslot.xyz/ordinals/collections/minute-papillon-editions-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/lotus-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/dark-days-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/deville-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/gentlemen-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/orphelinat-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/volatility-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/downtown-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/old-fashioned-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/prints-trilogy-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/cypherville',
  'https://bestinslot.xyz/ordinals/collections/oaxaca-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/framed',
  'https://bestinslot.xyz/ordinals/collections/polaroid-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/artifacts-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/untitled-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/portrait-2490',
  'https://bestinslot.xyz/ordinals/collections/deprivation-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/candidly-yours-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/ordinals-summer-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/mending-fragments-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/unregulated-minds-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/discography-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/fading-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/montreal-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/jardin-secret-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/bento-box-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/mirage-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/tentation-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/miscelleneous-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/berlin-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/provenance-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/little-get-away-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/cypherville-split-collectibles-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/world-tour-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/generative-composition-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/bar-tapas-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/tad-small-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/games-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/1on1-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/cypherville-comics-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/tori_no_roji_by_lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/1on1-2025-by-lemonhaze',
  'https://bestinslot.xyz/ordinals/collections/ma-ville-en-quatre-temps-by-lemonhaze',
];

const MIN_ROW_TEXT_LEN = 20;
const MAX_SCROLL_PASSES = 140;
const STABLE_PASSES_TO_STOP = 8;
const SCROLL_DELAY_MS = 900;
const BOOT_DELAY_MS = 1500;

const RELATIVE_TIME_REGEX = /\b(?:\d+\s*(?:sec|secs|second|seconds|min|mins|minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s*ago|\d+\s*[smhdw]|[smhdw]\b)\b/i;
const ISO_TIME_REGEX = /\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}(?:[tT\s]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z| ?UTC)?)?\b/;
const LONG_DATE_REGEX = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},\s*20\d{2}(?:,\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?\b/i;
const DMY_DATE_REGEX = /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+20\d{2}(?:,\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?\b/i;
const INSCRIPTION_ID_REGEX = /\b([a-f0-9]{64}i\d+)\b/i;
const HASH64_REGEX = /\b([a-f0-9]{64})\b/i;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(input) {
  return String(input || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArgs(argv) {
  const args = {
    headless: true,
    limit: null,
    slug: null,
    outDir: DEFAULT_OUTPUT_DIR,
  };

  for (const rawArg of argv.slice(2)) {
    if (rawArg === '--headed') args.headless = false;
    if (rawArg === '--headless') args.headless = true;
    if (rawArg.startsWith('--limit=')) {
      const value = Number(rawArg.split('=')[1]);
      if (Number.isFinite(value) && value > 0) args.limit = Math.floor(value);
    }
    if (rawArg.startsWith('--slug=')) {
      const value = rawArg.split('=')[1];
      if (value) args.slug = value.trim().toLowerCase();
    }
    if (rawArg.startsWith('--out=')) {
      const value = rawArg.split('=')[1];
      if (value) args.outDir = path.resolve(process.cwd(), value);
    }
  }

  return args;
}

function slugFromUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || parsed.hostname;
  } catch {
    return cleanText(url).replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
  }
}

function parseBTC(text) {
  const normalized = cleanText(text).replace(/,/g, '');
  const btcMatches = [
    normalized.match(/\b([0-9]+(?:\.[0-9]+)?)\s*btc\b/i),
    normalized.match(/\u20bf\s*([0-9]+(?:\.[0-9]+)?)/i),
  ];
  for (const match of btcMatches) {
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value)) return value;
  }

  // For BiS activity rows where BTC unit is omitted, use decimal tokens only.
  const decimalMatches = [...normalized.matchAll(/\b([0-9]+\.[0-9]+)\b/g)];
  if (decimalMatches.length) {
    const first = Number(decimalMatches[0][1]);
    if (Number.isFinite(first)) return first;
  }

  return null;
}

function parsePriceCellToBTC(priceCellText) {
  const normalized = cleanText(priceCellText).replace(/,/g, '');
  if (!normalized) return null;
  const tokenMatch = normalized.match(/^([0-9]+(?:\.[0-9]+)?)([kmb])?/i);
  if (!tokenMatch) return null;

  const value = Number(tokenMatch[1]);
  if (!Number.isFinite(value)) return null;

  const suffix = (tokenMatch[2] || '').toLowerCase();
  if (suffix) {
    const satMultipliers = { k: 1e3, m: 1e6, b: 1e9 };
    const sats = value * (satMultipliers[suffix] || 1);
    return sats / 1e8;
  }

  // If no suffix, BiS usually shows BTC directly (ex: 0.27543).
  return value;
}

function extractTimestampRaw(text, cellTexts = [], timestampHints = []) {
  const candidates = [
    ...timestampHints.map(cleanText),
    cleanText(text),
    ...cellTexts.map(cleanText),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const m1 = candidate.match(ISO_TIME_REGEX);
    if (m1) return m1[0];
    const m2 = candidate.match(LONG_DATE_REGEX);
    if (m2) return m2[0];
    const m3 = candidate.match(DMY_DATE_REGEX);
    if (m3) return m3[0];
    const epoch = candidate.match(/\b(1[6-9]\d{8,12})\b/);
    if (epoch) {
      const raw = Number(epoch[1]);
      if (Number.isFinite(raw)) {
        const ms = epoch[1].length >= 13 ? raw : raw * 1000;
        const asIso = new Date(ms).toISOString();
        if (asIso && asIso !== 'Invalid Date') return asIso;
      }
    }
    if (/\b20\d{2}\b/.test(candidate)) {
      const parsed = Date.parse(candidate);
      if (Number.isFinite(parsed)) {
        const asIso = new Date(parsed).toISOString();
        if (asIso && asIso !== 'Invalid Date') return asIso;
      }
    }
  }
  for (const candidate of candidates) {
    if (!candidate) continue;
    const m4 = candidate.match(RELATIVE_TIME_REGEX);
    if (m4) return m4[0];
  }
  return null;
}

function extractInscriptionId(rowText, hrefs = []) {
  for (const href of hrefs) {
    const cleanHref = cleanText(href);
    if (!cleanHref) continue;
    const m = cleanHref.match(INSCRIPTION_ID_REGEX);
    if (m) return m[1];
    const hash = cleanHref.match(HASH64_REGEX);
    if (hash) return hash[1];
  }

  const byText = cleanText(rowText).match(INSCRIPTION_ID_REGEX);
  if (byText) return byText[1];
  const byHash = cleanText(rowText).match(HASH64_REGEX);
  if (byHash) return byHash[1];
  return null;
}

function normalizeSaleRow(row) {
  const rowText = cleanText(row.text);
  if (rowText.length < MIN_ROW_TEXT_LEN) return null;

  const lower = rowText.toLowerCase();
  const hasSaleKeyword = /\b(sale|sold)\b/i.test(lower);
  const looksLikeNotSale = /\b(list|listing|bid|cancel|cancelled|offer|mint)\b/i.test(lower) && !hasSaleKeyword;
  const priceCell = (row.cells || []).find((cell) => /\$/.test(cell) && /\d/.test(cell));
  const priceBTC = priceCell ? parsePriceCellToBTC(priceCell) : parseBTC(rowText);
  if (looksLikeNotSale || priceBTC == null) return null;
  if (!hasSaleKeyword) return null;

  const inscriptionId = extractInscriptionId(rowText, row.hrefs);
  const timestampRaw = extractTimestampRaw(rowText, row.cells, row.timestampHints);

  return {
    timestamp: timestampRaw,
    inscriptionId,
    priceBTC,
    raw: rowText,
    hrefs: row.hrefs || [],
  };
}

async function clickFirstVisible(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    const count = await loc.count();
    if (!count) continue;
    if (!(await loc.isVisible().catch(() => false))) continue;
    await loc.click({ timeout: 1500 }).catch(() => {});
    await sleep(600);
    return true;
  }
  return false;
}

async function openSalesView(page) {
  await clickFirstVisible(page, [
    '[role="tab"]:has-text("Activity")',
    'button:has-text("Activity")',
    'a:has-text("Activity")',
    '[role="button"]:has-text("Activity")',
  ]);

  await clickFirstVisible(page, [
    '[role="tab"]:has-text("Sales")',
    'button:has-text("Sales")',
    '[role="button"]:has-text("Sales")',
  ]);
}

async function clickLoadMoreIfPresent(page) {
  return clickFirstVisible(page, [
    'button:has-text("Load more")',
    'button:has-text("Show more")',
    '[role="button"]:has-text("Load more")',
    '[role="button"]:has-text("Show more")',
    'button:has-text("More")',
  ]);
}

async function readVisibleRows(page) {
  return page.$$eval('tr, [role="row"], [data-testid*="activity"], [class*="activity-row"]', (nodes) => {
    const payload = [];
    for (const node of nodes) {
      const text = (node.innerText || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const hrefs = Array.from(node.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') || '').filter(Boolean);
      const cells = Array.from(node.querySelectorAll('td, [role="cell"]'))
        .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      const timestampHints = [];
      const seenHints = new Set();
      const hintNodes = node.querySelectorAll('[datetime], [title], [aria-label], [data-tooltip], [data-tooltip-content], [data-original-title], [data-time], [data-timestamp]');
      for (const hintNode of hintNodes) {
        const attrs = [
          hintNode.getAttribute('datetime'),
          hintNode.getAttribute('title'),
          hintNode.getAttribute('aria-label'),
          hintNode.getAttribute('data-tooltip'),
          hintNode.getAttribute('data-tooltip-content'),
          hintNode.getAttribute('data-original-title'),
          hintNode.getAttribute('data-time'),
          hintNode.getAttribute('data-timestamp'),
        ];
        for (const raw of attrs) {
          const value = (raw || '').replace(/\s+/g, ' ').trim();
          if (!value || seenHints.has(value)) continue;
          seenHints.add(value);
          timestampHints.push(value);
        }
      }
      payload.push({ text, hrefs, cells, timestampHints });
    }
    return payload;
  });
}

function ensureOutputDirs(outDir) {
  const collectionsDir = path.join(outDir, COLLECTIONS_DIR);
  fs.mkdirSync(collectionsDir, { recursive: true });
  return collectionsDir;
}

function round8(value) {
  return Number((value || 0).toFixed(8));
}

function parseApiTimestamp(item) {
  const ts = item?.ts ?? item?.timestamp ?? item?.data?.ts ?? item?.data?.timestamp;
  if (typeof ts === 'string' && ts.trim()) {
    const parsed = Date.parse(ts);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
    return ts.trim();
  }
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    const ms = ts > 1e12 ? ts : ts * 1000;
    return new Date(ms).toISOString();
  }
  return null;
}

function parseApiPriceBTC(item) {
  const raw = Number(item?.psbt_sale ?? item?.psbtSale ?? item?.price ?? item?.sale_price ?? item?.amount ?? Number.NaN);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  // BiS `psbt_sale` is sats; other fields may already be BTC.
  if (raw > 10000) return round8(raw / 1e8);
  return round8(raw);
}

function normalizeApiSale(item) {
  const inscriptionId = cleanText(item?.inscription_id || item?.data?.inscription_id || '');
  const timestamp = parseApiTimestamp(item);
  const priceBTC = parseApiPriceBTC(item);
  if (!inscriptionId || !timestamp || priceBTC == null) return null;

  const txId = cleanText(item?.tx_id || item?.txId || '');
  const hrefs = [];
  hrefs.push(`/ordinals/inscription/${inscriptionId}`);
  if (txId) hrefs.push(`https://mempool.space/tx/${txId}`);

  return {
    timestamp,
    inscriptionId,
    priceBTC,
    raw: `API sale ${txId || ''} ${cleanText(item?.from || '')} -> ${cleanText(item?.to || '')}`.trim(),
    hrefs,
    source: 'bestinslot-v2api',
  };
}

async function scrapeCollection(page, collectionUrl) {
  const collectionSlug = slugFromUrl(collectionUrl);
  const seenKeys = new Set();
  const sales = [];
  const apiItems = [];
  const apiReads = [];

  const responseHandler = (response) => {
    const url = response.url();
    if (!url.includes('v2api.bestinslot.xyz/collection/activity')) return;
    if (!url.includes(`slug=${collectionSlug}`)) return;
    const read = (async () => {
      try {
        const payload = await response.json();
        const items = Array.isArray(payload?.items) ? payload.items : [];
        if (!items.length) return;
        apiItems.push(...items);
      } catch {
        // Ignore parse errors and let DOM fallback handle it.
      }
    })();
    apiReads.push(read);
  };
  page.on('response', responseHandler);

  try {
    await page.goto(collectionUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await sleep(BOOT_DELAY_MS);
    await openSalesView(page);
    await sleep(800);

    let stablePasses = 0;
    let previousCount = 0;

    for (let pass = 0; pass < MAX_SCROLL_PASSES && stablePasses < STABLE_PASSES_TO_STOP; pass += 1) {
      await clickLoadMoreIfPresent(page);
      await page.mouse.wheel(0, 4200);
      await sleep(SCROLL_DELAY_MS);

      const rows = await readVisibleRows(page);
      for (const row of rows) {
        const normalized = normalizeSaleRow(row);
        if (!normalized) continue;

        const key = [
          normalized.inscriptionId || '',
          normalized.timestamp || '',
          normalized.priceBTC != null ? String(normalized.priceBTC) : '',
          cleanText(row.text),
        ].join('|');
        if (seenKeys.has(key)) continue;

        seenKeys.add(key);
        sales.push(normalized);
      }

      if (sales.length > previousCount) {
        stablePasses = 0;
        previousCount = sales.length;
      } else {
        stablePasses += 1;
      }
    }
  } finally {
    await Promise.allSettled(apiReads);
    page.off('response', responseHandler);
  }

  if (apiItems.length) {
    sales.length = 0;
    seenKeys.clear();
    for (const item of apiItems) {
      const sale = normalizeApiSale(item);
      if (!sale) continue;
      const key = [
        sale.inscriptionId || '',
        sale.timestamp || '',
        sale.priceBTC != null ? String(sale.priceBTC) : '',
        sale.raw || '',
      ].join('|');
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      sales.push(sale);
    }
  }

  sales.sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : Number.NaN;
    const tb = b.timestamp ? Date.parse(b.timestamp) : Number.NaN;
    if (Number.isFinite(ta) && Number.isFinite(tb)) return tb - ta;
    return (b.priceBTC || 0) - (a.priceBTC || 0);
  });

  const totalVolumeBTC = round8(sales.reduce((sum, row) => sum + (row.priceBTC || 0), 0));
  return {
    collectionSlug,
    collectionUrl,
    scrapedAt: new Date().toISOString(),
    totalSales: sales.length,
    totalVolumeBTC,
    sales,
  };
}

function writeCollectionFile(collectionsDir, record) {
  const filePath = path.join(collectionsDir, `${record.collectionSlug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
  return filePath;
}

function buildMasterPayload(records) {
  const master = {
    scrapedAt: new Date().toISOString(),
    source: 'bestinslot-playwright',
    collectionCount: records.length,
    totalSales: records.reduce((sum, item) => sum + (item.totalSales || 0), 0),
    totalVolumeBTC: round8(records.reduce((sum, item) => sum + (item.totalVolumeBTC || 0), 0)),
    collections: {},
  };

  for (const record of records) {
    master.collections[record.collectionSlug] = {
      collectionUrl: record.collectionUrl,
      totalSales: record.totalSales,
      totalVolumeBTC: record.totalVolumeBTC,
      sales: record.sales,
    };
  }

  return master;
}

async function main() {
  const args = parseArgs(process.argv);
  let targetUrls = [...DEFAULT_COLLECTION_URLS];

  if (args.slug) {
    targetUrls = targetUrls.filter((url) => slugFromUrl(url).toLowerCase() === args.slug);
  }
  if (args.limit != null) {
    targetUrls = targetUrls.slice(0, args.limit);
  }
  if (!targetUrls.length) {
    throw new Error('No collection URLs selected. Check --slug or --limit arguments.');
  }

  const collectionsDir = ensureOutputDirs(args.outDir);
  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const records = [];

  for (let index = 0; index < targetUrls.length; index += 1) {
    const url = targetUrls[index];
    const slug = slugFromUrl(url);
    process.stdout.write(`[${index + 1}/${targetUrls.length}] Scraping ${slug}...\n`);
    try {
      const record = await scrapeCollection(page, url);
      writeCollectionFile(collectionsDir, record);
      records.push(record);
      process.stdout.write(`  -> sales=${record.totalSales}, volume=${record.totalVolumeBTC} BTC\n`);
    } catch (error) {
      process.stdout.write(`  -> failed: ${error?.message || String(error)}\n`);
    }
  }

  await context.close();
  await browser.close();

  const masterPayload = buildMasterPayload(records);
  const masterPath = path.join(args.outDir, MASTER_FILE);
  fs.writeFileSync(masterPath, JSON.stringify(masterPayload, null, 2), 'utf8');

  process.stdout.write(`Saved master file: ${masterPath}\n`);
  process.stdout.write(`Collections scraped: ${records.length}\n`);
  process.stdout.write(`Total sales: ${masterPayload.totalSales}\n`);
  process.stdout.write(`Total volume: ${masterPayload.totalVolumeBTC} BTC\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
