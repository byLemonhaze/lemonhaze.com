// --- Provenance modal navigation helper ---
window.__openProvenance = function (pid, options = {}) {
    openArtworkById(pid, options);
};

import './style.css';
import { fetchProvenance, CHRONOLOGY_BY_YEAR, ABOUT_LEMONHAZE_TEXT, CAREER_HIGHLIGHTS_ITEMS, COL_DESCRIPTIONS, ORDINALS_SUPPLY_DATA, ETH_SUPPLY_DATA, MARKET_LINKS, LINK_OVERRIDES, MEDIA_ITEMS } from './data.js';

// State
let allArtworks = [];
let currentFilter = 'Home'; // Landing on Home
let isMobileMenuOpen = false;
let homeInterval = null;
let activeSectionKey = null;
let activeArtworkId = null;
let activeCollectorAddress = null;
let isApplyingUrlState = false;

const INTERNAL_SECTIONS = {
    about: {
        label: 'About',
        title: 'About Lemonhaze',
        content: () => ABOUT_LEMONHAZE_TEXT
    },
    highlights: {
        label: 'Career Highlights',
        title: 'Career Highlights',
        content: () => renderCareerList()
    },
    supply: {
        label: 'Supply & Marketplace',
        title: 'Supply & Marketplace',
        content: () => renderSupplyModalContent()
    },
    media: {
        label: 'Media & Press',
        title: 'Media & Press',
        content: () => renderMediaModalContent()
    },
    collectors: {
        label: 'Collectors',
        title: 'Collector Lookup',
        content: () => renderCollectorModalContent()
    }
};

const ROUTE_KEYS = {
    collection: 'c',
    section: 's',
    artwork: 'a',
    collector: 'u'
};

const LEGACY_ROUTE_KEYS = {
    collection: 'collection',
    section: 'section',
    artwork: 'id',
    collector: 'collector'
};

let collectionNameToSlug = new Map();
let collectionSlugToName = new Map();

// DOM Elements (fetched on demand or in init)
let sidebar, collectionsNav, contentArea, galleryGrid, currentViewTitle, currentViewMeta, loadingIndicator, menuToggle;
let modalOverlay, modalClose, modalImage, modalIframe, modalTitle, modalMetadata, modalActions;
let rawHtmlContainer, rawHtmlContent, closeRawHtml;
let aboutOverlay, aboutTitle, aboutContent, aboutClose;
let refreshBtn;
let testerToggle, testerModal, testerClose, testerInput, testerBtn, testerIframe, testerStatusDot, testerStatusText;

function refreshElements() {
    sidebar = document.getElementById('sidebar');
    collectionsNav = document.getElementById('collections-nav');
    contentArea = document.getElementById('content-area');
    galleryGrid = document.getElementById('gallery-grid');
    currentViewTitle = document.getElementById('current-view-title');
    currentViewMeta = document.getElementById('current-view-meta');
    loadingIndicator = document.getElementById('loading-indicator');
    menuToggle = document.getElementById('menu-toggle');
    refreshBtn = document.getElementById('refresh-btn');

    modalOverlay = document.getElementById('modal-overlay');
    modalClose = document.getElementById('modal-close');
    modalImage = document.getElementById('modal-image');
    modalIframe = document.getElementById('modal-iframe');
    modalTitle = document.getElementById('modal-title');
    modalMetadata = document.getElementById('modal-metadata');
    modalActions = document.getElementById('modal-actions');

    rawHtmlContainer = document.getElementById('raw-html-container');
    rawHtmlContent = document.getElementById('raw-html-content');
    closeRawHtml = document.getElementById('close-raw-html');

    aboutOverlay = document.getElementById('about-overlay');
    aboutTitle = document.getElementById('about-title');
    aboutContent = document.getElementById('about-content');
    aboutClose = document.getElementById('about-close');

    // Tester Elements
    testerToggle = document.getElementById('tester-toggle');
    testerModal = document.getElementById('tester-modal');
    testerClose = document.getElementById('tester-close');
    testerInput = document.getElementById('tester-input');
    testerBtn = document.getElementById('tester-btn');
    testerIframe = document.getElementById('tester-iframe');
    testerStatusDot = document.getElementById('tester-status-dot');
    testerStatusText = document.getElementById('tester-status-text');
}

function normalizeSectionKey(value) {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    return INTERNAL_SECTIONS[key] ? key : null;
}

function slugifyCollectionName(name) {
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function rebuildCollectionSlugs() {
    collectionNameToSlug = new Map();
    collectionSlugToName = new Map();

    const orderedNames = [];
    const seenNames = new Set();
    const addName = (name) => {
        if (!name) return;
        const normalized = String(name).trim();
        if (!normalized || normalized.toLowerCase() === 'home' || seenNames.has(normalized)) return;
        seenNames.add(normalized);
        orderedNames.push(normalized);
    };

    Object.values(CHRONOLOGY_BY_YEAR).flat().forEach(addName);
    allArtworks.forEach(item => addName(item.collection));

    orderedNames.forEach((name) => {
        const baseSlug = slugifyCollectionName(name);
        if (!baseSlug) return;

        let slug = baseSlug;
        let suffix = 2;
        while (collectionSlugToName.has(slug) && collectionSlugToName.get(slug) !== name) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }

        collectionNameToSlug.set(name, slug);
        collectionSlugToName.set(slug, name);
    });
}

function getArtworkImageSrc(item) {
    let ext = 'png';
    if (item.artwork_type === 'JPEG') ext = 'jpg';
    else if (item.artwork_type === 'WEBP') ext = 'webp';
    return `https://cdn.lemonhaze.com/assets/assets/${item.id}.${ext}`;
}

function resolveCollectionName(name) {
    if (!name) return null;

    const rawName = String(name).trim();
    if (!rawName) return null;
    if (rawName.toLowerCase() === 'home') return 'Home';

    const chronologyCollections = Object.values(CHRONOLOGY_BY_YEAR).flat();
    const chronologyMatch = chronologyCollections.find(col => col.toLowerCase() === rawName.toLowerCase());
    if (chronologyMatch) return chronologyMatch;

    const artworkMatch = allArtworks.find(item => (item.collection || '').toLowerCase() === rawName.toLowerCase());
    if (artworkMatch?.collection) return artworkMatch.collection;

    return rawName;
}

function resolveCollectionParam(value) {
    if (!value) return null;

    const rawValue = String(value).trim();
    if (!rawValue) return null;

    const slugMatch = collectionSlugToName.get(rawValue.toLowerCase());
    if (slugMatch) return slugMatch;

    return resolveCollectionName(rawValue);
}

function toCollectionSlug(collectionName) {
    const resolved = resolveCollectionName(collectionName);
    if (!resolved || resolved === 'Home') return null;
    return collectionNameToSlug.get(resolved) || slugifyCollectionName(resolved);
}

function getRouteStateFromUrl() {
    const params = new URLSearchParams(window.location.search);

    const rawCollection = params.get(ROUTE_KEYS.collection) ?? params.get(LEGACY_ROUTE_KEYS.collection);
    const rawSection = params.get(ROUTE_KEYS.section) ?? params.get(LEGACY_ROUTE_KEYS.section);
    const rawArtwork = params.get(ROUTE_KEYS.artwork) ?? params.get(LEGACY_ROUTE_KEYS.artwork);
    const rawCollector = params.get(ROUTE_KEYS.collector) ?? params.get(LEGACY_ROUTE_KEYS.collector);

    return {
        collection: resolveCollectionParam(rawCollection),
        section: normalizeSectionKey(rawSection),
        artwork: rawArtwork?.trim() || null,
        collector: rawCollector?.trim() || null,
        rawCollection,
        rawSection,
        rawArtwork,
        rawCollector,
        hasLegacyParams: (
            params.has(LEGACY_ROUTE_KEYS.collection) ||
            params.has(LEGACY_ROUTE_KEYS.section) ||
            params.has(LEGACY_ROUTE_KEYS.artwork) ||
            params.has(LEGACY_ROUTE_KEYS.collector)
        )
    };
}

