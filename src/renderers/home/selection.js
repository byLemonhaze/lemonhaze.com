import { selectedWorks, CAROUSEL_WORK_IDS } from '../../curation/selection.js';

// A collection state, not an additional inscription or selected individual work.
export const EXPIRED_SLIDE = {
    id: 'best-before-expired',
    name: 'EXPIRED',
    collection: 'BEST BEFORE',
    year: '2025',
    href: '/best-before',
    grid_preview: '/editorial/assets/best-before-expired.jpeg',
};

export function buildHomeSelection({ artworks }) {
    const selection = selectedWorks(artworks, CAROUSEL_WORK_IDS);
    selection.splice(Math.min(7, selection.length), 0, { ...EXPIRED_SLIDE });
    return selection;
}
