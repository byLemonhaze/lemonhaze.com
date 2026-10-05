const BASE_COLLECTION_BUTTON_CLASS =
    'w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 text-white/45 hover:text-white';
const ACTIVE_COLLECTION_BUTTON_CLASS =
    'w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 text-white font-bold';
export const COLLECTION_LEAD_ARTWORK_IDS = {
    Confabulation: ['788df6ca0f6fc0ddf32b363c4571dd77c42cdf1367365575815452dd050d2b86i0'],
    Chrysalis: ['fad67cc80b7b3560c0cc2c783d914ded158fcbda10ebba4fdee89b85ab4e290ci0'],
    'Into The Wild': ['a7a29fda9317c0689b6cebba74ef9381e46fc783f073619643a0ec6f28edd49bi0'],
    'Tin Box of Solitude': ['3664bb4f033e06f53dff3a42952311b20a7622023bbc77ef0954d8dde6463460i0'],
    'BEST BEFORE': ['bcf16735647186ef853dedd820c9319e9895f99bfddedcfb782ace38093bb8fbi0'],
    Griffintown: ['93bb1c5eb9e48f2efdd200d35339f0a8ad2c261bcf784f40ea83d165b90cfbbci0'],
    Liminality: ['a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0'],
};

export function updateSidebarActiveState({ collectionsNav, activeBtn }) {
    if (!collectionsNav) return;

    const allButtons = collectionsNav.querySelectorAll('[data-collection]');
    allButtons.forEach((button) => {
        button.className = BASE_COLLECTION_BUTTON_CLASS;
    });

    if (activeBtn) {
        activeBtn.className = ACTIVE_COLLECTION_BUTTON_CLASS;
    }
}

export function syncSidebarActiveCollection({ collectionsNav, collectionName }) {
    if (!collectionsNav) return;
    const allButtons = Array.from(collectionsNav.querySelectorAll('[data-collection]'));
    const activeBtn = allButtons.find((btn) => btn.dataset.collection === collectionName) || null;
    updateSidebarActiveState({ collectionsNav, activeBtn });
    if (activeBtn) {
        const allWorks = collectionsNav.closest('details');
        if (allWorks) allWorks.open = true;
        const yearList = activeBtn.closest('[data-year-list]');
        const toggle = collectionsNav.querySelector(`[data-year-toggle="${yearList?.dataset.yearList}"]`);
        if (toggle?.getAttribute('aria-expanded') === 'false') toggle.click();
    }
}

export function prependCollectionLeadArtworks({ items, collectionName, allArtworks }) {
    const leadIds = COLLECTION_LEAD_ARTWORK_IDS[collectionName];
    if (!Array.isArray(leadIds) || leadIds.length === 0) return items;

    const artworksById = new Map(allArtworks.map((item) => [item.id, item]));
    const prependedIds = new Set();
    const leadItems = leadIds
        .map((id) => artworksById.get(id))
        .filter((item) => item && !prependedIds.has(item.id) && prependedIds.add(item.id));

    if (leadItems.length === 0) return items;

    const remainingItems = items.filter((item) => !prependedIds.has(item.id));
    return [...leadItems, ...remainingItems];
}

export function loadCollectionFlow({
    name,
    options = {},
    appState,
    resolveCollectionName,
    syncSidebarActiveCollection: syncActiveCollection,
    updateHeader,
    syncUrlState,
    contentArea,
    allArtworks,
    renderHome,
    renderGallery,
}) {
    const { updateUrl = true, replaceHistory = false } = options;

    if (appState.homeInterval) clearInterval(appState.homeInterval);
    const resolvedName = resolveCollectionName(name) || 'Home';

    appState.activeArtworkId = null;
    appState.activeSectionKey = null;
    appState.currentFilter = resolvedName;

    syncActiveCollection(resolvedName === 'Home' ? null : resolvedName);
    updateHeader(resolvedName);

    if (updateUrl) {
        syncUrlState(
            {
                collection: resolvedName === 'Home' ? null : resolvedName,
                artwork: null,
                section: null,
            },
            { replaceHistory }
        );
    }

    if (resolvedName === 'Home') {
        if (contentArea) contentArea.style.overflowY = 'hidden';
        renderHome();
        return;
    }

    if (contentArea) contentArea.style.overflowY = 'auto';

    let filtered = allArtworks.filter((item) => item.collection === resolvedName);
    if (filtered.length === 0) {
        filtered = allArtworks.filter(
            (item) => (item.collection || '').toLowerCase() === resolvedName.toLowerCase()
        );
    }

    filtered = prependCollectionLeadArtworks({
        items: filtered,
        collectionName: resolvedName,
        allArtworks,
    });

    renderGallery(filtered);
}

// Parent badges describe this gallery, not every lineage across the catalogue.
export function buildGalleryParentIds(items) {
    const displayed = new Set(items.map(item => item.id));
    const ids = new Set(items.filter(item => item.role === 'parent').map(item => item.id));
    for (const item of items) {
        if (typeof item.provenance !== 'string') continue;
        for (const id of item.provenance.split(/[\s,]+/)) {
            if (/^[a-f0-9]{64}i\d+$/.test(id) && displayed.has(id)) ids.add(id);
        }
    }
    return ids;
}