function buildUrlWithState(overrides = {}) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const currentRouteState = getRouteStateFromUrl();
    const nextRouteState = { ...currentRouteState, ...overrides };

    const allRouteKeys = [
        ROUTE_KEYS.collection,
        ROUTE_KEYS.section,
        ROUTE_KEYS.artwork,
        ROUTE_KEYS.collector,
        LEGACY_ROUTE_KEYS.collection,
        LEGACY_ROUTE_KEYS.section,
        LEGACY_ROUTE_KEYS.artwork,
        LEGACY_ROUTE_KEYS.collector
    ];
    allRouteKeys.forEach(key => params.delete(key));

    const collectionSlug = toCollectionSlug(nextRouteState.collection);
    if (collectionSlug) {
        params.set(ROUTE_KEYS.collection, collectionSlug);
    }

    if (nextRouteState.section) {
        params.set(ROUTE_KEYS.section, nextRouteState.section);
    }

    if (nextRouteState.artwork) {
        params.set(ROUTE_KEYS.artwork, nextRouteState.artwork);
    }

    if (nextRouteState.collector) {
        params.set(ROUTE_KEYS.collector, nextRouteState.collector);
    }

    url.search = params.toString();
    return url;
}

function syncUrlState(overrides = {}, options = {}) {
    if (isApplyingUrlState) return;

    const { replaceHistory = false } = options;
    const nextUrl = buildUrlWithState(overrides);
    const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (next === current) return;

    const historyMethod = replaceHistory ? 'replaceState' : 'pushState';
    window.history[historyMethod]({}, '', next);
}

function syncSidebarActiveCollection(collectionName) {
    if (!collectionsNav) return;
    const allBtns = Array.from(collectionsNav.querySelectorAll('button[data-collection]'));
    const activeBtn = allBtns.find(btn => btn.dataset.collection === collectionName) || null;
    updateSidebarActiveState(activeBtn);
}

function openArtworkById(id, options = {}) {
    const { updateUrl = true, ensureCollection = true, replaceHistory = false } = options;
    if (!id) return false;

    const target = allArtworks.find(item => item.id === id);
    if (!target) return false;

    const targetCollection = resolveCollectionName(target.collection);
    if (ensureCollection && targetCollection && currentFilter !== targetCollection) {
        loadCollection(targetCollection, { updateUrl: false });
    }

    const imgSrc = getArtworkImageSrc(target);
    const isHtml = target.id.includes('.html') || target.content_type?.includes('html');
    openMetacard(target, imgSrc, isHtml, { updateUrl, replaceHistory });
    return true;
}

function openSection(sectionKey, options = {}) {
    const { updateUrl = true, replaceHistory = false } = options;
    const normalizedKey = normalizeSectionKey(sectionKey);
    if (!normalizedKey) return false;

    const section = INTERNAL_SECTIONS[normalizedKey];

    closeModal({ updateUrl: false });
    openAboutModal(section.title, section.content(), { updateUrl: false });
    activeSectionKey = normalizedKey;

    if (updateUrl) {
        syncUrlState({
            section: normalizedKey,
            artwork: null,
            collector: activeCollectorAddress || null,
            collection: activeCollectorAddress ? null : (currentFilter === 'Home' ? null : currentFilter)
        }, { replaceHistory });
    }

    return true;
}

async function applyUrlStateFromLocation(options = {}) {
    const { replaceHistory = true } = options;
    const routeState = getRouteStateFromUrl();

    const collector = routeState.collector;
    const section = routeState.section;
    const id = routeState.artwork;
    let collection = routeState.collection;

    let shouldNormalizeUrl = routeState.hasLegacyParams;
    const normalizedOverrides = {};

    if (routeState.rawCollection && collection) {
        const canonicalCollectionSlug = toCollectionSlug(collection);
        if (canonicalCollectionSlug && routeState.rawCollection.toLowerCase() !== canonicalCollectionSlug) {
            normalizedOverrides.collection = collection;
            shouldNormalizeUrl = true;
        }
    }

    if (routeState.rawSection && !section) {
        normalizedOverrides.section = null;
        shouldNormalizeUrl = true;
    } else if (routeState.rawSection && section && routeState.rawSection !== section) {
        normalizedOverrides.section = section;
        shouldNormalizeUrl = true;
    }

    if (routeState.rawArtwork && routeState.rawArtwork !== id) {
        normalizedOverrides.artwork = id;
        shouldNormalizeUrl = true;
    }

    if (routeState.rawCollector && routeState.rawCollector !== collector) {
        normalizedOverrides.collector = collector;
        shouldNormalizeUrl = true;
    }

    if (collector && (collection || id || section)) {
        normalizedOverrides.collection = null;
        normalizedOverrides.artwork = null;
        normalizedOverrides.section = null;
        shouldNormalizeUrl = true;
    }

    if (!collector && id && section) {
        normalizedOverrides.section = null;
        shouldNormalizeUrl = true;
    }

    if (id && !collection) {
        const linkedArtwork = allArtworks.find(item => item.id === id);
        if (linkedArtwork?.collection) {
            collection = resolveCollectionName(linkedArtwork.collection);
            normalizedOverrides.collection = collection;
            shouldNormalizeUrl = true;
        }
    } else if (id && collection) {
        const linkedArtwork = allArtworks.find(item => item.id === id);
        const artworkCollection = resolveCollectionName(linkedArtwork?.collection);
        if (artworkCollection && collection !== artworkCollection) {
            collection = artworkCollection;
            normalizedOverrides.collection = artworkCollection;
            shouldNormalizeUrl = true;
        }
    }

    const hasDeepLink = Boolean(collector || collection || section || id);

    isApplyingUrlState = true;
    try {
        if (collector) {
            closeAboutModal({ updateUrl: false });
            closeModal({ updateUrl: false });
            await loadCollectorGallery(collector, { updateUrl: false });
        } else {
            loadCollection(collection || 'Home', { updateUrl: false });

            if (id) {
                const opened = openArtworkById(id, { updateUrl: false, ensureCollection: true });
                if (!opened) {
                    normalizedOverrides.artwork = null;
                    shouldNormalizeUrl = true;
                    closeModal({ updateUrl: false });
                }
                closeAboutModal({ updateUrl: false });
            } else {
                closeModal({ updateUrl: false });
                if (section) {
                    openSection(section, { updateUrl: false });
                } else {
                    closeAboutModal({ updateUrl: false });
                }
            }
        }
    } finally {
        isApplyingUrlState = false;
    }

    if (shouldNormalizeUrl) {
        syncUrlState(normalizedOverrides, { replaceHistory });
    }

    return hasDeepLink;
}

// Initialization
async function init() {
    refreshElements();
    setLoading(true);
    renderSidebar();

    allArtworks = await fetchProvenance();
    rebuildCollectionSlugs();

    const hasDeepLink = await applyUrlStateFromLocation({ replaceHistory: true });
    if (!hasDeepLink) {
        loadCollection('Home', { updateUrl: false });
    }

    setLoading(false);

    setupEventListeners();
}

function renderCollectorModalContent() {
    return `
    <div class="space-y-6 py-4 animate-fade-in text-center">
      <div class="glass p-8 rounded-2xl border border-white/5 space-y-4 max-w-md mx-auto">
        <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">🔍</span>
        </div>
        <h3 class="text-lg font-bold tracking-tight">Collector Lookup</h3>
        <p class="text-xs text-white/40 leading-relaxed italic">
          This feature is currently under development. Check back soon to search collector portfolios and view all Lemonhaze artworks by Bitcoin address.
        </p>
        <div class="mt-6 px-6 py-4 bg-white/5 rounded-xl border border-white/10">
          <p class="text-sm font-mono text-white/60 uppercase tracking-widest">Coming Soon</p>
        </div>
      </div>
    </div>
  `;
}

window.__startCollectorSearch = () => {
    const input = document.getElementById('collector-search-input');
    if (!input || !input.value.trim()) return;
    const addr = input.value.trim();
    closeAboutModal({ updateUrl: false });
    loadCollectorGallery(addr);
};

