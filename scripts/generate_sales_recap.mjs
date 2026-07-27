import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const LEDGER_PATH = path.join(ROOT, 'public/data/sales-master/historical-sales-sheet.json');
const DEFAULT_OUTPUT = '/Users/lemonhaze/Desktop/Sales Recap.html';

const COLLECTION_NAMES = {
  'best-before-by-lemonhaze-x-ordinally': 'BEST BEFORE',
  'cypherville-split-collectibles-by-lemonhaze': 'Split collectible',
  'deprivation-by-lemonhaze': 'Deprivation (Prints)',
  'mirage-by-lemonhaze': 'Mirage (Prints)',
  'prints-trilogy-by-lemonhaze': 'Trilogy (Prints)',
  'orphelinat-by-lemonhaze': "L'Orphelinat",
};

function clean(value) {
  return String(value || '').trim();
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatBtc(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return amount.toFixed(8).replace(/\.?0+$/, '');
}

function timestampMs(value) {
  const parsed = Date.parse(clean(value).replace(' UTC', 'Z').replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function yearFor(row) {
  const match = clean(row.timestamp).match(/^(20\d{2})/);
  return match ? match[1] : 'Undated';
}

function displayCollection(row) {
  return clean(row.collectionName)
    || COLLECTION_NAMES[clean(row.collectionSlug)]
    || clean(row.collectionSlug).replaceAll('-', ' ')
    || 'Unassigned';
}

function displayArtwork(row) {
  return clean(row.artworkName)
    || clean(row.bundleLabel)
    || (clean(row.entryType) === 'bundle-sale' ? 'Launch bundle' : 'Untitled inscription');
}

function displayDate(row) {
  const ms = timestampMs(row.timestamp);
  if (!Number.isFinite(ms)) return 'Undated';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(ms));
}

function shortInscription(id) {
  const value = clean(id);
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

function sumBtc(rows) {
  return rows.reduce((total, row) => total + (Number(row.priceBTC) || 0), 0);
}

function groupBy(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const bucket = key(row);
    if (!grouped.has(bucket)) grouped.set(bucket, []);
    grouped.get(bucket).push(row);
  }
  return grouped;
}

function sortChronologically(rows) {
  return [...rows].sort((left, right) => {
    const leftTime = timestampMs(left.timestamp);
    const rightTime = timestampMs(right.timestamp);
    if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
    if (Number.isFinite(leftTime)) return -1;
    if (Number.isFinite(rightTime)) return 1;
    return displayArtwork(left).localeCompare(displayArtwork(right));
  });
}

function saleRowsMarkup(rows) {
  return sortChronologically(rows).map((row) => {
    const inscriptionId = clean(row.inscriptionId);
    const inscription = inscriptionId
      ? `<a href="https://ordinals.com/inscription/${encodeURIComponent(inscriptionId)}" target="_blank" rel="noreferrer">${escapeHtml(shortInscription(inscriptionId))}</a>`
      : '—';
    const type = clean(row.entryType) === 'bundle-sale' ? 'Launch bundle' : 'Individual';
    const searchable = [displayDate(row), displayCollection(row), displayArtwork(row), type, inscriptionId].join(' ').toLowerCase();
    return `<tr data-search="${escapeHtml(searchable)}">
      <td>${escapeHtml(displayDate(row))}</td>
      <td>${escapeHtml(displayArtwork(row))}</td>
      <td class="type">${type}</td>
      <td class="btc">${formatBtc(row.priceBTC)} BTC</td>
      <td class="id">${inscription}</td>
    </tr>`;
  }).join('');
}

function collectionMarkup(collectionName, rows) {
  const total = sumBtc(rows);
  return `<details class="collection">
    <summary>
      <span>${escapeHtml(collectionName)}</span>
      <span class="summary-values">${rows.length.toLocaleString()} entries · ${formatBtc(total)} BTC</span>
    </summary>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date (UTC)</th><th>Work / entry</th><th>Record</th><th>Primary price</th><th>Inscription</th></tr></thead>
        <tbody>${saleRowsMarkup(rows)}</tbody>
      </table>
    </div>
  </details>`;
}

function yearMarkup(year, rows) {
  const collections = groupBy(rows, displayCollection);
  const sortedCollections = [...collections.entries()].sort(([left], [right]) => left.localeCompare(right));
  return `<section class="year-section" data-year="${year}">
    <div class="year-heading">
      <div><p class="eyebrow">Primary ledger</p><h2>${escapeHtml(year)}</h2></div>
      <div class="year-values"><strong>${formatBtc(sumBtc(rows))} BTC</strong><span>${rows.length.toLocaleString()} entries · ${collections.size} collections</span></div>
    </div>
    <div class="collections">${sortedCollections.map(([name, entries]) => collectionMarkup(name, entries)).join('')}</div>
  </section>`;
}

function outputPathFromArgs() {
  const flagIndex = process.argv.indexOf('--out');
  if (flagIndex >= 0 && process.argv[flagIndex + 1]) return path.resolve(process.argv[flagIndex + 1]);
  return DEFAULT_OUTPUT;
}

const sheet = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
const primaryRows = (Array.isArray(sheet.rows) ? sheet.rows : [])
  .filter((row) => clean(row.saleType).toLowerCase() === 'primary');
const byYear = groupBy(primaryRows, yearFor);
const years = [...byYear.keys()].sort((left, right) => {
  if (left === 'Undated') return 1;
  if (right === 'Undated') return -1;
  return left.localeCompare(right);
});
const itemEntries = primaryRows.filter((row) => clean(row.entryType) !== 'bundle-sale').length;
const bundleEntries = primaryRows.length - itemEntries;
const yearCards = years.map((year) => {
  const rows = byYear.get(year);
  return `<a href="#year-${year}" class="year-card"><span>${escapeHtml(year)}</span><strong>${formatBtc(sumBtc(rows))} BTC</strong><small>${rows.length.toLocaleString()} entries</small></a>`;
}).join('');
const yearSections = years.map((year) => yearMarkup(year, byYear.get(year))
  .replace(`data-year="${year}"`, `id="year-${year}" data-year="${year}"`)).join('');
const generatedAt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Montreal', year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(new Date());

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sales Recap — Lemonhaze</title>
  <style>
    :root { color-scheme: dark; --bg:#090909; --panel:#111; --line:#262626; --muted:#9b9b9b; --soft:#5f5f5f; --text:#f2f2ef; --accent:#e0e0d8; }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--bg); color:var(--text); font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size:13px; line-height:1.45; }
    main { width:min(1420px, calc(100% - 32px)); margin:0 auto; padding:42px 0 80px; }
    header { border-bottom:1px solid var(--line); padding-bottom:28px; }
    .brand,.eyebrow { margin:0; color:var(--soft); font-size:10px; letter-spacing:.22em; text-transform:uppercase; }
    h1 { margin:10px 0 8px; font:700 clamp(30px, 5vw, 56px)/.95 ui-sans-serif, system-ui, sans-serif; letter-spacing:-.055em; }
    .intro { max-width:850px; margin:0; color:var(--muted); }
    .totals { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; margin:28px 0 18px; border:1px solid var(--line); background:var(--line); }
    .total { min-width:0; padding:16px; background:var(--panel); }
    .total span { display:block; color:var(--soft); font-size:10px; letter-spacing:.16em; text-transform:uppercase; }
    .total strong { display:block; margin-top:8px; font-size:clamp(19px,2.5vw,31px); letter-spacing:-.06em; white-space:nowrap; }
    .total small { display:block; margin-top:4px; color:var(--muted); }
    .note { margin:0; color:var(--muted); font-size:12px; }
    .year-cards { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; margin:28px 0 38px; }
    .year-card { min-width:0; padding:14px; border:1px solid var(--line); color:inherit; background:transparent; text-decoration:none; }
    .year-card:hover { border-color:#777; background:#101010; }
    .year-card span,.year-card small { display:block; color:var(--muted); font-size:10px; }
    .year-card span { letter-spacing:.14em; text-transform:uppercase; }
    .year-card strong { display:block; margin:8px 0 2px; font-size:15px; letter-spacing:-.04em; white-space:nowrap; }
    .search { position:sticky; top:0; z-index:2; margin:0 -8px 30px; padding:8px; background:rgba(9,9,9,.94); backdrop-filter:blur(8px); }
    .search input { width:100%; border:1px solid var(--line); border-radius:0; padding:13px 14px; color:var(--text); background:#101010; font:inherit; outline:none; }
    .search input:focus { border-color:#8d8d8d; }
    .search-count { display:block; min-height:17px; padding:7px 3px 0; color:var(--muted); font-size:11px; }
    .year-section { scroll-margin-top:82px; margin-top:44px; }
    .year-heading { display:flex; justify-content:space-between; gap:22px; align-items:end; padding-bottom:14px; border-bottom:1px solid var(--line); }
    h2 { margin:4px 0 0; font-size:28px; letter-spacing:-.06em; }
    .year-values { flex:none; text-align:right; }
    .year-values strong { display:block; font-size:17px; letter-spacing:-.04em; }
    .year-values span { color:var(--muted); font-size:11px; }
    .collections { border-top:0; }
    details.collection { border-bottom:1px solid var(--line); }
    summary { display:flex; align-items:center; justify-content:space-between; gap:20px; min-height:54px; cursor:pointer; list-style:none; font-weight:700; }
    summary::-webkit-details-marker { display:none; }
    summary::before { content:'+'; color:var(--soft); font-size:18px; font-weight:400; }
    details[open] summary::before { content:'–'; }
    summary > span:first-of-type { margin-right:auto; }
    .summary-values { color:var(--muted); font-weight:400; font-size:11px; white-space:nowrap; }
    .table-wrap { overflow:auto; border-top:1px solid #1b1b1b; }
    table { width:100%; min-width:760px; border-collapse:collapse; }
    th { padding:11px 12px; color:var(--soft); text-align:left; font-size:10px; letter-spacing:.12em; text-transform:uppercase; background:#0c0c0c; }
    td { padding:10px 12px; border-top:1px solid #191919; vertical-align:top; }
    td.btc { color:#fff; text-align:right; white-space:nowrap; }
    td.type, td.id { color:var(--muted); font-size:11px; white-space:nowrap; }
    td.id a { color:inherit; text-decoration:none; }
    td.id a:hover { color:#fff; text-decoration:underline; }
    tr[hidden] { display:none; }
    .empty { display:none; margin:16px 0; color:var(--muted); }
    @media (max-width:800px) { main { width:min(100% - 20px, 1420px); padding-top:26px; } .totals { grid-template-columns:1fr; } .year-cards { grid-template-columns:repeat(2,minmax(0,1fr)); } .year-heading { align-items:start; flex-direction:column; } .year-values { text-align:left; } summary { min-height:62px; } .summary-values { white-space:normal; text-align:right; } }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="brand">Lemonhaze · private local ledger review</p>
      <h1>Sales Recap</h1>
      <p class="intro">All primary-sale records currently in the local ledger, grouped by recorded year and collection. Prices are BTC values from the ledger; dates are displayed in UTC so the recap is stable across time zones.</p>
      <div class="totals">
        <div class="total"><span>Primary volume</span><strong>${formatBtc(sumBtc(primaryRows))} BTC</strong><small>Across all recorded primary entries</small></div>
        <div class="total"><span>Primary entries</span><strong>${primaryRows.length.toLocaleString()}</strong><small>${itemEntries.toLocaleString()} individual · ${bundleEntries.toLocaleString()} launch bundles</small></div>
        <div class="total"><span>Generated</span><strong>${escapeHtml(generatedAt)}</strong><small>Local recap snapshot</small></div>
      </div>
      <p class="note">An entry is a ledger record, not automatically a unique work. Launch bundles remain visible as their own primary records, and undated entries are kept separate instead of being assigned a guessed year.</p>
    </header>
    <nav class="year-cards" aria-label="Years">${yearCards}</nav>
    <div class="search"><input id="search" type="search" autocomplete="off" placeholder="Filter by collection, work, date, inscription or record type"><span class="search-count" id="search-count">Showing all ${primaryRows.length.toLocaleString()} primary entries</span></div>
    <p class="empty" id="empty">No primary records match that filter.</p>
    ${yearSections}
  </main>
  <script>
    const input = document.getElementById('search');
    const rows = [...document.querySelectorAll('tbody tr')];
    const collections = [...document.querySelectorAll('details.collection')];
    const sections = [...document.querySelectorAll('.year-section')];
    const count = document.getElementById('search-count');
    const empty = document.getElementById('empty');
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let shown = 0;
      rows.forEach((row) => { const visible = !query || row.dataset.search.includes(query); row.hidden = !visible; if (visible) shown += 1; });
      collections.forEach((collection) => { const visibleRows = collection.querySelectorAll('tbody tr:not([hidden])').length; collection.hidden = visibleRows === 0; if (query && visibleRows) collection.open = true; });
      sections.forEach((section) => { section.hidden = !section.querySelector('details.collection:not([hidden])'); });
      count.textContent = query
        ? 'Showing ' + shown.toLocaleString() + ' matching primary entries'
        : 'Showing all ' + rows.length.toLocaleString() + ' primary entries';
      empty.style.display = shown ? 'none' : 'block';
    });
  </script>
</body>
</html>`;

const outputPath = outputPathFromArgs();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`${primaryRows.length} primary entries · ${formatBtc(sumBtc(primaryRows))} BTC`);
