import {
    fetchProvenance,
    CHRONOLOGY_BY_YEAR,
    ABOUT_LEMONHAZE_TEXT,
    CAREER_HIGHLIGHTS_ITEMS,
    COL_DESCRIPTIONS,
    ORDINALS_SUPPLY_DATA,
    ETH_SUPPLY_DATA,
    MARKET_LINKS,
    LINK_OVERRIDES,
    MEDIA_ITEMS,
} from '../data.js';
import { appState } from '../state/store.js';
import { createRouter } from '../router/index.js';
import { ROUTE_KEYS } from '../router/constants.js';
import { createCollectionResolver } from '../data/collections.js';
import {
    loadCollectionFlow,
    syncSidebarActiveCollection as syncSidebarActiveCollectionFromNav,
} from './collection-flow.js';
import { createSectionFlow } from './section-flow.js';
import { el, refreshElements as refreshDomElements } from '../ui/elements.js';
import { setLoadingIndicator } from '../ui/loading.js';
import { updateHeaderView } from '../ui/header.js';
import { toggleMobileSidebar } from '../ui/menu.js';
import { createTesterController } from '../ui/tester.js';
import { getArtworkImageSrc, renderGalleryGrid } from '../renderers/gallery.js';
import { renderSidebarSections } from '../renderers/sidebar.js';
import { createArtworkModalController } from '../renderers/modal/artwork.js';
import { setupAppEventListeners } from '../events/index.js';
import { loadCollectorGallerySection } from '../renderers/sections/collectors.js';
import { renderSectionView } from '../renderers/sections/view.js';
import {
    createInternalSections,
    normalizeSectionKey as normalizeSection,
} from '../renderers/sections/index.js';
import { renderHomeView } from '../renderers/home.js';

// DOM Elements (fetched on demand or in init)
let sidebar, collectionsNav, contentArea, galleryGrid, currentViewTitle, currentViewMeta, loadingIndicator, menuToggle;
let modalOverlay, modalClose, modalImage, modalIframe, modalTitle, modalMetadata, modalActions;
let rawHtmlContainer, rawHtmlContent, closeRawHtml;
let aboutOverlay, aboutTitle, aboutContent, aboutClose;
let refreshBtn;
let testerToggle, testerModal, testerClose, testerInput, testerBtn, testerIframe, testerStatusDot, testerStatusText;
let testerController = {
    toggleTester: () => {},
    runTester: () => {},
};

function refreshElements() {
    const refs = refreshDomElements();
    sidebar = refs.sidebar;
    collectionsNav = refs.collectionsNav;
    contentArea = refs.contentArea;
    galleryGrid = refs.galleryGrid;
    currentViewTitle = refs.currentViewTitle;
    currentViewMeta = refs.currentViewMeta;
    loadingIndicator = refs.loadingIndicator;
    menuToggle = refs.menuToggle;
    refreshBtn = refs.refreshBtn;
    modalOverlay = refs.modalOverlay;
    modalClose = refs.modalClose;
    modalImage = refs.modalImage;
    modalIframe = refs.modalIframe;
    modalTitle = refs.modalTitle;
    modalMetadata = refs.modalMetadata;
    modalActions = refs.modalActions;
    rawHtmlContainer = refs.rawHtmlContainer;
    rawHtmlContent = refs.rawHtmlContent;
    closeRawHtml = refs.closeRawHtml;
    aboutOverlay = refs.aboutOverlay;
    aboutTitle = refs.aboutTitle;
    aboutContent = refs.aboutContent;
    aboutClose = refs.aboutClose;
    testerToggle = refs.testerToggle;
    testerModal = refs.testerModal;
    testerClose = refs.testerClose;
    testerInput = refs.testerInput;
    testerBtn = refs.testerBtn;
    testerIframe = refs.testerIframe;
    testerStatusDot = refs.testerStatusDot;
    testerStatusText = refs.testerStatusText;

    testerController = createTesterController({
        testerModal,
        testerInput,
        testerIframe,
        testerStatusDot,
        testerStatusText,
    });
}

const collections = createCollectionResolver({
    chronologyByYear: CHRONOLOGY_BY_YEAR,
    getArtworks: () => appState.artworks,
});