async function loadCollectorGallery(address, options = {}) {
    const { updateUrl = true, replaceHistory = false } = options;

    if (homeInterval) clearInterval(homeInterval);
    setLoading(true);
    activeCollectorAddress = address;
    activeArtworkId = null;
    activeSectionKey = null;
    currentFilter = `Collector: ${address.slice(0, 6)}...${address.slice(-4)}`;
    syncSidebarActiveCollection(null);

    if (contentArea) contentArea.style.overflowY = 'auto';
    updateHeader('Collector View');
    if (currentViewMeta) {
        currentViewMeta.innerHTML = `<p class="text-[10px] text-white/40 font-mono break-all mt-2">${address}</p>`;
    }

    try {
        // Switch to more specific address-based endpoint and add cache-busting parameter
        const timestamp = Date.now();
        const targetUrl = `https://api.hiro.so/ordinals/v1/addresses/${address}/inscriptions?limit=60&_=${timestamp}`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
        const data = await res.json();

        // Some Hiro endpoints return data.results, others return a flat array or different structure
        // Let's be safe and check both common structures
        const results = data.results || data || [];
        const ownedIds = results.map(r => r.id);

        const matches = allArtworks.filter(a => ownedIds.includes(a.id));
        renderGallery(matches);

        if (currentViewMeta) {
            currentViewMeta.innerHTML = `
        <p class="text-[10px] text-white/40 font-mono break-all mt-2">${address}</p>
        <p class="text-[10px] text-white/60 font-mono mt-1 uppercase tracking-wider">${matches.length} Lemonhaze Works Found</p>
      `;
        }

        if (updateUrl) {
            syncUrlState({
                collector: address,
                collection: null,
                artwork: null,
                section: null
            }, { replaceHistory });
        }
    } catch (e) {
        console.error(e);
        galleryGrid.innerHTML = `
            <div class="col-span-full h-96 flex flex-col items-center justify-center text-white/30 space-y-4">
                <p class="text-xl">Failed to fetch collection</p>
                <p class="text-xs font-mono opacity-50">${address}</p>
            </div>
        `;
    }
    setLoading(false);
}

// ---------------------------------------------------------
// Rendering Side
// ---------------------------------------------------------

function renderSidebar() {
    const topNav = document.getElementById('top-nav-section');
    if (topNav) {
        topNav.innerHTML = '';
        renderTopNav(topNav);
    }

    if (collectionsNav) {
        collectionsNav.innerHTML = '';
        renderYearGroups();
    }
}

function renderTopNav(container) {
    // Internal sections + socials
    const extras = [
        [INTERNAL_SECTIONS.about.label, () => openSection('about')],
        [INTERNAL_SECTIONS.highlights.label, () => openSection('highlights')],
        [INTERNAL_SECTIONS.supply.label, () => openSection('supply')],
        [INTERNAL_SECTIONS.media.label, () => openSection('media')],
        [INTERNAL_SECTIONS.collectors.label, () => openSection('collectors')],
        ['Twitter', () => window.open('https://x.com/Ordinals10K', '_blank')],
        ['Discord', () => window.open('https://discord.com/invite/4A8jaMqdxs', '_blank')]
    ];

    extras.forEach(([label, action]) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:bg-white/5 hover:text-white text-white/40';
        btn.textContent = label;
        btn.onclick = action;
        container.appendChild(btn);
    });
}

function renderYearGroups() {
    const years = Object.keys(CHRONOLOGY_BY_YEAR).sort((a, b) => b - a);
    years.forEach(year => {
        const yearGroup = document.createElement('div');
        yearGroup.className = 'animate-fade-in';

        const yearHeader = document.createElement('h3');
        yearHeader.className = 'text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4 mb-2 mt-8';
        yearHeader.textContent = year;
        yearGroup.appendChild(yearHeader);

        const list = document.createElement('ul');
        list.className = 'space-y-0.5';

        CHRONOLOGY_BY_YEAR[year].forEach(collectionName => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = `w-full text-left px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 hover:bg-white/5 
                       ${currentFilter === collectionName ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white'}`;
            btn.dataset.collection = collectionName;
            btn.textContent = collectionName;
            btn.onclick = () => {
                loadCollection(collectionName);
                if (window.innerWidth < 768) toggleMobileMenu();
            };
            li.appendChild(btn);
            list.appendChild(li);
        });
        yearGroup.appendChild(list);
        collectionsNav.appendChild(yearGroup);
    });
}

function renderSupplyModalContent() {
    let ordInscribed = 0, ordCirc = 0, ordBurned = 0;
    ORDINALS_SUPPLY_DATA.forEach(d => {
        ordInscribed += d.inscribed;
        ordCirc += d.circulating;
        ordBurned += (d.inscribed - d.circulating);
    });

    const ordRows = ORDINALS_SUPPLY_DATA.map(row => {
        const burned = row.inscribed - row.circulating;
        const collectionSlug = toCollectionSlug(row.name) || slugifyCollectionName(row.name);
        const link = LINK_OVERRIDES[row.name] || `/?${ROUTE_KEYS.collection}=${encodeURIComponent(collectionSlug)}`;
        const links = MARKET_LINKS[row.name] || {};
        const btns = [
            links.me ? `<a href="${links.me}" target="_blank" class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition text-[10px]">ME</a>` : '',
            links.gamma ? `<a href="${links.gamma}" target="_blank" class="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition text-[10px]">Gamma</a>` : ''
        ].join(' ');

        return `
      <tr class="border-b border-white/5 text-[11px] hover:bg-white/5">
        <td class="py-2 pr-4 font-medium"><a href="${link}" class="hover:underline text-white">${row.name}</a></td>
        <td class="py-2 px-2 text-white/40">${row.year}</td>
        <td class="py-2 px-2 text-right font-mono hidden sm:table-cell">${row.inscribed}</td>
        <td class="py-2 px-2 text-right font-mono text-white/90">${row.circulating}</td>
        <td class="py-2 px-2 text-right font-mono text-white/30 hidden sm:table-cell">${burned}</td>
        <td class="py-2 pl-4 text-right flex justify-end gap-1">${btns}</td>
      </tr>
    `;
    }).join('');

    return `
    <div class="space-y-8 animate-fade-in">
        <div class="grid grid-cols-3 gap-4">
            <div class="glass p-4 rounded-xl border border-white/5">
                <div class="text-[10px] uppercase tracking-widest text-white/30 mb-1">Inscribed</div>
                <div class="text-xl font-bold font-mono">${ordInscribed.toLocaleString()}</div>
            </div>
            <div class="glass p-4 rounded-xl border border-white/5">
                <div class="text-[10px] uppercase tracking-widest text-white/30 mb-1">Circulating</div>
                <div class="text-xl font-bold font-mono text-white/90">${ordCirc.toLocaleString()}</div>
            </div>
            <div class="glass p-4 rounded-xl border border-white/5">
                <div class="text-[10px] uppercase tracking-widest text-white/30 mb-1">Burned</div>
                <div class="text-xl font-bold font-mono text-white/30">${ordBurned.toLocaleString()}</div>
            </div>
        </div>

        <section>
            <h3 class="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                <span class="w-4 h-[1px] bg-white/10"></span> Digital Ordinals
            </h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-widest text-white/20 border-b border-white/5">
                            <th class="pb-2 font-medium">Collection</th>
                            <th class="pb-2 px-2 font-medium">Year</th>
                            <th class="pb-2 px-2 font-medium text-right hidden sm:table-cell">Inscribed</th>
                            <th class="pb-2 px-2 font-medium text-right">Circ.</th>
                            <th class="pb-2 px-2 font-medium text-right hidden sm:table-cell">Burn</th>
                            <th class="pb-2 pl-4 font-medium text-right">Links</th>
                        </tr>
                    </thead>
                    <tbody>${ordRows}</tbody>
                </table>
            </div>
        </section>

        <section class="opacity-80">
            <h3 class="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                <span class="w-4 h-[1px] bg-white/10"></span> Physical & Other
            </h3>
            <ul class="space-y-2 text-xs text-white/60 font-mono">
                <li>• 16 Signed Prints on SCR/Hemp (2025)</li>
                <li>• 19 Signed Marker on Jeans (2023-25)</li>
                <li>• 1 E-Paper "Sex, Scotch & Soda" (2025)</li>
            </ul>
        </section>
    </div>
  `;
}

