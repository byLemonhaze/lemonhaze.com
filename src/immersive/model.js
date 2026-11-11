import { selectedWorks, printPreviews } from '../curation/selection.js';
import { displayPreview } from '../curation/preview-images.js';
import { getArtworkImageSrc } from '../renderers/gallery.js';
import { prependCollectionLeadArtworks, COLLECTION_LEAD_ARTWORK_IDS } from '../app/collection-flow.js';
import { CHRONOLOGY_BY_YEAR } from '../data.js';

export function createExperienceCatalog(artworks) {
    const membership = new Map(Object.entries(COLLECTION_LEAD_ARTWORK_IDS).flatMap(([name,ids])=>ids.map(id=>[id,name])));
    // Collection parents live under Provenance in the legacy catalogue. In the
    // immersive rail they belong to the collection they introduce, even when selected.
    const all = [...artworks, ...printPreviews].map(work=>membership.has(work.id)
        ? {...work,collection:membership.get(work.id),sourceCollection:work.collection} : work);
    const byId = new Map(all.map(work => [work.id, work]));
    return {
        all, byId,
        selected: selectedWorks(artworks).map(work => byId.get(work.id)),
        collection(work) {
            if (!work?.collection) return work ? [work] : [];
            return prependCollectionLeadArtworks({
                items: all.filter(item => item.collection === work.collection),
                collectionName: work.collection, allArtworks: all,
            });
        },
    };
}
export const previewSource = work => displayPreview(getArtworkImageSrc(work));
export const workYear = work => work.year || Object.entries(CHRONOLOGY_BY_YEAR)
    .find(([, names]) => names.includes(work.collection))?.[0] || '';
export function viewingMode(url) {
    const explicit = url.searchParams.get('view');
    if (['explore', 'gallery', 'website'].includes(explicit)) return explicit;
    const legacy = ['c', 'collection', 'name', 's', 'section', 'a', 'id'].some(key => url.searchParams.has(key));
    return ['/', '/index.html'].includes(url.pathname) && !legacy ? 'explore' : 'website';
}
export function immersiveUrl(mode, work = null) {
    const url = new URL('/', 'https://lemonhaze.com');
    url.searchParams.set('view', mode);
    if (work) url.searchParams.set('work', work.id);
    return url.pathname + url.search;
}
