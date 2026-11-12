// Only these catalogue groups are editions of an existing work. Numbered
// generative works (BEST BEFORE, Manufactured, etc.) are distinct artworks.
export const EDITION_COLLECTIONS = new Set([
    'Deprivation (Prints)', 'Mirage (Prints)', 'Trilogy (Prints)',
    'Minute, papillon! Edition', 'Satoshi (Original & Editions)',
]);
export const EXPLORE_EXCLUDED_IDS = new Set([
    'a19e210c94fe5716b2877ca3d5afee9ed248b6a8ed549ff2186dd3170f191961i0', // ORDINALLY collaboration punch card
]);
export const isExploreWork = work => work.collection !== 'Colors' && !EXPLORE_EXCLUDED_IDS.has(work.id) && !/collabs?\s+punch\s+card/i.test(work.name || '');
export function originalFor(work, byId) {
    if (!EDITION_COLLECTIONS.has(work.collection)) return work;
    if (work.collection === 'Satoshi (Original & Editions)' && work.name === 'Satoshi (Original)') return work;
    const originalId = String(work.provenance || '').split(',').map(id=>id.trim()).find(id=>byId.has(id));
    return byId.get(originalId) || null;
}
export function uniqueOriginals(works, byId) {
    const seen = new Set();
    return works.map(work=>originalFor(work,byId)).filter(work=>work && !seen.has(work.id) && seen.add(work.id));
}
export function artworkYear(work) {
    const explicit = Number(work.year);
    if(explicit>=2023 && explicit<=2100)return explicit;
    const date = Number(String(work.timestamp||'').slice(0,4));
    return date>=2023 && date<=2100 ? date : 0;
}