function renderCareerList() {
    return `<div class="space-y-3 font-mono text-xs md:text-sm text-white/80">
        ${CAREER_HIGHLIGHTS_ITEMS.map(item => {
        if (typeof item === 'string') {
            return `
                  <div class="flex items-start gap-2">
                    <span class="opacity-40">→</span>
                    <span>${item}</span>
                  </div>
                `;
        } else {
            return `
                  <div class="hover:text-white transition-colors cursor-pointer group flex items-start gap-2" 
                       onclick="window.open('${item.link}', '_blank')">
                    <span class="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
                    <span>${item.text}</span>
                  </div>
                `;
        }
    }).join('')}
    </div>`;
}

function renderMediaModalContent() {
    return `
      <div class="space-y-6 animate-fade-in">
        <p class="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Interviews & Podcasts</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${MEDIA_ITEMS.map((item, idx) => `
            <div class="glass p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                 onclick="window.open('${item.link}', '_blank')"
                 style="animation: fade-in 0.5s ease-out ${item.link ? idx * 0.1 : 0}s both">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-mono text-white/50 uppercase tracking-tighter">${item.platform}</span>
                <span class="text-white/20 group-hover:text-white/60 transition-colors">→</span>
              </div>
              <h4 class="text-[13px] font-bold text-white/90 leading-tight mb-2 group-hover:text-white transition-colors">${item.title}</h4>
              <p class="text-[11px] text-white/40 leading-relaxed font-light">${item.caption}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
}

function updateSidebarActiveState(activeBtn) {
    if (!collectionsNav) return;
    const allBtns = collectionsNav.querySelectorAll('button');
    allBtns.forEach(btn => {
        btn.className = `w-full text-left px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 hover:bg-white/5 text-white/40 hover:text-white`;
    });

    if (activeBtn) {
        activeBtn.className = `w-full text-left px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 hover:bg-white/5 bg-white/10 text-white font-bold`;
    }
}

function loadCollection(name, options = {}) {
    const { updateUrl = true, replaceHistory = false } = options;

    if (homeInterval) clearInterval(homeInterval);
    const resolvedName = resolveCollectionName(name) || 'Home';

    activeCollectorAddress = null;
    activeArtworkId = null;
    activeSectionKey = null;
    currentFilter = resolvedName;

    syncSidebarActiveCollection(resolvedName === 'Home' ? null : resolvedName);
    updateHeader(resolvedName);

    if (updateUrl) {
        syncUrlState({
            collection: resolvedName === 'Home' ? null : resolvedName,
            collector: null,
            artwork: null,
            section: null
        }, { replaceHistory });
    }

    if (resolvedName === 'Home') {
        if (contentArea) contentArea.style.overflowY = 'hidden'; // Lock scroll on Home
        renderHome();
        return;
    }

    if (contentArea) contentArea.style.overflowY = 'auto'; // Enable scroll for collections

    let filtered = allArtworks.filter(item => item.collection === resolvedName);
    if (filtered.length === 0) {
        filtered = allArtworks.filter(item => (item.collection || "").toLowerCase() === resolvedName.toLowerCase());
    }

    renderGallery(filtered);
}

function updateHeader(title) {
    const header = document.querySelector('header');
    if (!currentViewTitle || !header) return;

    if (title === 'Home') {
        // Show Logo/Branding in header on mobile Home, hide header on desktop Home
        header.classList.add('md:hidden');
        currentViewTitle.innerHTML = `<span class="text-lg font-bold tracking-tighter">Lemonhaze</span>`;
        if (currentViewMeta) {
            currentViewMeta.innerHTML = `<p class="text-[9px] text-white/40 font-mono tracking-wider uppercase">&lt;!-- Artist & Coureur de Bois --&gt;</p>`;
        }
        // Hide refresh button on home
        if (refreshBtn) refreshBtn.classList.add('hidden');
        document.title = "Lemonhaze";
        return;
    }

    header.classList.remove('md:hidden');
    currentViewTitle.textContent = title;
    document.title = `${title} | Lemonhaze`;

    const desc = COL_DESCRIPTIONS[title] || "ART BY LEMONHAZE";
    const worksCount = allArtworks.filter(item => item.collection === title).length;

    // Fetch collection year
    let year = "2023–2026";
    for (const [y, list] of Object.entries(CHRONOLOGY_BY_YEAR)) {
        if (list.includes(title)) {
            year = y;
            break;
        }
    }

    if (currentViewMeta) {
        // Special attribution for BEST BEFORE
        const attribution = title === "BEST BEFORE"
            ? `by Lemonhaze x ORDINALLY © ${year}`
            : `by Lemonhaze © ${year}`;

        currentViewMeta.innerHTML = `
      <div class="mt-1 space-y-1">
          <p class="text-[12px] md:text-sm text-white/60 max-w-3xl leading-relaxed italic border-l-2 border-white/10 pl-3 py-0.5">${desc}</p>
          <div class="flex items-center gap-3 text-[9px] text-white/20 font-mono uppercase tracking-[0.2em]">
            <span>${worksCount} Artworks</span>
            <span class="w-1 h-[1px] bg-white/10"></span>
            <span>${attribution}</span>
          </div>
      </div>
    `;
    }

    // Show refresh button for collections
    if (refreshBtn) {
        refreshBtn.classList.remove('hidden');
        refreshBtn.onclick = () => loadCollection(title);
    }
}