const { slugifyCollectionName, rebuildCollectionSlugs, resolveCollectionName, resolveCollectionParam, toCollectionSlug } = collections;
const INTERNAL_SECTIONS = createInternalSections({
    aboutText: ABOUT_LEMONHAZE_TEXT,
    careerHighlightsItems: CAREER_HIGHLIGHTS_ITEMS,
    ordinalsSupplyData: ORDINALS_SUPPLY_DATA,
    marketLinks: MARKET_LINKS,
    linkOverrides: LINK_OVERRIDES,
    mediaItems: MEDIA_ITEMS,
    routeKeys: ROUTE_KEYS,
    toCollectionSlug,
    slugifyCollectionName,
});
const normalizeSectionKey = (value) => normalizeSection(value, INTERNAL_SECTIONS);
const router = createRouter({
    normalizeSectionKey,
    resolveCollectionParam,
    toCollectionSlug,
    getIsApplyingUrlState: () => appState.isApplyingUrlState,
});
const sectionFlow = createSectionFlow({
    appState,
    internalSections: INTERNAL_SECTIONS,
    normalizeSectionKey,
    resolveCollectionName,
    getArtworkImageSrc,
    openMetacard,
    loadCollection,
    closeModal,
    openAboutModal,
    router,
    toCollectionSlug,
    closeAboutModal,
    loadCollectorGallery,
});
let hasStarted = false;
let sectionReturnState = null;

function syncSidebarActiveCollection(collectionName) {
    syncSidebarActiveCollectionFromNav({
        collectionsNav,
        collectionName,
    });
}

function openArtworkById(id, options = {}) {
    return sectionFlow.openArtworkById(id, options);
}

function openSection(sectionKey, options = {}) {
    return sectionFlow.openSection(sectionKey, options);
}

async function applyUrlStateFromLocation(options = {}) {
    return sectionFlow.applyUrlStateFromLocation(options);
}

// Initialization
async function init() {
    refreshElements();
    setLoading(true);
    renderSidebar();

    appState.artworks = await fetchProvenance();
    rebuildCollectionSlugs();

    const hasDeepLink = await applyUrlStateFromLocation({ replaceHistory: true });
    if (!hasDeepLink) {
        loadCollection('Home', { updateUrl: false });
    }

    setLoading(false);

    setupEventListeners();
}

function startCollectorSearch() {
    const input = el.collectorSearchInput();
    if (!input || !input.value.trim()) return;
    const addr = input.value.trim();
    closeAboutModal({ updateUrl: false });
    loadCollectorGallery(addr);
}

async function loadCollectorGallery(address, options = {}) {
    await loadCollectorGallerySection({
        address,
        options,
        appState,
        contentArea,
        currentViewMeta,
        setLoading,
        syncSidebarActiveCollection,
        updateHeader,
        renderGallery,
        syncUrlState: router.syncUrlState,
        allArtworks: appState.artworks,
        galleryGrid,
    });
}

// ---------------------------------------------------------
// Rendering Side
// ---------------------------------------------------------

function renderSidebar() {
    renderSidebarSections({
        topNav: el.topNavSection(),
        collectionsNav,
        internalSections: INTERNAL_SECTIONS,
        chronologyByYear: CHRONOLOGY_BY_YEAR,
        currentFilter: appState.currentFilter,
        onOpenSection: (sectionKey) => openSection(sectionKey),
        onOpenExternal: (url) => window.open(url, '_blank'),
        onLoadCollection: (collectionName) => loadCollection(collectionName),
        onAfterSelect: () => {
            if (window.innerWidth < 768) {
                toggleMobileMenu();
            }
        },
    });
}

function loadCollection(name, options = {}) {
    loadCollectionFlow({
        name,
        options,
        appState,
        resolveCollectionName,
        syncSidebarActiveCollection,
        updateHeader,
        syncUrlState: router.syncUrlState,
        contentArea,
        allArtworks: appState.artworks,
        renderHome,
        renderGallery,
    });
}

function updateHeader(title) {
    updateHeaderView({
        title,
        headerElement: document.querySelector('header'),
        currentViewTitle,
        currentViewMeta,
        refreshBtn,
        appState,
        allArtworks: appState.artworks,
        collectionDescriptions: COL_DESCRIPTIONS,
        chronologyByYear: CHRONOLOGY_BY_YEAR,
        onRefreshCollection: (collectionName) => loadCollection(collectionName),
    });
}

function renderHome() {
    renderHomeView({
        galleryGrid,
        appState,
        hasCarouselStyles: () => Boolean(el.carouselStyles()),
        artworks: appState.artworks,
        chronologyByYear: CHRONOLOGY_BY_YEAR,
        onOpenArtworkById: openArtworkById,
        getArtworkImageSrc,
    });
}
function renderGallery(items) {
    renderGalleryGrid(items, {
        galleryGrid,
        contentArea,
        onOpenArtworkById: openArtworkById,
    });
}

// ---------------------------------------------------------
// Metacard Logic (New Modal)
// ---------------------------------------------------------

