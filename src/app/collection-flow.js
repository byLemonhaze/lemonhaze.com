const BASE_COLLECTION_BUTTON_CLASS =
    'w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 border-l-2 border-transparent text-white/45 hover:text-white';
const ACTIVE_COLLECTION_BUTTON_CLASS =
    'w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 border-l-2 border-white text-white font-bold';

export function updateSidebarActiveState({ collectionsNav, activeBtn }) {
    if (!collectionsNav) return;

    const allButtons = collectionsNav.querySelectorAll('button');
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

    appState.activeCollectorAddress = null;
    appState.activeArtworkId = null;
    appState.activeSectionKey = null;
    appState.currentFilter = resolvedName;

    syncActiveCollection(resolvedName === 'Home' ? null : resolvedName);
    updateHeader(resolvedName);

    if (updateUrl) {
        syncUrlState(
            {
                collection: resolvedName === 'Home' ? null : resolvedName,
                collector: null,
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

    renderGallery(filtered);
}
