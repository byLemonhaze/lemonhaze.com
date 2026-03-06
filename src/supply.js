import './style.css';
import {
    ABOUT_LEMONHAZE_TEXT,
    CAREER_HIGHLIGHTS_ITEMS,
    CHRONOLOGY_BY_YEAR,
    ETH_SUPPLY_DATA,
    MARKET_LINKS,
    ORDINALS_SUPPLY_DATA,
} from './data.js';
import {
    computeSalesSummary,
    formatBtc,
    formatUsdToday,
    getBtcUsdSpot,
    getSalesIndex,
} from './modules/sales-ledger.js';

// Reusing some logic from main.js for consistent sidebar
let isMobileMenuOpen = false;
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const collectionsNav = document.getElementById('collections-nav');

const aboutOverlay = document.getElementById('about-overlay');
const aboutContent = document.getElementById('about-content');
const aboutClose = document.getElementById('about-close');

function clean(value) {
    return String(value || '')
        .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
        .trim();
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

function bindSalesSummary(summary, btcUsdSpot) {
    const bind = (key, value) => {
        const node = document.querySelector(`[data-bind=\"${key}\"]`);
        if (node) node.textContent = value;
    };

    bind('sales.primary.btc', `${formatBtc(summary.primaryBtc)} BTC`);
    bind('sales.primary.usd', formatUsdToday(summary.primaryBtc, btcUsdSpot));
    bind('sales.secondary.btc', `${formatBtc(summary.secondaryBtc)} BTC`);
    bind('sales.secondary.usd', formatUsdToday(summary.secondaryBtc, btcUsdSpot));
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
            <td class="p-5 text-right text-xs font-mono text-white/90">${formatBtc(row.totalBtc)}</td>
            <td class="p-5 text-right text-xs font-mono text-white/45 hidden md:table-cell">${formatUsdToday(row.totalBtc, btcUsdSpot)}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function renderSalesAnalytics() {
    const [indexPayload, btcUsdSpot] = await Promise.all([
        getSalesIndex(),
        getBtcUsdSpot(),
    ]);
    const summary = computeSalesSummary(indexPayload);
    bindSalesSummary(summary, btcUsdSpot);
    renderCollectionSalesTable(summary, btcUsdSpot);
}

// --- Data ---
const ordinals = ORDINALS_SUPPLY_DATA;
const eth = ETH_SUPPLY_DATA;
const marketLinks = MARKET_LINKS;

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
          ${CAREER_HIGHLIGHTS_ITEMS.map(({ text, link }) => (
              `<div>${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="hover:underline">${text}</a>` : text}</div>`
          )).join('')}
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
