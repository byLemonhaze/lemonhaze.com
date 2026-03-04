import './style.css';
import { CHRONOLOGY_BY_YEAR, ABOUT_LEMONHAZE_TEXT, CAREER_HIGHLIGHTS_ITEMS } from './data.js';

// Reusing some logic from main.js for consistent sidebar
let isMobileMenuOpen = false;
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const collectionsNav = document.getElementById('collections-nav');

const aboutOverlay = document.getElementById('about-overlay');
const aboutContent = document.getElementById('about-content');
const aboutClose = document.getElementById('about-close');

const SALES_INDEX_URL = '/data/sales-master/by-inscription.json';
const BTC_SPOT_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

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

function parseSalesTimestampMs(value) {
    const raw = clean(value);
    if (!raw) return Number.NaN;

    if (/^\d+$/.test(raw)) {
        const n = Number(raw);
        if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
    }

    const relative = parseRelativeTimestampMs(raw);
    if (Number.isFinite(relative)) return relative;

    let parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;

    parsed = Date.parse(raw.replace(' UTC', 'Z').replace(' ', 'T'));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function fmtBtc(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(8).replace(/\.?0+$/, '');
}

function fmtUsdToday(value, btcUsdSpot) {
    if (!Number.isFinite(Number(value)) || !Number.isFinite(Number(btcUsdSpot))) return '—';
    return `${usdFormatter.format(Number(value) * Number(btcUsdSpot))} today`;
}

function prettyCollectionLabel(slug) {
    const raw = clean(slug).toLowerCase();
    if (!raw) return 'Unknown';
    return raw
        .replace(/-by-lemonhaze$/, '')
        .replace(/-x-ordinally$/, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

async function fetchSalesIndex() {
    try {
        const res = await fetch(SALES_INDEX_URL, { cache: 'no-store' });
        if (!res.ok) return { inscriptions: {} };
        const payload = await res.json();
        return payload && typeof payload === 'object' ? payload : { inscriptions: {} };
    } catch {
        return { inscriptions: {} };
    }
}

async function fetchBtcUsdSpot() {
    try {
        const res = await fetch(BTC_SPOT_URL, { cache: 'no-store' });
        if (!res.ok) return Number.NaN;
        const payload = await res.json();
        const amount = Number(payload?.data?.amount);
        return Number.isFinite(amount) && amount > 0 ? amount : Number.NaN;
    } catch {
        return Number.NaN;
    }
}

function computeSalesBreakdown(indexPayload) {
    const inscriptions = indexPayload?.inscriptions && typeof indexPayload.inscriptions === 'object'
        ? indexPayload.inscriptions
        : {};

    let primaryBtc = 0;
    let secondaryBtc = 0;
    const byCollection = new Map();

    for (const eventsRaw of Object.values(inscriptions)) {
        const events = Array.isArray(eventsRaw)
            ? eventsRaw.filter((event) => Number.isFinite(Number(event?.priceBTC)))
            : [];
        if (!events.length) continue;

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

        let oldestIdx = -1;
        if (!explicitPrimaryIndices.size && !explicitClassifiedCount) {
            let oldestTs = Number.POSITIVE_INFINITY;
            for (let i = 0; i < events.length; i += 1) {
                const ts = parseSalesTimestampMs(events[i]?.timestamp);
                const rank = Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
                if (rank < oldestTs) {
                    oldestTs = rank;
                    oldestIdx = i;
                }
            }
            if (oldestIdx < 0) oldestIdx = events.length - 1;
        }

        for (let i = 0; i < events.length; i += 1) {
            const event = events[i];
            const price = Number(event.priceBTC);
            const isPrimary = explicitPrimaryIndices.size
                ? explicitPrimaryIndices.has(i)
                : (!explicitClassifiedCount && i === oldestIdx);

            if (isPrimary) primaryBtc += price;
            else secondaryBtc += price;

            const slug = clean(event.collectionSlug) || 'unknown';
            const current = byCollection.get(slug) || { slug, sales: 0, volumeBtc: 0 };
            current.sales += 1;
            current.volumeBtc += price;
            byCollection.set(slug, current);
        }
    }

    const collections = [...byCollection.values()]
        .map((entry) => ({ ...entry, volumeBtc: Number(entry.volumeBtc.toFixed(8)) }))
        .sort((a, b) => b.volumeBtc - a.volumeBtc);

    return {
        primaryBtc: Number(primaryBtc.toFixed(8)),
        secondaryBtc: Number(secondaryBtc.toFixed(8)),
        totalBtc: Number((primaryBtc + secondaryBtc).toFixed(8)),
        collections,
    };
}

function bindSalesSummary(summary, btcUsdSpot) {
    const bind = (key, value) => {
        const node = document.querySelector(`[data-bind=\"${key}\"]`);
        if (node) node.textContent = value;
    };

    bind('sales.primary.btc', `${fmtBtc(summary.primaryBtc)} BTC`);
    bind('sales.primary.usd', fmtUsdToday(summary.primaryBtc, btcUsdSpot));
    bind('sales.secondary.btc', `${fmtBtc(summary.secondaryBtc)} BTC`);
    bind('sales.secondary.usd', fmtUsdToday(summary.secondaryBtc, btcUsdSpot));
}

function renderCollectionSalesTable(summary, btcUsdSpot) {
    const tbody = document.getElementById('sales-collection-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!summary.collections.length) {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5';
        tr.innerHTML = `
            <td class="p-5 text-xs text-white/40" colspan="4">No sales volume data available.</td>
        `;
        tbody.appendChild(tr);
        return;
    }

    summary.collections.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in';
        tr.style.animationDelay = `${idx * 15}ms`;
        tr.innerHTML = `
            <td class="p-5 text-xs font-mono text-white/90">${prettyCollectionLabel(row.slug)}</td>
            <td class="p-5 text-right text-xs font-mono text-white/60">${row.sales.toLocaleString()}</td>
            <td class="p-5 text-right text-xs font-mono text-white/90">${fmtBtc(row.volumeBtc)}</td>
            <td class="p-5 text-right text-xs font-mono text-white/45 hidden md:table-cell">${fmtUsdToday(row.volumeBtc, btcUsdSpot)}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function renderSalesAnalytics() {
    const [indexPayload, btcUsdSpot] = await Promise.all([
        fetchSalesIndex(),
        fetchBtcUsdSpot(),
    ]);
    const summary = computeSalesBreakdown(indexPayload);
    bindSalesSummary(summary, btcUsdSpot);
    renderCollectionSalesTable(summary, btcUsdSpot);
}

// --- Data ---
const ordinals = [
    { name: 'BEST BEFORE', year: 2025, inscribed: 420, circulating: 420 },
    { name: 'Manufactured', year: 2024, inscribed: 420, circulating: 239 },
    { name: 'Satoshi CC Edition', year: 2023, inscribed: 110, circulating: 109 },
    { name: 'Portrait 2490', year: 2023, inscribed: 90, circulating: 87 },
    { name: '1/1s (2024)', year: 2024, inscribed: 49, circulating: 10 },
    { name: '1/1s (2025)', year: 2025, inscribed: 35, circulating: 19 },
    { name: 'Deprivation prints', year: 2023, inscribed: 33, circulating: 33 },
    { name: 'Mirage prints', year: 2024, inscribed: 33, circulating: 33 },
    { name: 'Trilogy prints', year: 2025, inscribed: 33, circulating: 33 },
    { name: 'Gentlemen', year: 2023, inscribed: 25, circulating: 24 },
    { name: 'Miscellaneous', year: 2023, inscribed: 25, circulating: 9 },
    { name: 'Games', year: 2024, inscribed: 26, circulating: 26 },
    { name: 'Minute, papillon! Edition', year: 2025, inscribed: 21, circulating: 21 },
    { name: 'The Artifacts', year: 2023, inscribed: 18, circulating: 17 },
    { name: 'Cypherville', year: 2023, inscribed: 16, circulating: 16 },
    { name: 'Old Fashioned', year: 2023, inscribed: 16, circulating: 14 },
    { name: 'Volatility', year: 2023, inscribed: 16, circulating: 16 },
    { name: 'Provenance', year: 2023, inscribed: 17, circulating: 3 },
    { name: 'La Tentation', year: 2024, inscribed: 15, circulating: 14 },
    { name: 'Deville', year: 2024, inscribed: 15, circulating: 15 },
    { name: 'Text & Unclassified', year: 2023, inscribed: 11, circulating: 1 },
    { name: 'Generative Composition', year: 2023, inscribed: 9, circulating: 8 },
    { name: 'Lotus', year: 2023, inscribed: 9, circulating: 8 },
    { name: 'Split collectible', year: 2023, inscribed: 9, circulating: 8 },
    { name: 'Untitled', year: 2023, inscribed: 8, circulating: 2 },
    { name: 'Mending Fragments', year: 2023, inscribed: 8, circulating: 7 },
    { name: 'Berlin', year: 2023, inscribed: 8, circulating: 8 },
    { name: 'Oaxaca', year: 2023, inscribed: 8, circulating: 8 },
    { name: 'Polaroid', year: 2023, inscribed: 8, circulating: 7 },
    { name: 'Montreal', year: 2024, inscribed: 7, circulating: 7 },
    { name: 'Candidly Yours', year: 2023, inscribed: 7, circulating: 7 },
    { name: 'Discography', year: 2023, inscribed: 7, circulating: 0 },
    { name: 'L’Orphelinat', year: 2023, inscribed: 6, circulating: 3 },
    { name: 'Unregulated Minds', year: 2024, inscribed: 6, circulating: 6 },
    { name: 'Framed', year: 2023, inscribed: 5, circulating: 5 },
    { name: 'Le Bar a Tapas', year: 2023, inscribed: 5, circulating: 5 },
    { name: 'World Tour', year: 2023, inscribed: 5, circulating: 0 },
    { name: 'Ma ville en quatre temps', year: 2025, inscribed: 4, circulating: 4 },
    { name: 'Tori no Roji', year: 2025, inscribed: 4, circulating: 4 },
    { name: 'Little Get Away', year: 2024, inscribed: 4, circulating: 4 },
    { name: 'Ordinals Summer', year: 2023, inscribed: 4, circulating: 4 },
    { name: 'Colors', year: 2023, inscribed: 4, circulating: 0 },
    { name: 'Cypherville Comics', year: 2023, inscribed: 3, circulating: 0 },
    { name: 'Jardin Secret', year: 2023, inscribed: 3, circulating: 1 },
    { name: 'Tad Small', year: 2023, inscribed: 3, circulating: 1 },
    { name: 'Fading', year: 2023, inscribed: 3, circulating: 3 },
    { name: 'Dark Days', year: 2023, inscribed: 3, inscribed: 3, circulating: 3 },
    { name: 'Bento Box', year: 2023, inscribed: 2, circulating: 1 },
    { name: 'Downtown', year: 2023, inscribed: 2, circulating: 2 },
    { name: 'Eclosion 1/1 - Amsterdam Blooms', year: 2023, inscribed: 1, circulating: 1 },
    { name: 'Satoshi 1/1 - Counterfeit Cards S00 - C08', year: 2023, inscribed: 1, circulating: 1 },
    { name: 'Skull 506 [Remix] 1/1 - Skullx', year: 2025, inscribed: 1, circulating: 1 },
    { name: '1/1s (2026)', year: 2026, inscribed: 8, circulating: 8 },
];

const eth = [
    { name: 'Boulogne Editions', platform: 'Rarible', year: 2020, count: 80 },
    { name: 'Rich Bean Editions', platform: 'Rarible', year: 2020, count: 8 },
    { name: 'Bell Street Style', platform: 'Rarible', year: 2020, count: 1 },
    { name: "Murky by John D'Oeufs", platform: 'Rarible', year: 2020, count: 1 },
    { name: 'Marilyn Monero', platform: 'OpenSea', year: 2021, count: 1 },
];

const marketLinks = {
    'BEST BEFORE': {
        me: 'https://magiceden.io/ordinals/marketplace/best-before-by-lemonhaze-x-ordinally',
        gamma: 'https://gamma.io/ordinals/collections/best-before/items'
    },
    'Manufactured': {
        me: 'https://magiceden.io/ordinals/marketplace/manufactured-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/manufactured/items'
    },
    'Satoshi CC Edition': {
        me: 'https://magiceden.io/ordinals/marketplace/counterfeit-cards?selectedAttributes=%7B%22Artist%22%3A%5B%7B%22traitType%22%3A%22Artist%22%2C%22value%22%3A%22Lemonhaze%22%2C%22label%22%3A%22Lemonhaze%22%2C%22count%22%3A111%2C%22floor%22%3A%220.00400%22%2C%22image%22%3A%22https%3A%2F%2Fimg-cdn.magiceden.dev%2Frs%3Afill%3A400%3A0%3A0%2Fplain%2Fhttps%253A%252F%252Ford-mirror.magiceden.dev%252Fcontent%252Fff15d59bd8080f441b44833cddb63178514e203a1b6470e9403ef2ccc24042c8i0%22%2C%22total%22%3A111%2C%22listedPercentage%22%3A%22%22%7D%5D%7D',
        gamma: 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze'
    },
    'Portrait 2490': {
        me: 'https://magiceden.io/ordinals/marketplace/portrait-2490',
        gamma: 'https://gamma.io/ordinals/collections/portrait-2490-by-lemonhaze/items'
    },
    '1/1s (2024)': {
        me: 'https://magiceden.io/ordinals/marketplace/1on1-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/1-1-2024-by-lemonhaze/items'
    },
    'Deprivation prints': {
        me: 'https://magiceden.io/ordinals/marketplace/deprivation-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/prints/cllo44w190001jr0fajdfe7cc/details'
    },
    'Mirage prints': {
        me: 'https://magiceden.io/ordinals/marketplace/mirage-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/prints/clr14i0q90003l60fw2205qjr/details'
    },
    'Trilogy prints': {
        me: 'https://magiceden.io/ordinals/marketplace/prints-trilogy-by-lemonhaze',
        gamma: 'https://gamma.io/explore/prints?creator=clkrid54y0000l50fs5qmsbpp'
    },
    '1/1s (2025)': {
        me: 'https://magiceden.io/ordinals/marketplace/1on1-2025-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/1-1-2025-by-lemonhaze/items'
    },
    'Gentlemen': {
        me: 'https://magiceden.io/ordinals/marketplace/gentlemen-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/gentlemen-by-lemonhaze/items'
    },
    'Miscellaneous': {
        me: 'https://magiceden.io/ordinals/marketplace/miscelleneous-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/miscellaneous-by-lemonhaze/items'
    },
    'Games': {
        me: 'https://magiceden.io/ordinals/marketplace/games-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/games-manufactured/items'
    },
    'Minute, papillon! Edition': {
        me: 'https://magiceden.io/ordinals/marketplace/minute-papillon-editions-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/minute-papillon/items'
    },
    'The Artifacts': {
        me: 'https://magiceden.io/ordinals/marketplace/artifacts-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/theartifacts/items'
    },
    'Cypherville': {
        me: 'https://magiceden.io/ordinals/marketplace/cypherville',
        gamma: 'https://gamma.io/ordinals/collections/cypherville-by-lemonhaze/items'
    },
    'Old Fashioned': {
        me: 'https://magiceden.io/ordinals/marketplace/old-fashioned-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/old-fashioned-by-lemonhaze/items'
    },
    'Volatility': {
        me: 'https://magiceden.io/ordinals/marketplace/volatility-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/volatility-by-lemonhaze/items'
    },
    'Provenance': {
        me: 'https://magiceden.io/ordinals/marketplace/provenance-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/provenance/items'
    },
    'La Tentation': {
        me: 'https://magiceden.io/ordinals/marketplace/tentation-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/la-tentation-by-lemonhaze/items'
    },
    'Deville': {
        me: 'https://magiceden.io/ordinals/marketplace/deville-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/deville-by-lemonhaze/items'
    },
    'Text & Unclassified': {
        me: 'https://magiceden.io/ordinals/item-details/b8acd0a45be8663deea56e28ab831f067ceec54ef68c416b812e17266acf1eddi0',
        gamma: 'https://gamma.io/ordinals/inscriptions/b8acd0a45be8663deea56e28ab831f067ceec54ef68c416b812e17266acf1eddi0'
    },
    'Generative Composition': {
        me: 'https://magiceden.io/ordinals/marketplace/generative-composition-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/generative-composition-by-lemonhaze/items'
    },
    'Lotus': {
        me: 'https://magiceden.io/ordinals/marketplace/lotus-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/lotus-by-lemonhaze/items'
    },
    'Split collectible': {
        me: 'https://magiceden.io/ordinals/marketplace/cypherville-split-collectibles-by-lemonhaze'
    },
    'Untitled': {
        me: 'https://magiceden.io/ordinals/marketplace/untitled-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/untitled/items'
    },
    'Mending Fragments': {
        me: 'https://magiceden.io/ordinals/marketplace/mending-fragments-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/mending-fragments-by-lemonhaze/items'
    },
    'Berlin': {
        me: 'https://magiceden.io/ordinals/marketplace/berlin-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/berlin-by-lemonhaze/items'
    },
    'Oaxaca': {
        me: 'https://magiceden.io/ordinals/marketplace/oaxaca-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/oaxaca-by-lemonhaze/items'
    },
    'Polaroid': {
        me: 'https://magiceden.io/ordinals/marketplace/polaroid-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/polaroid-by-lemonhaze/items'
    },
    'Montreal': {
        me: 'https://magiceden.io/ordinals/marketplace/montreal-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/montreal/items'
    },
    'Candidly Yours': {
        me: 'https://magiceden.io/ordinals/marketplace/candidly-yours-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/candidly-yours/items'
    },
    'Discography': {
        me: 'https://magiceden.io/ordinals/marketplace/discography-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/discography-by-lemonhaze/items'
    },
    'L’Orphelinat': {
        me: 'https://magiceden.io/ordinals/marketplace/orphelinat-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/LOrphelinat/items'
    },
    'Unregulated Minds': {
        me: 'https://magiceden.io/ordinals/marketplace/unregulated-minds-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/unregulated-minds/items'
    },
    'Framed': {
        me: 'https://magiceden.io/ordinals/marketplace/framed',
        gamma: 'https://gamma.io/ordinals/collections/framed-ny-lemonhaze/items'
    },
    'Le Bar a Tapas': {
        me: 'https://magiceden.io/ordinals/marketplace/bar-tapas-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/le-bar-a-tapas-by-lemonhaze/items'
    },
    'World Tour': {
        me: 'https://magiceden.io/ordinals/marketplace/world-tour-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/world-tour-by-lemonhaze/items'
    },
    'Ma ville en quatre temps': {
        me: 'https://magiceden.io/ordinals/marketplace/ma-ville-en-quatre-temps-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/ma-ville-en-quatre-temps%20/items'
    },
    'Tori no Roji': {
        me: 'https://magiceden.io/ordinals/marketplace/tori_no_roji_by_lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/tori-no-roji/items'
    },
    'Little Get Away': {
        me: 'https://magiceden.io/ordinals/marketplace/little-get-away-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/little-get-away/items'
    },
    'Ordinals Summer': {
        me: 'https://magiceden.io/ordinals/marketplace/ordinals-summer-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/ordinals-summer-by-lemonhaze/items'
    },
    'Colors': {
        gamma: 'https://gamma.io/ordinals/collections/colours-by-lemonhaze/items'
    },
    'Cypherville Comics': {
        me: 'https://magiceden.io/ordinals/marketplace/cypherville-comics-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/cypherville-comics-by-lemonhaze/items'
    },
    'Jardin Secret': {
        me: 'https://magiceden.io/ordinals/marketplace/jardin-secret-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/jardin-secret-by-lemonhaze/items'
    },
    'Tad Small': {
        me: 'https://magiceden.io/ordinals/marketplace/tad-small-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/tad-small-by-lemonhaze/items'
    },
    'Fading': {
        me: 'https://magiceden.io/ordinals/marketplace/fading-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/fading-by-lemonhaze/items'
    },
    'Dark Days': {
        me: 'https://magiceden.io/ordinals/marketplace/dark-days-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/dark-days-by-lemonhaze/items'
    },
    'Bento Box': {
        me: 'https://magiceden.io/ordinals/marketplace/bento-box-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/bento-box-by-lemonhaze/items'
    },
    'Downtown': {
        me: 'https://magiceden.io/ordinals/marketplace/downtown-by-lemonhaze',
        gamma: 'https://gamma.io/ordinals/collections/downtown-by-lemonhaze/items'
    },
    'Eclosion 1/1 - Amsterdam Blooms': {
        me: 'https://magiceden.io/ordinals/item-details/aaf0e314aab67783d7e92b0987b0c34ae610b41f64aa1ff7cae8c4fbeebf9029i0',
        gamma: 'https://gamma.io/ordinals/collections/amsterdam-blooms/items'
    },
    'Satoshi 1/1 - Counterfeit Cards S00 - C08': {
        me: 'https://magiceden.io/ordinals/marketplace/counterfeit-cards?selectedAttributes=%7B%22Artist%22%3A%5B%7B%22traitType%22%3A%22Artist%22%2C%22value%22%3A%22Lemonhaze%22%2C%22label%22%3A%22Lemonhaze%22%2C%22count%22%3A111%2C%22floor%22%3A%220.00400%22%2C%22image%22%3A%22https%3A%2F%2Fimg-cdn.magiceden.dev%2Frs%3Afill%3A400%3A0%3A0%2Fplain%2Fhttps%253A%252F%252Ford-mirror.magiceden.dev%252Fcontent%252Fff15d59bd8080f441b44833cddb63178514e203a1b6470e9403ef2ccc24042c8i0%22%2C%22total%22%3A111%2C%22listedPercentage%22%3A%22%22%7D%5D%7D',
        gamma: 'https://gamma.io/ordinals/collections/counterfeit-cards/items?a.Artist=Lemonhaze'
    },
    'Skull 506 [Remix] 1/1 - Skullx': {
        me: 'https://magiceden.io/ordinals/marketplace/skullx_collabs',
        gamma: 'https://gamma.io/ordinals/collections/skullx-the-artist-series/items'
    }
};

const linkOverrides = {
    'BEST BEFORE': 'https://BESTBEFORE.SPACE',
    'Satoshi CC Edition': 'https://magiceden.io/ordinals/marketplace/counterfeit-cards',
    'Satoshi 1/1 - Counterfeit Cards S00 - C08': 'https://magiceden.io/ordinals/marketplace/counterfeit-cards',
    'Deprivation prints': '/index.html?collection=Orphelinat',
    'Mirage prints': '/index.html?collection=1 of 1s (2024)',
    'Trilogy prints': '/index.html?collection=1 of 1s (2025)',
    '1/1s (2024)': '/index.html?collection=1 of 1s (2024)',
    '1/1s (2025)': '/index.html?collection=1 of 1s (2025)',
    'L’Orphelinat': '/index.html?collection=Orphelinat',
    'Minute, papillon! Edition': '/index.html?collection=1 of 1s (2025)',
    'Old Fashioned': '/index.html?collection=Old-Fashioned',
    'Deville': '/index.html?collection=DeVille',
    'Split collectible': 'https://cypherville.xyz',
    'Cypherville Comics': 'https://cypherville.xyz',
    'Tad Small': '/index.html?collection=Tad Small',
    'Dark Days': '/index.html?collection=Dark Days',
};

function renderSidebar() {
    // Top Nav
    const topNav = document.getElementById('top-nav-section');
    const extras = [
        ["About Lemonhaze", () => openAboutModal("About Lemonhaze", ABOUT_LEMONHAZE_TEXT)],
        ["Highlights", () => openAboutModal("Career Highlights", renderCareerList())],
        ["Twitter", () => window.open('https://x.com/Ordinals10K', '_blank')],
        ["Discord", () => window.open('https://discord.com/invite/4A8jaMqdxs', '_blank')]
    ];
    extras.forEach(([label, action]) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-2 rounded-[4px] text-sm transition-colors duration-200 hover:bg-white/5 hover:text-white text-white/50';
        btn.textContent = label;
        btn.onclick = action;
        topNav.appendChild(btn);
    });

    // Year Groups (Visual only)
    const years = Object.keys(CHRONOLOGY_BY_YEAR).sort((a, b) => b - a);
    years.forEach(year => {
        const yearGroup = document.createElement('div');
        yearGroup.className = 'animate-fade-in opacity-20';
        const yearHeader = document.createElement('h3');
        yearHeader.className = 'text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4 mb-2 mt-8';
        yearHeader.textContent = year;
        yearGroup.appendChild(yearHeader);
        collectionsNav.appendChild(yearGroup);
    });
}

function renderTables() {
    const ordBody = document.getElementById('ord-tbody');
    let tInscribed = 0, tCirc = 0, tBurn = 0;

    ordinals.forEach((row, idx) => {
        const burned = row.inscribed - row.circulating;
        tInscribed += row.inscribed;
        tCirc += row.circulating;
        tBurn += burned;

        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in';
        tr.style.animationDelay = `${idx * 20}ms`;

        const links = marketLinks[row.name] || {};
        const btns = [
            links.me ? `<a href="${links.me}" target="_blank" class="px-2 py-1 rounded-[4px] surface text-[10px] text-white/70 hover:text-white hover:border-white/30 transition-colors">ME</a>` : '',
            links.gamma ? `<a href="${links.gamma}" target="_blank" class="px-2 py-1 rounded-[4px] surface text-[10px] text-white/70 hover:text-white hover:border-white/30 transition-colors">Gamma</a>` : ''
        ].join(' ');

        const link = linkOverrides[row.name] || `/index.html?collection=${encodeURIComponent(row.name)}`;

        tr.innerHTML = `
            <td class="p-5 font-mono text-xs"><a href="${link}" class="text-white hover:underline">${row.name}</a></td>
            <td class="p-5 text-white/40 text-xs">${row.year}</td>
            <td class="p-5 text-right font-mono text-xs hidden md:table-cell">${row.inscribed}</td>
            <td class="p-5 text-right font-mono text-xs text-white/90">${row.circulating}</td>
            <td class="p-5 text-right font-mono text-xs text-white/30 hidden md:table-cell">${burned}</td>
            <td class="p-5 text-right flex justify-end gap-2">${btns}</td>
        `;
        ordBody.appendChild(tr);
    });

    document.querySelector('[data-bind="ord.inscribed"]').textContent = tInscribed.toLocaleString();
    document.querySelector('[data-bind="ord.circulating"]').textContent = tCirc.toLocaleString();
    document.querySelector('[data-bind="ord.burned"]').textContent = tBurn.toLocaleString();

    // ETH Table
    const ethBody = document.getElementById('eth-tbody');
    eth.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors';
        tr.innerHTML = `
            <td class="p-5 font-mono text-xs">${row.name}</td>
            <td class="p-5 text-white/40 text-xs hidden md:table-cell">${row.platform}</td>
            <td class="p-5 text-white/40 text-xs">${row.year}</td>
            <td class="p-5 text-right font-mono text-xs">${row.count}</td>
            <td class="p-5 text-right font-mono text-xs hidden md:table-cell">0</td>
            <td class="p-5 text-right"></td>
        `;
        ethBody.appendChild(tr);
    });
}

function renderCareerList() {
    return `<div class="space-y-3 font-mono text-xs md:text-sm text-white/80">
          ${CAREER_HIGHLIGHTS_ITEMS.map(item => `<div>${item}</div>`).join('')}
      </div>`;
}

function openAboutModal(title, content) {
    document.getElementById('about-title').textContent = title;
    aboutContent.innerHTML = content;
    aboutOverlay.classList.remove('hidden');
    requestAnimationFrame(() => aboutOverlay.classList.remove('opacity-0'));
}

function closeAboutModal() {
    aboutOverlay.classList.add('opacity-0');
    setTimeout(() => aboutOverlay.classList.add('hidden'), 300);
}

function setupEventListeners() {
    if (menuToggle) menuToggle.addEventListener('click', () => sidebar.classList.toggle('-translate-x-full'));
    if (aboutClose) aboutClose.addEventListener('click', closeAboutModal);
    aboutOverlay.addEventListener('click', (e) => { if (e.target === aboutOverlay || e.target.id === 'about-wrapper') closeAboutModal(); });
}

async function init() {
    renderSidebar();
    renderTables();
    setupEventListeners();
    await renderSalesAnalytics();
}

void init();
