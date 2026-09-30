import { createSelectedWork, createPracticeOverview } from '../../curation/pages.js';
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
        selected: {
            label: 'Selected Work', title: 'Selected Work',
            content: () => createSelectedWork(getArtworks(), toCollectionSlug),
        },
        about: {
            label: 'About',
            title: 'About',
            content: () => enhanceAbout(aboutText),
        },
        highlights: {
            label: 'Exhibitions & Press',
            title: 'Exhibitions & Press',
            content: () => {
                const wrap = document.createElement('div');
                wrap.append(enhanceHighlights(createCareerHighlightsNode(careerHighlightsItems)), readingLink('/media', 'Media & Press →', 'Interviews, articles, and coverage of the work.'));
                return wrap;
            },
        },
        explore: {
            label: 'Practice', title: 'Practice',
            content: () => createPracticeOverview(getArtworks()),
        },
        archive: {
            label: 'Studio Notes', title: 'Studio Notes',
            content: () => createArchive(getArtworks(), toCollectionSlug),
        },
        practice: {
            label: 'Gentleman SE 2025 — Studio Writing', title: 'Gentleman SE 2025 — Studio Writing',
            content: () => createEditorialPage('practice'),
        },
        'paint-engine': {
            label: 'Paint Engine', title: 'Paint Engine',
            content: () => createEditorialPage('paint-engine'),
        },
        collecting: {
            label: 'Collecting', title: 'Collecting',
            content: () => {
                const wrap = document.createElement('div');
                wrap.append(readingLink('/supply', 'Supply & Marketplace →', 'Browse the complete supply and marketplace links.'), readingLink('/supply#market-watch', 'Market Watch →', 'Current listings across the tracked marketplaces.'), createEditorialPage('collecting'));
                return wrap;
            },
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
