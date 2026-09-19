import titles from './artwork-titles.json';
const catalogue = titles as Record<string,string>;
export const hasArtworkTitle = (id:string) => Boolean(catalogue[id.toLowerCase()]);
export function isGenericTitle(name:string) {
    return !name?.trim() || /^Untitled work$/i.test(name) || /(?:#|inscription\s*)\s*\d{6,}\b/i.test(name) || /^[a-f0-9]{64}i\d+$/i.test(name);
}
export function artworkName(id:string, ...candidates:string[]) {
    if (hasArtworkTitle(id)) return catalogue[id.toLowerCase()];
    const named = candidates.filter(name => name && !isGenericTitle(name));
    // Prefer an actual edition title over a collection-only label or "6 of 21".
    return named.find(name => /[a-z]/i.test(name) && /(?:#|n[º°o.]|\d\s*\/)/i.test(name))
        || named.find(name => /[a-z]/i.test(name) && !/^\d+\s+of\s+\d+$/i.test(name))
        || named[0] || 'Untitled work';
}
