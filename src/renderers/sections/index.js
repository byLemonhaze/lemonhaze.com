import { createArchive, enhanceAbout, enhanceHighlights, createExplorePractice, createEditorialPage, readingLink } from '../../editorial/index.js';
import { createCareerHighlightsNode } from './highlights.js';
import { createSupplySectionNode } from './supply.js';
import { createMediaSectionNode } from './media.js';
import { createBlogSectionNode } from './blog.js';
import { createProjectsSectionNode } from './projects.js';

export function createInternalSections({
    getArtworks = () => [],
    aboutText,
    careerHighlightsItems,
    ordinalsSupplyData,
    extraOrdinalsSupplyData,
    ethSupplyData,
    marketLinks,
    linkOverrides,
    physicalWorksItems,
    mediaItems,
    blogPosts,
    toCollectionSlug,
    slugifyCollectionName,
}) {
    return {
        about: {
            label: 'About',
            title: 'About',
            content: () => enhanceAbout(aboutText),
        },
        highlights: {
            label: 'Career Highlights',
            title: 'Career Highlights',
            content: () => enhanceHighlights(createCareerHighlightsNode(careerHighlightsItems)),
        },
        explore: {
            label: 'Explore the practice', title: 'Explore the practice',
            content: () => createExplorePractice(getArtworks(), toCollectionSlug),
        },
        archive: {
            label: 'Archive', title: 'Archive',
            content: () => createArchive(getArtworks(), toCollectionSlug),
        },
        practice: {
            label: 'Practice & Process', title: 'Practice & Process',
            content: () => createEditorialPage('practice'),
        },
        'paint-engine': {
            label: 'Paint Engine', title: 'Paint Engine',
            content: () => createEditorialPage('paint-engine'),
        },
        collecting: {
            label: 'Viewing & Collecting', title: 'Viewing & Collecting',
            content: () => createEditorialPage('collecting'),
        },
        supply: {
            label: 'Supply & Marketplace',
            title: 'Supply & Marketplace',
            content: () => {
                const wrap = document.createElement('div');
                wrap.appendChild(readingLink('/collecting', 'Viewing & collecting →', 'A guide to exploring, displaying, and inquiring about a work.'));
                wrap.appendChild(createSupplySectionNode({
                artworks: getArtworks(),
                ordinalsSupplyData,
                extraOrdinalsSupplyData,
                ethSupplyData,
                marketLinks,
                linkOverrides,
                physicalWorksItems,
                toCollectionSlug,
                slugifyCollectionName,
            }));
                return wrap;
            },
        },
        media: {
            label: 'Media & Press',
            title: 'Media & Press',
            content: () => createMediaSectionNode(mediaItems),
        },
        blog: {
            label: 'Blog',
            title: 'Blog',
            content: () => createBlogSectionNode(blogPosts),
        },
        lab: {
            label: 'Lab',
            title: 'Lab',
            content: () => {
                const wrap = document.createElement('div');
                wrap.append(readingLink('/paint-engine', 'Explore the paint engine →', 'An evolving tool: process, inscribed milestones, and an interactive study.'), createProjectsSectionNode());
                return wrap;
            },
        },
    };
}

export function normalizeSectionKey(value, internalSections) {
    if (!value) return null;
    const key = String(value).trim().toLowerCase();
    return internalSections[key] ? key : null;
}
