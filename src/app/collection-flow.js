const BASE_COLLECTION_BUTTON_CLASS =
    'w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 text-white/45 hover:text-white';
const ACTIVE_COLLECTION_BUTTON_CLASS =
    'w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 text-white font-bold';
export const COLLECTION_LEAD_ARTWORK_IDS = {
    'BEST BEFORE': ['bcf16735647186ef853dedd820c9319e9895f99bfddedcfb782ace38093bb8fbi0'],
};

export function updateSidebarActiveState({ collectionsNav, activeBtn }) {
    if (!collectionsNav) return;

    const allButtons = collectionsNav.querySelectorAll('button[data-collection]');
    allButtons.forEach((button) => {
        button.className = BASE_COLLECTION_BUTTON_CLASS;
    });

    if (activeBtn) {
        activeBtn.className = ACTIVE_COLLECTION_BUTTON_CLASS;
    }
}

export function syncSidebarActiveCollection({ collectionsNav, collectionName }) {
    if (!collectionsNav) return;
    const allButtons = Array.from(collectionsNav.querySelectorAll('button[data-collection]'));
    const activeBtn = allButtons.find((btn) => btn.dataset.collection === collectionName) || null;
    updateSidebarActiveState({ collectionsNav, activeBtn });
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