function getArtworkModalRefs() {
    return {
        modalOverlay,
        modalImage,
        modalIframe,
        modalTitle,
        modalMetadata,
        modalActions,
        rawHtmlContainer,
        rawHtmlContent,
    };
}

const artworkModalController = createArtworkModalController({
    refs: getArtworkModalRefs,
    appState,
    router,
    resolveCollectionName,
    getArtworkImageSrc,
    getAllArtworks: () => appState.artworks,
    getMetaOwner: el.metaOwner,
    closeAboutModal: (options) => closeAboutModal(options),
});

function openMetacard(item, imgSrc, isHtml, options = {}) {
    artworkModalController.openMetacard(item, imgSrc, isHtml, options);
}

function closeModal(options = {}) {
    artworkModalController.closeModal(options);
}

function goToCollector(addr) {
    closeAboutModal({ updateUrl: false });
    closeModal({ updateUrl: false });
    loadCollectorGallery(addr);
}

// ---------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------

function getSectionModalRefs() {
    return { aboutTitle, aboutContent, aboutOverlay };
}

function openAboutModal(title, content, options = {}) {
    const { updateUrl = true, replaceHistory = false, sectionKey = null } = options;

    if (!appState.activeSectionKey) {
        sectionReturnState = {
            collector: appState.activeCollectorAddress || null,
            collection: appState.currentFilter || 'Home',
        };
    }

    appState.activeCollectorAddress = null;
    appState.activeArtworkId = null;

    if (sectionKey !== null) {
        appState.activeSectionKey = normalizeSectionKey(sectionKey);
    }

    const { aboutOverlay } = getSectionModalRefs();
    if (aboutOverlay && !aboutOverlay.classList.contains('hidden')) {
        aboutOverlay.classList.add('opacity-0');
        aboutOverlay.classList.add('hidden');
    }

    renderSectionView({
        title,
        content,
        headerElement: document.querySelector('header'),
        galleryGrid,
        contentArea,
        currentViewTitle,
        currentViewMeta,
        refreshBtn,
    });

    if (updateUrl && appState.activeSectionKey) {
        router.syncUrlState({
            section: appState.activeSectionKey,
            artwork: null,
            collector: null,
            collection: null,
        }, { replaceHistory });
    }
}

function closeAboutModal(options = {}) {
    const { updateUrl = true, replaceHistory = false, restoreView = updateUrl } = options;
    const { aboutOverlay } = getSectionModalRefs();

    const hadSection = Boolean(appState.activeSectionKey);
    appState.activeSectionKey = null;

    if (updateUrl && hadSection) {
        router.syncUrlState({ section: null }, { replaceHistory });
    }

    if (aboutOverlay && !aboutOverlay.classList.contains('hidden')) {
        aboutOverlay.classList.add('opacity-0');
        setTimeout(() => {
            aboutOverlay.classList.add('hidden');
        }, 300);
    }

    if (!hadSection || !restoreView) return;

    const returnState = sectionReturnState;
    sectionReturnState = null;

    if (returnState?.collector) {
        loadCollectorGallery(returnState.collector, { updateUrl: false }).catch(() => {
            loadCollection('Home', { updateUrl: false });
        });
        return;
    }

    const fallbackCollection = returnState?.collection || 'Home';
    const targetCollection = fallbackCollection.startsWith('Collector:') ? 'Home' : fallbackCollection;
    loadCollection(targetCollection, { updateUrl: false });
}

function setLoading(isLoading) {
    setLoadingIndicator(loadingIndicator, isLoading);
}

function toggleMobileMenu() {
    toggleMobileSidebar({
        appState,
        sidebar,
        mobileBackdrop: el.mobileBackdrop,
    });
}

function setupEventListeners() {
    setupAppEventListeners({
        menuToggle,
        toggleMobileMenu,
        applyUrlStateFromLocation,
        mobileBackdrop: el.mobileBackdrop,
        closeModal,
        closeAboutModal,
        loadCollection,
        isMobileMenuOpen: () => appState.isMobileMenuOpen,
        modalClose,
        modalOverlay,
        closeRawHtml,
        rawHtmlContainer,
        aboutClose,
        aboutOverlay,
        testerToggle,
        testerClose,
        testerBtn,
        testerInput,
        testerModal,
        toggleTester: testerController.toggleTester,
        runTester: testerController.runTester,
    });
}

function bindGlobalHelpers() {
    window.__openProvenance = (pid, options = {}) => {
        openArtworkById(pid, options);
    };

    window.__startCollectorSearch = () => {
        startCollectorSearch();
    };

    window.__gotoCollector = (addr) => {
        goToCollector(addr);
    };
}

export async function startApp() {
    if (hasStarted) return;
    hasStarted = true;

    bindGlobalHelpers();
    await init();
}