function renderHome() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';
    galleryGrid.className = 'w-full flex flex-col items-center justify-center min-h-[85vh] relative overflow-hidden md:py-12';

    // Inject Custom Styles for Glow
    if (!document.getElementById('carousel-styles')) {
        const style = document.createElement('style');
        style.id = 'carousel-styles';
        style.textContent = `
            @keyframes pulse-glow {
              0% { filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.7)) drop-shadow(0 0 6px rgba(249, 243, 246, 0.3)); }
              50% { filter: drop-shadow(0 0 1.3px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 3.5px rgba(232, 220, 180, 0.75)) drop-shadow(0 0 7px rgba(249, 243, 246, 0.35)); }
              100% { filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.7)) drop-shadow(0 0 6px rgba(249, 243, 246, 0.3)); }
            }
        `;
        document.head.appendChild(style);
    }

    // ---------------------------------------------------------
    // 1. Data Preparation (Same as before)
    // ---------------------------------------------------------

    // 1. Initial Fixed Item: Gentleman #1
    const gentlemanId = "757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0";

    // 2. Best Before Revealed Pool
    const bbRevealedIds = [
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i132",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i168",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i30",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i63",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i91",
        // Removed #52
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i158", // #159
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i160", // #161
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i313",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i302",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i291",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i289",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i280",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i80",  // #81
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i222",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i138",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i93",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i85",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i78",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i76",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i31"
    ];

    // 3. Fixed IDs Pool
    const fixedIds = [
        "b32cc2fbacb3aa3b83408a8426873a3a649291da44538a462d76b3a84699f1e9i0",
        "8781dfea6d8f4db71df9c3674c2a555ae1815bdb627685bd1b6ab2a028678c42i0",
        "611fad09e407fe63e70c54ee853e755f92cb4d69049eff21f31d3d414a2db74di0",
        "MA_VILLE_PLACEHOLDER",
        "3966f90bf371dbc520bfebed868fd30adc574f60e900118308587001cb27514bi0",
        "33e141b76fba2459796239c0d67ea8bc056ec4abdb7a4f8d22735bb6c6be8ef6i0",
        "b8e34271e6d76d3d3aeea0756d9ad281132196fc30bb62d35ca8fe9b0fceff97i0",
        "9a4f72cb41ca2c4d5c591224bf02fe1fc3b977e4231042ccb45b9026c814b475i0",
        "989242547accbd3df2611aeae8c311e162d4d188f046d8562f18f6684ade4f63i0",
        "4a35c7618d244bd49c24881d17d159f05401d1e6351037cc05edb1749405a2dci0"
    ];

    // Helpers
    const findItem = (id) => allArtworks.find(a => a.id === id);
    const findMaVille = () => {
        const candidates = allArtworks.filter(a => a.collection === "Ma ville en quatre temps");
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    };
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    const selection = [];
    const selectedIds = new Set();
    const add = (item) => {
        if (item && !selectedIds.has(item.id)) {
            selection.push(item);
            selectedIds.add(item.id);
        }
    };

    // --- Selection Logic ---
    add(findItem(gentlemanId));
    // NO forced 2nd BB anymore.

    const pool = [];
    const addToPool = (item) => { if (item) pool.push(item); }

    fixedIds.forEach(id => {
        if (id === "MA_VILLE_PLACEHOLDER") addToPool(findMaVille());
        else addToPool(findItem(id));
    });

    pool.push({ id: "SEALED", name: "SEALED", collection: "BEST BEFORE", artwork_type: "PNG" });
    pool.push({ id: "EXPIRED", name: "EXPIRED", collection: "BEST BEFORE", artwork_type: "PNG" });

    // Add 3 random BB items to the pool (randomly selected from revealed items)
    shuffle([...bbRevealedIds]).slice(0, 3).forEach(id => addToPool(findItem(id)));

    // Extras
    // Use the exact extras block provided
    const dddExtras = [
        { id: "ddd1", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "ddd2", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "ddd3", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "ddd4", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd3", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd7", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd8", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd9", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd2", name: "Paint Engine v0.1 [Grossier]", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "f93a9e3655a0d9531871248b9a3e6b78c1aaee24c76265247a3172b16bdbc15di0" },
        { id: "dd4", name: "Paint Engine v0.8 [Under Construction]", collection: "1 of 1s (2026)", artwork_type: "JPEG", extension: "jpeg", targetId: "36e74fdb856a69281982f9340739aa10863bbd19da8d7e8fb183b9b9284323f8i0" },
        { id: "dd5", name: "Paint Engine v0.6 [Wild Patch]", collection: "1 of 1s (2026)", artwork_type: "JPEG", extension: "jpeg", targetId: "0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0" },
        { id: "dd6", name: "Paint Engine v0.6 [Wild Patch]", collection: "1 of 1s (2026)", artwork_type: "JPEG", extension: "jpeg", targetId: "0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0" }
    ];
    shuffle(dddExtras).slice(0, 6).forEach(item => pool.push(item));

    const cccExtras = [
        { id: "795a40ea70f17c9de70035395df51dce9510999f0c412bf5068c11115456f1c1i0", name: "Paint Engine v0.9 [Chasing The Dragon]", collection: "1 of 1s (2026)", artwork_type: "PNG" },
        { id: "ccc1", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "PNG" },
        { id: "ccc2", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "PNG" },
        { id: "ccc3", name: "Paint Engine v0.9 [Chasing The Dragon]", collection: "1 of 1s (2026)", artwork_type: "PNG" },
        { id: "ccc4", name: "Paint Engine v0.9 [Chasing The Dragon]", collection: "1 of 1s (2026)", artwork_type: "PNG" }
    ];
    cccExtras.forEach(item => pool.push(item));

    const isValid = (item) => item && !selectedIds.has(item.id) && ["PNG", "JPEG", "WEBP"].includes(item.artwork_type);

    (CHRONOLOGY_BY_YEAR["2025"] || []).forEach(col => {
        if (col === "BEST BEFORE") return;
        const opts = allArtworks.filter(a => a.collection === col && isValid(a));
        if (opts.length > 0) pool.push(opts[Math.floor(Math.random() * opts.length)]);
    });

    (CHRONOLOGY_BY_YEAR["2024"] || []).forEach(col => {
        if (col === "Manufactured") return; // Exclude Manufactured
        const opts = allArtworks.filter(a => a.collection === col && isValid(a));
        if (opts.length > 0) pool.push(opts[Math.floor(Math.random() * opts.length)]);
    });

    // 2023: Pick random 4 items from the entire 2023 year
    const all2023 = [];
    const forbidden2023 = ["Cypherville", "Portrait 2490", "Miscellaneous", "Gentlemen"];
    (CHRONOLOGY_BY_YEAR["2023"] || []).forEach(col => {
        if (forbidden2023.includes(col)) return; // STRICT EXCLUSION
        const items = allArtworks.filter(a => a.collection === col && isValid(a));
        all2023.push(...items);
    });
    shuffle(all2023).slice(0, 4).forEach(item => pool.push(item));

    // Shuffle pool and fill selection
    shuffle(pool).slice(0, 60).forEach(item => add(item));


    // ---------------------------------------------------------
    // 2. Interactive Carousel Rendering
    // ---------------------------------------------------------

    // State
    const totalItems = selection.length;
    let activeIndex = 0;
    let dragOffset = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    if (homeInterval) clearInterval(homeInterval);

    // DOM Creation
    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'relative w-full h-[450px] md:h-[560px] flex items-center justify-center overflow-hidden -mt-4 md:mt-0'; // Match React heights

    const tracksContainer = document.createElement('div');
    tracksContainer.className = 'relative w-full max-w-7xl h-[380px] md:h-[500px]'; // The track
    carouselWrapper.appendChild(tracksContainer);

    // Build Items
    const loadedImages = new Set(); // Track loaded state
    const itemEls = selection.map((artwork, i) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'absolute top-0 w-[85vw] md:w-[600px] h-full cursor-pointer transition-all duration-500 ease-out';
        itemDiv.style.left = '50%';
        itemDiv.style.transform = 'translateX(-50%)'; // Centered by default

        let ext = 'png';
        if (artwork.extension) ext = artwork.extension;
        else if (artwork.artwork_type === 'JPEG') ext = 'jpg';
        else if (artwork.artwork_type === 'WEBP') ext = 'webp';

        const src = `https://cdn.lemonhaze.com/assets/assets/${artwork.id}.${ext}`;
        const isPixelated = artwork.artwork_type === 'PNG';
        const isInteractive = artwork.id !== 'SEALED' && artwork.id !== 'EXPIRED';

        // Fix for stretching: enforce object-contain and hide until loaded
        // Fix for blur: enforce image-rendering: pixelated
        // Fix for empty slide: visual loader
        itemDiv.innerHTML = `
            <div class="w-full h-full relative group flex items-center justify-center">
                 <!-- Loader -->
                 <div class="absolute w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 
                 <img src="${src}" 
                    style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" 
                    class="w-full h-full object-contain opacity-0 transition-opacity duration-500 relative z-10" draggable="false" />
            </div>
        `;

        const img = itemDiv.querySelector('img');
        if (img) {
            img.onload = () => {
                img.classList.remove('opacity-0');
                loadedImages.add(i); // Mark as loaded
            };
            // In case it's cached and already loaded
            if (img.complete) {
                img.classList.remove('opacity-0');
                loadedImages.add(i);
            }
        }


        // Click to Navigate or Open
        itemDiv.onclick = (e) => {
            if (i === activeIndex && !isDragging) {
                if (isInteractive) {
                    const idToOpen = artwork.targetId || artwork.id;
                    window.__openProvenance(idToOpen);
                }
            } else if (!isDragging) {
                setActiveIndex(i);
            }
        };

        tracksContainer.appendChild(itemDiv);
        return itemDiv;
    });



    // Aggressive Preload (Next 10, Immediate)
    // Aggressive Preload (Next 10, Immediate) & Background Sync
    const preloadImage = (index) => {
        if (index < 0 || index >= selection.length) return;
        const art = selection[index];
        let ext = 'png';
        if (art.extension) ext = art.extension;
        else if (art.artwork_type === 'JPEG') ext = 'jpg';
        else if (art.artwork_type === 'WEBP') ext = 'webp';
        new Image().src = `https://cdn.lemonhaze.com/assets/assets/${art.id}.${ext}`;
    };

    // Immediate initial preload (10 items)
    for (let i = 1; i < Math.min(selection.length, 10); i++) {
        preloadImage(i);
    }

    // Background Sync: Load ALL remaining images sequentially
    let bgIndex = 10;
    const bgLoad = () => {
        if (bgIndex >= selection.length) return;
        const art = selection[bgIndex];
        let ext = 'png';
        if (art.extension) ext = art.extension;
        else if (art.artwork_type === 'JPEG') ext = 'jpg';
        else if (art.artwork_type === 'WEBP') ext = 'webp';

        const img = new Image();
        img.src = `https://cdn.lemonhaze.com/assets/assets/${art.id}.${ext}`;
        img.onload = () => {
            bgIndex++;
            // Small delay to yield to main thread interactions
            setTimeout(bgLoad, 20);
        };
        img.onerror = () => {
            bgIndex++;
            bgLoad();
        }
    };
    // Start background sync after initial burst
    setTimeout(bgLoad, 2000);


    // Label Map
    const colToYear = {};
    Object.entries(CHRONOLOGY_BY_YEAR).forEach(([y, cols]) => {
        cols.forEach(c => colToYear[c] = y);
    });

    const labelContainer = document.createElement('div');
    // Mobile: mt-2. Desktop: reduced from mt-12 to mt-6 for tighter look.
    labelContainer.className = 'mt-2 md:mt-6 text-center animate-fade-in delay-500 min-h-[4rem] relative z-40';

    // Core Update Logic
    function updateCarousel() {
        itemEls.forEach((el, index) => {
            // Calculate circular distance
            let diff = index - activeIndex;
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;

            const isActive = diff === 0;
            const isPrev = diff === -1;
            const isNext = diff === 1;

            // Reset base styles
            el.style.zIndex = '0';
            el.style.opacity = '0'; // Default hidden (PHANTOM MODE)
            el.style.pointerEvents = 'none';
            // Reset filter on IMG, not EL
            const img = el.querySelector('img');
            if (img) {
                img.style.filter = 'blur(5px) grayscale(100%)';
                img.style.animation = 'none';
                img.style.transitionProperty = 'opacity, transform, filter';
            }
            el.style.transform = 'translateX(-50%) scale(0.8)';

            // Override transition if dragging
            el.style.transition = isDragging ? 'none' : 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';

            if (isActive) {
                el.style.zIndex = '20';
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
                if (img) {
                    img.style.filter = 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.7)) drop-shadow(0 0 6px rgba(249, 243, 246, 0.3))';
                    img.style.animation = 'pulse-glow 1.8s ease-in-out infinite';
                }
                el.style.transform = `translateX(calc(-50% + ${dragOffset}px)) scale(1)`;
            } else if (isPrev) {
                el.style.zIndex = '10';
                el.style.opacity = '0'; // Phantom opacity
                el.style.pointerEvents = 'auto';
                el.style.transform = `translateX(calc(-120% + ${dragOffset}px)) scale(0.85)`;
            } else if (isNext) {
                el.style.zIndex = '10';
                el.style.opacity = '0'; // Phantom opacity
                el.style.pointerEvents = 'auto';
                el.style.transform = `translateX(calc(20% + ${dragOffset}px)) scale(0.85)`;
            }
        });

        // Update Label
        const item = selection[activeIndex];
        if (item) {
            const year = colToYear[item.collection] || (item.collection === "BEST BEFORE" ? "2025" : "");
            labelContainer.innerHTML = `
              <h4 class="text-sm md:text-base font-bold text-white tracking-widest mb-1 italic opacity-90 text-shadow-sm shadow-black">${item.name || 'Untitled'}</h4>
              <p class="text-[10px] text-white/30 font-mono uppercase tracking-[0.3em] font-light text-shadow-sm shadow-black">${item.collection}</p>
              ${year ? `<p class="text-[9px] text-white/10 font-mono mt-1 tracking-widest font-light text-shadow-sm shadow-black">${year}</p>` : ''}
            `;
        }
    }



    // Smart Skip Helper
    function findNearestLoaded(startIdx, direction) {
        let target = (startIdx + direction + totalItems) % totalItems;
        // If immediate target is loaded, return it
        if (loadedImages.has(target)) return target;

        // Scan ahead through ALL items to find the nearest loaded one
        for (let offset = 1; offset < totalItems; offset++) {
            const candidate = (startIdx + (direction * offset) + totalItems) % totalItems;
            if (candidate === startIdx) continue; // Full circle
            if (loadedImages.has(candidate)) {
                return candidate;
            }
        }

        // If literally nothing else is loaded, fallback to immediate neighbor
        return target;
    }

    function setActiveIndex(newIndex) {
        activeIndex = newIndex;
        // Normalize wrap-around logic for "change" not just display
        // Actually, logic handles arbitrary integers if we mod, but here we just pass direct index.
        updateCarousel();

        // Smart Preload Neighbors
        // We handle wrap-around indices for preloading
        let nextIdx = (activeIndex + 1) % totalItems;
        let prevIdx = (activeIndex - 1 + totalItems) % totalItems;
        preloadImage(nextIdx);
        preloadImage(prevIdx);
        // Aggressively fetch next 5 steps to ensure smart skip has targets
        for (let k = 2; k <= 5; k++) {
            preloadImage((activeIndex + k) % totalItems);
        }
    }

    function next() {
        // Smart Next: Skip unloaded images
        const target = findNearestLoaded(activeIndex, 1);
        setActiveIndex(target);
    }

    function prev() {
        // Smart Prev: Skip unloaded images (scan backwards)
        const target = findNearestLoaded(activeIndex, -1);
        setActiveIndex(target);
    }

    // Auto Play with Smart Skip
    function startAutoPlay() {
        if (homeInterval) clearInterval(homeInterval);
        homeInterval = setInterval(() => {
            if (!isDragging) {
                // Smart Skip Logic
                const target = findNearestLoaded(activeIndex, 1);
                setActiveIndex(target);
            }
        }, 5000);
    }

    // Interactions

    // Touch / Swipe
    const onTouchStart = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentX = startX;
        dragOffset = 0;
        if (homeInterval) clearInterval(homeInterval); // Pause on interact
        updateCarousel(); // Remove transition
    };

    const onTouchMove = (e) => {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentX = x;
        dragOffset = currentX - startX;
        updateCarousel();
    };

    const onTouchEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentX - startX;
        // Increase threshold to 75 to avoid accidental swipes
        if (Math.abs(diff) > 75) {
            // CRITICAL FIX: Reset offset BEFORE navigating so it snaps to center of new index
            dragOffset = 0;
            if (diff > 0) prev();
            else next();
        } else {
            // Snap back to current
            dragOffset = 0;
            updateCarousel();
        }

        // Resume autoplay
        startAutoPlay();
    };

    // Attach Swipe Events to Wrapper
    carouselWrapper.addEventListener('touchstart', onTouchStart, { passive: true });
    carouselWrapper.addEventListener('touchmove', onTouchMove, { passive: true });
    carouselWrapper.addEventListener('touchend', onTouchEnd);

    // Mouse Drag (Desktop "Swipe")
    carouselWrapper.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);

    // Setup Controls (Arrows)
    const createArrow = (dir) => {
        const btn = document.createElement('button');
        const isRight = dir === 'right';
        btn.className = `absolute ${isRight ? 'right-4 md:right-12' : 'left-4 md:left-12'} top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-white transition-all duration-300 hover:scale-125`;
        btn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="${isRight ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}"></polyline></svg>`;
        btn.onclick = (e) => {
            e.stopPropagation();
            if (homeInterval) clearInterval(homeInterval);
            isRight ? next() : prev();
            startAutoPlay();
        };
        return btn;
    };

    carouselWrapper.appendChild(createArrow('left'));
    carouselWrapper.appendChild(createArrow('right'));

    /* Dots Removed */



    // Keyboard support
    const handleKey = (e) => {
        if (currentFilter !== 'Home') return; // Only if home
        if (e.key === 'ArrowLeft') {
            if (homeInterval) clearInterval(homeInterval);
            prev();
            startAutoPlay();
        }
        if (e.key === 'ArrowRight') {
            if (homeInterval) clearInterval(homeInterval);
            next();
            startAutoPlay();
        }
    };
    window.addEventListener('keydown', handleKey);

    // Initial Start
    galleryGrid.appendChild(carouselWrapper);
    galleryGrid.appendChild(labelContainer);

    updateCarousel();
    startAutoPlay();
}

function renderGallery(items) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';
    galleryGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-20'; // Reset grid
    contentArea.scrollTop = 0;

    if (items.length === 0) {
        galleryGrid.innerHTML = `
      <div class="col-span-full h-96 flex flex-col items-center justify-center text-white/30">
        <p class="text-xl">No artworks found</p>
      </div>
    `;
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'glass rounded-xl overflow-hidden group hover:scale-[1.02] transition-all duration-500 animate-fade-in cursor-pointer border border-white/5';
        card.style.animationDelay = `${idx * 20}ms`;

        let ext = 'png';
        if (item.artwork_type === 'JPEG') ext = 'jpg';
        else if (item.artwork_type === 'WEBP') ext = 'webp';

        const imgSrc = `https://cdn.lemonhaze.com/assets/assets/${item.id}.${ext}`;
        const imgClass = item.artwork_type === 'PNG' ? 'pixelated' : '';

        card.innerHTML = `
      <div class="aspect-square bg-neutral-900/40 rounded-xl border border-white/5 relative group overflow-hidden flex items-center justify-center">
        <img src="${imgSrc}" class="w-[85%] h-[85%] object-contain drop-shadow-2xl group-hover:scale-105 transition-all duration-700 ${imgClass}" loading="lazy" />
        <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p class="text-[11px] font-bold text-white tracking-widest italic">${item.name || 'Untitled'}</p>
        </div>
      </div>
    `;

        card.onclick = () => openArtworkById(item.id);
        fragment.appendChild(card);
    });

    galleryGrid.appendChild(fragment);
}

