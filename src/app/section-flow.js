import { applyRouteFromLocation } from '../router/index.js';
import { isHtmlArtwork } from '../modules/artwork-media.js';

export function createSectionFlow({
    appState,
    internalSections,
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
}) {
    const openArtworkById = (id, options = {}) => {
        const { updateUrl = true, ensureCollection = false, replaceHistory = false } = options;
        if (!id) return false;

        const target = appState.artworks.find((item) => item.id === id);
        if (!target) return false;

        const targetCollection = resolveCollectionName(target.collection);
        if (ensureCollection && targetCollection && appState.currentFilter !== targetCollection) {
            loadCollection(targetCollection, { updateUrl: false });
        }

        const imgSrc = getArtworkImageSrc(target);
        const isHtml = isHtmlArtwork(target);
        openMetacard(target, imgSrc, isHtml, { updateUrl, replaceHistory });
        return true;
    };

    const openSection = (sectionKey, options = {}) => {
        const { updateUrl = true, replaceHistory = false } = options;
        const normalizedKey = normalizeSectionKey(sectionKey);
        if (!normalizedKey) return false;

        const section = internalSections[normalizedKey];

        closeModal({ updateUrl: false });
        appState.activeArtworkId = null;
        openAboutModal(section.title, section.content(), {
            updateUrl: false,
            sectionKey: normalizedKey,
        });
        appState.activeSectionKey = normalizedKey;

        if (updateUrl) {
            router.syncUrlState(
                {
                    section: normalizedKey,
                    artwork: null,
                    collector: null,
                    collection: null,
                },
                { replaceHistory }
            );
        }

        return true;
    };

    const applyUrlStateFromLocation = async (options = {}) => {
        return applyRouteFromLocation({
            router,
            options,
            allArtworks: appState.artworks,
            toCollectionSlug,
            resolveCollectionName,
            loadCollection,
            openArtworkById,
            closeModal,
            openSection,
            closeAboutModal,
            loadCollectorGallery,
            appState,
        });
    };

    return {
        openArtworkById,
        openSection,
        applyUrlStateFromLocation,
    };
}
