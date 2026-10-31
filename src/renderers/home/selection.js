import { selectedWorks } from '../../curation/selection.js';

export function buildHomeSelection({ artworks }) {
    return selectedWorks(artworks);
}