// ---------------------------------------------------------
// Metacard Logic (New Modal)
// ---------------------------------------------------------

async function openMetacard(item, imgSrc, isHtml, options = {}) {
    const { updateUrl = true, replaceHistory = false } = options;
    if (!modalTitle) return;

    closeAboutModal({ updateUrl: false });
    activeSectionKey = null;
    activeCollectorAddress = null;
    activeArtworkId = item.id;

    modalTitle.textContent = item.name;

    modalImage.classList.add('hidden');
    modalIframe.classList.add('hidden');
    rawHtmlContainer.classList.add('hidden');

    modalImage.src = imgSrc;
    modalImage.classList.remove('hidden');

    modalIframe.src = `https://ordinals.com/content/${item.id}`;
    modalIframe.classList.add('hidden');

    renderMetadataList(item);
    renderActionButtons(item, imgSrc);

    modalOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalOverlay.classList.remove('opacity-0');
    });

    if (updateUrl) {
        syncUrlState({
            collection: resolveCollectionName(item.collection) || (currentFilter === 'Home' ? null : currentFilter),
            collector: null,
            section: null,
            artwork: item.id
        }, { replaceHistory });
    }
}

function renderMetadataList(item) {
    modalMetadata.innerHTML = '';

    const orderedKeys = [
        ['Collection', 'collection'],
        ['Provenance', 'provenance'],
        ['Timestamp', 'timestamp'],
        ['Artwork Type', 'artwork_type'],
        ['Dimensions', 'dimensions'],
        ['Artwork Size', 'size'],
        ['Sat Inscribed', 'sat'],
        ['Block Height', 'height']
    ];

    orderedKeys.forEach(([label, key]) => {
        let value = item[key];
        if (key === 'provenance' && typeof value === 'string') {
            value = value
                .split(/[\s,]+/)
                .map(v => v.trim())
                .filter(v => v.length > 10);
        }
        if (!value) return;

        if (key === 'sat' && item.charms) {
            value += ` - ${item.charms}`;
        }

        const row = document.createElement('div');
        row.className = 'flex flex-col border-b border-white/5 pb-2 mb-2 last:border-0';

        if (key === 'provenance' && Array.isArray(value)) {
            const thumbs = value.map(pid => {
                const extItem = allArtworks.find(a => a.id === pid);
                if (!extItem) return '';

                let ext = 'png';
                if (extItem.artwork_type === 'JPEG') ext = 'jpg';
                else if (extItem.artwork_type === 'WEBP') ext = 'webp';

                const src = `https://cdn.lemonhaze.com/assets/assets/${pid}.${ext}`;

                return `
          <img
            src="${src}"
            alt="${pid}"
            class="w-10 h-10 object-cover rounded-md border border-white/10 cursor-pointer hover:opacity-80 transition"
            loading="lazy"
            onclick="window.__openProvenance('${pid}')"
          />
        `;
            }).join('');

            row.innerHTML = `
        <span class="text-white/40 uppercase tracking-widest text-[10px] mb-1">${label}</span>
        <div class="flex gap-2 flex-wrap">${thumbs}</div>
      `;
        } else {
            row.innerHTML = `
        <span class="text-white/40 uppercase tracking-widest text-[10px] mb-1">${label}</span>
        <span class="text-white/90 break-words leading-tight">${value}</span>
      `;
        }

        modalMetadata.appendChild(row);
    });

    const ownerRow = document.createElement('div');
    ownerRow.className = 'flex flex-col border-b border-white/5 pb-2 mb-2 last:border-0';
    ownerRow.innerHTML = `
        <span class="text-white/40 uppercase tracking-widest text-[10px] mb-1">Owner</span>
        <span id="meta-owner" class="text-white/90 break-words leading-tight animate-pulse">Fetching...</span>
    `;
    modalMetadata.appendChild(ownerRow);

    fetchOwner(item.id);
}

