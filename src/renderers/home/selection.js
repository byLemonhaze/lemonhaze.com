import { selectedWorks, CAROUSEL_WORK_IDS } from '../../curation/selection.js';
import { ARTWORKS } from '../../../shared/shop-artworks.js';

export function buildHomeSelection({ artworks }) {
    const prints = ARTWORKS.map(work => ({
        id: `shop-${work.id}`,
        name: work.title,
        grid_preview: work.preview,
        href: '/shop',
        palette: work.series,
    }));
    return selectedWorks([...artworks, ...prints], CAROUSEL_WORK_IDS);
}
