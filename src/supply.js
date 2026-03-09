import './style.css';
import {
    ABOUT_LEMONHAZE_TEXT,
    CAREER_HIGHLIGHTS_ITEMS,
    CHRONOLOGY_BY_YEAR,
    ETH_SUPPLY_DATA,
    LINK_OVERRIDES,
    MARKET_LINKS,
    ORDINALS_SUPPLY_DATA,
    PHYSICAL_WORKS_ITEMS,
} from './data.js';
import { createCollectionResolver } from './data/collections.js';
import { createSupplySectionNode } from './renderers/sections/supply.js';

// Reusing some logic from main.js for consistent sidebar
let isMobileMenuOpen = false;
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const collectionsNav = document.getElementById('collections-nav');

const aboutOverlay = document.getElementById('about-overlay');
const aboutContent = document.getElementById('about-content');
const aboutClose = document.getElementById('about-close');

// --- Data ---
const ordinals = ORDINALS_SUPPLY_DATA;
const eth = ETH_SUPPLY_DATA;
const linkOverrides = LINK_OVERRIDES;
const collectionResolver = createCollectionResolver({
    chronologyByYear: CHRONOLOGY_BY_YEAR,
    getArtworks: () => [],
});
collectionResolver.rebuildCollectionSlugs();

function renderSupplySection() {
    const host = document.getElementById('supply-section-host');
    if (!host) return;
    host.innerHTML = '';
    host.appendChild(createSupplySectionNode({
        ordinalsSupplyData: ordinals,
        marketLinks: MARKET_LINKS,
        linkOverrides,
        physicalWorksItems: PHYSICAL_WORKS_ITEMS,
        physicalSectionTitle: 'Physical Works',
        ordinalsSectionTitle: 'Digital Ordinals [Bitcoin]',
        toCollectionSlug: collectionResolver.toCollectionSlug,
        slugifyCollectionName: collectionResolver.slugifyCollectionName,
    }));
}

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

function renderEthTable() {
    const ethBody = document.getElementById('eth-tbody');
    if (!ethBody) return;
    ethBody.innerHTML = '';
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
    renderSupplySection();
    renderEthTable();
    setupEventListeners();
}

void init();