async function fetchOwner(id) {
    try {
        const res = await fetch(`https://api.allorigins.win/raw?url=https://ordinals.com/inscription/${id}`);
        const html = await res.text();
        const match = html.match(/<dt[^>]*>\s*address\s*<\/dt>\s*<dd[^>]*>\s*<a[^>]*>(.*?)<\/a>/i);
        const owner = match ? match[1].trim() : 'Unknown';

        const el = document.getElementById('meta-owner');
        if (el) {
            if (owner !== 'Unknown') {
                el.innerHTML = `<button onclick="window.__gotoCollector('${owner}')" class="text-white hover:underline decoration-white/30 text-left transition-all">${owner}</button>`;
            } else {
                el.textContent = owner;
            }
            el.classList.remove('animate-pulse');
        }
    } catch (e) {
        const el = document.getElementById('meta-owner');
        if (el) {
            el.textContent = 'Unavailable';
            el.classList.remove('animate-pulse');
        }
    }
}

window.__gotoCollector = (addr) => {
    closeAboutModal({ updateUrl: false });
    closeModal({ updateUrl: false });
    loadCollectorGallery(addr);
};

function renderActionButtons(item, imgSrc) {
    modalActions.innerHTML = '';

    let isOnChain = false;
    let isFrameView = false;
    const baseImgSrc = imgSrc;

    const createBtn = (icon, hint, onClick) => {
        const btn = document.createElement('button');
        btn.innerHTML = icon;
        btn.title = hint;
        btn.className = 'w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white text-white hover:text-black transition-all duration-200 text-lg';
        btn.onclick = onClick;
        return btn;
    };

    // 1. Ordinals
    modalActions.appendChild(createBtn('◉', 'View on Ordinals', () => window.open(`https://ordinals.com/inscription/${item.id}`, '_blank')));

    // 2. Download
    modalActions.appendChild(createBtn('↓', 'Download', () => {
        const link = document.createElement('a');
        link.href = imgSrc;
        link.download = `${item.name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }));

    // 3. HTML Content (Raw Source)
    modalActions.appendChild(createBtn('⌸', 'Raw Source', async () => {
        rawHtmlContainer.classList.remove('hidden');
        rawHtmlContent.textContent = 'Loading source...';
        try {
            const res = await fetch(`https://ordinals.com/content/${item.id}`);
            const text = await res.text();
            rawHtmlContent.textContent = text;
        } catch (e) {
            rawHtmlContent.textContent = 'Failed to load source.';
        }
    }));

    // 4. Toggle Onchain / Offchain
    const chainBtn = createBtn('⛓', 'Toggle On-Chain / Off-Chain', () => {
        isOnChain = !isOnChain;
        isFrameView = false; // Reset frame view if toggling chain

        if (isOnChain) {
            modalImage.classList.add('hidden');
            modalIframe.classList.remove('hidden');
            modalIframe.src = `https://ordinals.com/content/${item.id}`;
            chainBtn.classList.add('ring-2', 'ring-white');
        } else {
            modalIframe.classList.add('hidden');
            modalImage.src = baseImgSrc;
            modalImage.classList.remove('hidden');
            chainBtn.classList.remove('ring-2', 'ring-white');
        }
    });
    modalActions.appendChild(chainBtn);

    // 5. Share
    modalActions.appendChild(createBtn('⎋', 'Share Link', () => {
        const url = buildUrlWithState({
            collection: resolveCollectionName(item.collection) || currentFilter,
            collector: null,
            section: null,
            artwork: item.id
        });
        navigator.clipboard.writeText(url.toString()).then(() => {
            const btn = modalActions.querySelector('button[title="Share Link"]');
            const oldText = btn.textContent;
            btn.textContent = '✓ Copied';
            setTimeout(() => btn.textContent = oldText, 2000);
        });
    }));

    // 6. Refresh
    modalActions.appendChild(createBtn('↻', 'Refresh Content', () => {
        const btn = modalActions.querySelector('button[title="Refresh Content"]');
        btn.classList.add('animate-spin');

        // Refresh Image if visible
        if (!modalImage.classList.contains('hidden') && modalImage.src) {
            const currentSrc = modalImage.src.split('?')[0]; // strip existing params
            modalImage.src = `${currentSrc}?t=${new Date().getTime()}`;
        }

        // Refresh Iframe if visible
        if (!modalIframe.classList.contains('hidden') && modalIframe.src) {
            modalIframe.src = modalIframe.src;
        }

        setTimeout(() => btn.classList.remove('animate-spin'), 1000);
    }));

    // 7. Frame Thumb (Conditional Append)
    const frameThumb = document.createElement('img');
    frameThumb.src = `https://cdn.lemonhaze.com/assets/assets/FRAME${item.id}.png`;
    frameThumb.alt = 'Framed Scene Preview';
    frameThumb.className = `w-20 rounded-md border border-white/10 shadow-sm cursor-pointer opacity-80 hover:opacity-100 transition-opacity ml-2`; // Added ml-2 for spacing
    frameThumb.loading = 'lazy';

    // Remove the element entirely if it fails to load
    frameThumb.onerror = () => frameThumb.remove();

    frameThumb.onclick = () => {
        isOnChain = false;
        isFrameView = !isFrameView;
        modalIframe.classList.add('hidden');
        modalImage.src = isFrameView ? frameThumb.src : baseImgSrc;
        modalImage.classList.remove('hidden');
        chainBtn.classList.remove('ring-2', 'ring-white');
    };

    modalActions.appendChild(frameThumb);
}

