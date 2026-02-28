import { ROUTE_KEYS, LEGACY_ROUTE_KEYS } from './constants.js';

export function createRouter({ normalizeSectionKey, resolveCollectionParam, toCollectionSlug, getIsApplyingUrlState }) {
    const getRouteStateFromUrl = () => {
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
    };

    const buildUrlWithState = (overrides = {}) => {
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
        allRouteKeys.forEach((key) => params.delete(key));

        const collectionSlug = toCollectionSlug(nextRouteState.collection);
        if (collectionSlug) params.set(ROUTE_KEYS.collection, collectionSlug);
        if (nextRouteState.section) params.set(ROUTE_KEYS.section, nextRouteState.section);
        if (nextRouteState.artwork) params.set(ROUTE_KEYS.artwork, nextRouteState.artwork);
        if (nextRouteState.collector) params.set(ROUTE_KEYS.collector, nextRouteState.collector);

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
    toCollectionSlug,
    resolveCollectionName,
    loadCollection,
    openArtworkById,
    closeModal,
    openSection,
    closeAboutModal,
    loadCollectorGallery,
    appState,
}) {
    const { replaceHistory = true } = options;
    const routeState = router.getRouteStateFromUrl();

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

    if (!collector && !id && section && collection) {
        normalizedOverrides.collection = null;
        shouldNormalizeUrl = true;
    }

    if (id && !collection) {
        const linkedArtwork = allArtworks.find((item) => item.id === id);
        if (linkedArtwork?.collection) {
            collection = resolveCollectionName(linkedArtwork.collection);
            normalizedOverrides.collection = collection;
            shouldNormalizeUrl = true;
        }
    } else if (id && collection) {
        const linkedArtwork = allArtworks.find((item) => item.id === id);
        const artworkCollection = resolveCollectionName(linkedArtwork?.collection);
        if (artworkCollection && collection !== artworkCollection) {
            collection = artworkCollection;
            normalizedOverrides.collection = artworkCollection;
            shouldNormalizeUrl = true;
        }
    }

    const hasDeepLink = Boolean(collector || collection || section || id);

    appState.isApplyingUrlState = true;
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
        appState.isApplyingUrlState = false;
    }

    if (shouldNormalizeUrl) {
        router.syncUrlState(normalizedOverrides, { replaceHistory });
    }

    return hasDeepLink;
}
