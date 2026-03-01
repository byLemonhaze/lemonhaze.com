import { createCareerHighlightsNode } from './highlights.js';
import { createSupplySectionNode } from './supply.js';
import { createMediaSectionNode } from './media.js';

export function createInternalSections({
    aboutText,
    careerHighlightsItems,
    ordinalsSupplyData,
    marketLinks,
    linkOverrides,
    mediaItems,
    routeKeys,
    toCollectionSlug,
    slugifyCollectionName,
}) {
    return {
        about: {
            label: 'About',
            title: 'About',
            content: () => aboutText,
        },
        highlights: {
            label: 'Career Highlights',
            title: 'Career Highlights',
            content: () => createCareerHighlightsNode(careerHighlightsItems),
        },
        supply: {
            label: 'Supply & Marketplace',
            title: 'Supply & Marketplace',
            content: () => createSupplySectionNode({
                ordinalsSupplyData,
                marketLinks,
                linkOverrides,
                routeKeys,
                toCollectionSlug,
                slugifyCollectionName,
            }),
        },
        media: {
            label: 'Media & Press',
            title: 'Media & Press',
            content: () => createMediaSectionNode(mediaItems),
        },
    };
}

export function normalizeSectionKey(value, internalSections) {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    return internalSections[key] ? key : null;
}