function closeModal(options = {}) {
    const { updateUrl = true, replaceHistory = false } = options;
    const hadArtwork = Boolean(activeArtworkId);
    activeArtworkId = null;

    if (updateUrl && hadArtwork) {
        syncUrlState({ artwork: null }, { replaceHistory });
    }

    if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

    modalOverlay.classList.add('opacity-0');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        modalImage.src = '';
        modalIframe.src = '';
        rawHtmlContainer.classList.add('hidden');
    }, 300);
}

// ---------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------

function openAboutModal(title, content, options = {}) {
    const { updateUrl = true, replaceHistory = false, sectionKey = null } = options;
    refreshElements();
    if (!aboutTitle || !aboutContent || !aboutOverlay) {
        console.error("About modal elements missing");
        return;
    }

    aboutTitle.textContent = title;

    let finalContent = content;
    if (title === "About Lemonhaze") {
        // Image removed as requested. Text only.
        finalContent = `
            <div class="max-w-2xl mx-auto">
                ${content}
            </div>
         `;
    }

    aboutContent.innerHTML = finalContent;
    aboutOverlay.classList.remove('hidden');

    if (sectionKey !== null) {
        activeSectionKey = normalizeSectionKey(sectionKey);
    }

    // Force a reflow before removing opacity-0
    void aboutOverlay.offsetWidth;
    aboutOverlay.classList.remove('opacity-0');

    if (updateUrl && activeSectionKey) {
        syncUrlState({
            section: activeSectionKey,
            artwork: null,
            collector: activeCollectorAddress || null,
            collection: activeCollectorAddress ? null : (currentFilter === 'Home' ? null : currentFilter)
        }, { replaceHistory });
    }
}

function closeAboutModal(options = {}) {
    const { updateUrl = true, replaceHistory = false } = options;
    const hadSection = Boolean(activeSectionKey);
    activeSectionKey = null;

    if (updateUrl && hadSection) {
        syncUrlState({ section: null }, { replaceHistory });
    }

    if (!aboutOverlay || aboutOverlay.classList.contains('hidden')) return;

    aboutOverlay.classList.add('opacity-0');
    setTimeout(() => {
        aboutOverlay.classList.add('hidden');
    }, 300);
}

function setLoading(isLoading) {
    if (!loadingIndicator) return;
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
    sidebar.classList.toggle('-translate-x-full');

    const backdrop = document.getElementById('mobile-backdrop');
    if (backdrop) {
        if (isMobileMenuOpen) {
            backdrop.classList.remove('hidden');
        } else {
            backdrop.classList.add('hidden');
        }
    }
}

// --- Iframe Tester Logic ---

function setTesterStatus(state, msg) {
    if (!testerStatusDot) return;
    testerStatusDot.className = 'w-2 h-2 rounded-full inline-block mr-2 transition-colors duration-300';
    if (state === 'ready') {
        testerStatusDot.classList.add('bg-neutral-600');
        testerStatusText.textContent = msg || 'READY';
        testerStatusText.className = 'text-[10px] uppercase font-mono text-white/40';
    } else if (state === 'loading') {
        testerStatusDot.classList.add('bg-yellow-500', 'animate-pulse');
        testerStatusText.textContent = 'TESTING...';
        testerStatusText.className = 'text-[10px] uppercase font-mono text-yellow-500';
    } else if (state === 'success') {
        testerStatusDot.classList.add('bg-green-500');
        testerStatusText.textContent = 'LIKELY ALLOWED';
        testerStatusText.className = 'text-[10px] uppercase font-mono text-green-500';
    } else if (state === 'error') {
        testerStatusDot.classList.add('bg-red-500');
        testerStatusText.textContent = 'BLOCKED / ERROR';
        testerStatusText.className = 'text-[10px] uppercase font-mono text-red-500';
    }
}

function toggleTester() {
    if (!testerModal) return;
    if (testerModal.classList.contains('hidden')) {
        testerModal.classList.remove('hidden');
        if (testerInput) testerInput.focus();
    } else {
        testerModal.classList.add('hidden');
        if (testerIframe) testerIframe.src = 'about:blank'; // reset
        setTesterStatus('ready');
    }
}

function runTester() {
    let url = testerInput.value.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
        testerInput.value = url;
    }

    setTesterStatus('loading');
    testerIframe.src = 'about:blank';
    setTimeout(() => {
        testerIframe.src = url;
        setTesterStatus('success', 'CHECK PREVIEW');

        testerIframe.onload = () => {
            console.log("Tester iframe loaded");
        };
        testerIframe.onerror = () => {
            setTesterStatus('error');
        }
    }, 100);
}

function setupEventListeners() {
    if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);

    window.addEventListener('popstate', () => {
        applyUrlStateFromLocation({ replaceHistory: true });
    });

    // Close mobile menu when backdrop is clicked
    const backdrop = document.getElementById('mobile-backdrop');
    if (backdrop) backdrop.addEventListener('click', toggleMobileMenu);

    const logoLink = document.querySelector('aside > a');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal({ updateUrl: false });
            closeAboutModal({ updateUrl: false });
            loadCollection('Home');
            if (window.innerWidth < 768 && isMobileMenuOpen) {
                toggleMobileMenu();
            }
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    if (closeRawHtml) closeRawHtml.addEventListener('click', () => {
        rawHtmlContainer.classList.add('hidden');
    });

    if (aboutClose) aboutClose.addEventListener('click', closeAboutModal);
    if (aboutOverlay) aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay || e.target.id === 'about-wrapper') closeAboutModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (rawHtmlContainer && !rawHtmlContainer.classList.contains('hidden')) {
                rawHtmlContainer.classList.add('hidden');
            } else if (testerModal && !testerModal.classList.contains('hidden')) {
                toggleTester();
            } else {
                closeModal();
                closeAboutModal();
            }
        }
    });

    // Tester Listeners
    if (testerToggle) {
        testerToggle.addEventListener('click', toggleTester);
        testerClose.addEventListener('click', toggleTester);
        testerBtn.addEventListener('click', runTester);
        testerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') runTester();
        });
        // Close on backdrop click
        if (testerModal) {
            testerModal.addEventListener('click', (e) => {
                if (e.target === testerModal) toggleTester();
            });
        }
    }
}

// Run
init();
