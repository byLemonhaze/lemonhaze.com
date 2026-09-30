import { selectedWorks, CAROUSEL_WORK_IDS } from '../../curation/selection.js';

export function buildHomeSelection({ artworks }) {
    return selectedWorks(artworks, CAROUSEL_WORK_IDS);
}
