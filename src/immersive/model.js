import ethereumWorks from '../data/ethereum-works.json' with {type:'json'};
import {pixelOriginalSource} from '../data/pixel-art.js';
import { selectedWorks, printPreviews } from '../curation/selection.js';
import { displayPreview } from '../curation/preview-images.js';
import { getArtworkImageSrc } from '../renderers/gallery.js';
import { prependCollectionLeadArtworks, COLLECTION_LEAD_ARTWORK_IDS } from '../app/collection-flow.js';
import { CHRONOLOGY_BY_YEAR } from '../data.js';
import { collectionChronology } from '../utils/collection-chronology.js';
import { uniqueOriginals, artworkYear, originalFor, isExploreWork } from './roster.js';
import previewManifest from './preview-manifest.json' with { type: 'json' };

export function createExperienceCatalog(artworks) {
    const membership = new Map(Object.entries(COLLECTION_LEAD_ARTWORK_IDS).flatMap(([name,ids])=>ids.map(id=>[id,name])));
    // Collection parents live under Provenance in the legacy catalogue. In the
    // immersive rail they belong to the collection they introduce, even when selected.
    const all = [...artworks, ...printPreviews, ...ethereumWorks.filter(work=>work.listed!==false)].map(work=>membership.has(work.id)
        ? {...work,collection:membership.get(work.id),sourceCollection:work.collection} : work);
    const byId = new Map(all.map(work => [work.id, work]));
    const selected = selectedWorks(artworks).map(work => byId.get(work.id));
    const catalog = {
        all, byId, selected,
        original:work=>originalFor(work,byId)||work,
        collection(work) {
            if(work?.collection==='Provenance')return [work];
            if (!work?.collection) return work ? [work] : [];
            return prependCollectionLeadArtworks({
                items: all.filter(item => item.collection === work.collection),
                collectionName: work.collection, allArtworks: all,
            });
        },
    };
    // Keep the original eight at the centre; everything else is laid out radially.
    // Colors currently contains four unpublished LATER placeholders, not display-ready art.
    catalog.explore = uniqueOriginals([...selected,...all.filter(isExploreWork)],byId).filter(isExploreWork);
    const pinned = ['Gentlemen', 'Impossible Folds', 'Montreal', 'BEST BEFORE'];
    const collectionDates = new Map([...new Set(all.map(work=>work.collection))].map(name=>{
        const date=collectionChronology(name,all)||0;
        const year=Number(Object.entries(CHRONOLOGY_BY_YEAR).find(([,names])=>names.includes(name))?.[0])
            || (date?new Date(date).getUTCFullYear():Math.max(0,...all.filter(work=>work.collection===name).map(artworkYear)));
        return [name,{year,date}];
    }));
    const compareCollections=(a,b)=>{
        const rank=name=>pinned.includes(name)?pinned.indexOf(name):pinned.length;
        return rank(a)-rank(b)||collectionDates.get(b).year-collectionDates.get(a).year
            ||collectionDates.get(b).date-collectionDates.get(a).date||a.localeCompare(b);
    };
    catalog.galleryCollections = new Map([['Selected works',selected], ...[...new Set(all.map(work=>work.collection))]
        .filter(name=>name!=='Colors'&&name!=='Provenance').sort(compareCollections)
        .map(name=>[name,uniqueOriginals(catalog.collection(all.find(work=>work.collection===name)),byId)])
        .filter(([,items])=>items.length)]);
    return catalog;
}
export function websiteDestination(work = null) {
    if (!work) return '/?view=website';
    if (work.chain==='Ethereum') return `/?view=website&work=${encodeURIComponent(work.id)}`;
    return work.href ? `${work.href}?view=website&work=${encodeURIComponent(work.id)}` : `/${work.id}?view=website`;
}
export const previewSource = work => work.preview || pixelOriginalSource(work) || (work.id==='d6b1b35b58d873a81f6b8aea3e02cd5a7177e1d86de9ee66adfe006284897d6bi0'
    ? `https://render.ord.net/v9/snapshots/${work.id}/512.webp`
    : displayPreview(getArtworkImageSrc(work)));
export const thumbnailSource = work => pixelOriginalSource(work) || (previewManifest[work.id] ? `/previews/immersive/${work.id}.webp` : previewSource(work));
// Use existing sharp display derivatives where the field is large enough to
// show them. Tiny overview items keep the lightweight archive thumbnails.
export function browsingSource(work,zoom=1,longSide=600) {
    const display=previewSource(work);
    return zoom*longSide>180 && /^\/(?:previews\/|shop\/)/.test(display) ? display : thumbnailSource(work);
}
export const previewDimensions = work => previewManifest[work.id] || null;
export const workYear = work => artworkYear(work) || Object.entries(CHRONOLOGY_BY_YEAR)
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
