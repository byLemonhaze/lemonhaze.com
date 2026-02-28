const ELEMENT_IDS = {
    sidebar: 'sidebar',
    collectionsNav: 'collections-nav',
    contentArea: 'content-area',
    galleryGrid: 'gallery-grid',
    currentViewTitle: 'current-view-title',
    currentViewMeta: 'current-view-meta',
    loadingIndicator: 'loading-indicator',
    menuToggle: 'menu-toggle',
    refreshBtn: 'refresh-btn',
    modalOverlay: 'modal-overlay',
    modalClose: 'modal-close',
    modalImage: 'modal-image',
    modalIframe: 'modal-iframe',
    modalTitle: 'modal-title',
    modalMetadata: 'modal-metadata',
    modalActions: 'modal-actions',
    rawHtmlContainer: 'raw-html-container',
    rawHtmlContent: 'raw-html-content',
    closeRawHtml: 'close-raw-html',
    aboutOverlay: 'about-overlay',
    aboutTitle: 'about-title',
    aboutContent: 'about-content',
    aboutClose: 'about-close',
    testerToggle: 'tester-toggle',
    testerModal: 'tester-modal',
    testerClose: 'tester-close',
    testerInput: 'tester-input',
    testerBtn: 'tester-btn',
    testerIframe: 'tester-iframe',
    testerStatusDot: 'tester-status-dot',
    testerStatusText: 'tester-status-text',
    mobileBackdrop: 'mobile-backdrop',
    topNavSection: 'top-nav-section',
    collectorSearchInput: 'collector-search-input',
    carouselStyles: 'carousel-styles',
    metaOwner: 'meta-owner',
};

const cache = {};

function readByKey(key) {
    const id = ELEMENT_IDS[key];
    if (!id) return null;
    return document.getElementById(id);
}

export const el = Object.fromEntries(
    Object.keys(ELEMENT_IDS).map((key) => [key, () => readByKey(key)])
);

export function refreshElements() {
    Object.keys(ELEMENT_IDS).forEach((key) => {
        cache[key] = readByKey(key);
    });
    return { ...cache };
}
