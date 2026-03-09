import { buildCanonicalPath, parseRouteUrl, stripRouteSearchParams } from './path-state.js';

export function createRouter({
    normalizeSectionKey,
    resolveCollectionParam,
    resolveCollectionPathToken,
    toCollectionSlug,
    getIsApplyingUrlState,
}) {
    const getRouteStateFromUrl = () => {
        return parseRouteUrl(new URL(window.location.href), {
            normalizeSectionKey,
            resolveCollectionParam,
            resolveCollectionPathToken,
            toCollectionSlug,
        });
    };

    const buildUrlWithState = (overrides = {}) => {
        const url = new URL(window.location.href);
        const currentRouteState = getRouteStateFromUrl();
        const nextRouteState = { ...currentRouteState, ...overrides };
        const params = stripRouteSearchParams(new URLSearchParams(url.search));
        url.pathname = buildCanonicalPath({
            collection: nextRouteState.collection,
            section: nextRouteState.section,
            artwork: nextRouteState.artwork,
            toCollectionSlug,
        });
        url.search = params.toString();
        return url;
    };

    const syncUrlState = (overrides = {}, options = {}) => {
        if (getIsApplyingUrlState()) return;

        const { replaceHistory = false } = options;
        const nextUrl = buildUrlWithState(overrides);
        const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

        if (next === current) return;

        const historyMethod = replaceHistory ? 'replaceState' : 'pushState';
        window.history[historyMethod]({}, '', next);
    };

    return {
        getRouteStateFromUrl,
        buildUrlWithState,
        syncUrlState,
    };
}

export async function applyRouteFromLocation({
    router,
    options = {},
    allArtworks,
    resolveCollectionName,
    loadCollection,
    openArtworkById,
    closeModal,
    openSection,
    closeAboutModal,
    appState,
}) {
    const { replaceHistory = true } = options;
    const routeState = router.getRouteStateFromUrl();
    const section = routeState.section;
    const id = routeState.artwork;
    const collection = routeState.collection;

    let shouldNormalizeUrl = routeState.hasQueryRouteParams || routeState.hasUnsupportedPath || routeState.hasNonCanonicalPath;
    const normalizedState = {
        collection,
        section,
        artwork: id,
    };

    const linkedArtwork = id
        ? allArtworks.find((item) => String(item.id || '').trim() === id)
        : null;
    const artworkCollection = resolveCollectionName(linkedArtwork?.collection);
    const fallbackCollection = collection || null;

    if (id) {
        normalizedState.section = null;
        normalizedState.collection = null;
        if (!artworkCollection) {
            normalizedState.artwork = null;
            normalizedState.collection = fallbackCollection;
            shouldNormalizeUrl = true;
        }
    } else if (section) {
        normalizedState.collection = null;
    }

    const hasDeepLink = Boolean(normalizedState.collection || normalizedState.section || normalizedState.artwork);

    appState.isApplyingUrlState = true;
    try {
        if (normalizedState.artwork) {
            loadCollection(artworkCollection || 'Home', { updateUrl: false });
            const opened = openArtworkById(normalizedState.artwork, { updateUrl: false, ensureCollection: true });
            if (!opened) {
                normalizedState.artwork = null;
                normalizedState.collection = fallbackCollection;
                shouldNormalizeUrl = true;
                closeModal({ updateUrl: false });
                closeAboutModal({ updateUrl: false });
                loadCollection(fallbackCollection || 'Home', { updateUrl: false });
            } else {
                closeAboutModal({ updateUrl: false });
            }
        } else if (normalizedState.section) {
            closeModal({ updateUrl: false });
            openSection(normalizedState.section, { updateUrl: false });
        } else {
            closeModal({ updateUrl: false });
            closeAboutModal({ updateUrl: false });
            loadCollection(normalizedState.collection || 'Home', { updateUrl: false });
        }
    } finally {
        appState.isApplyingUrlState = false;
    }

    if (shouldNormalizeUrl) {
        router.syncUrlState(normalizedState, { replaceHistory });
    }

    return hasDeepLink;
}
