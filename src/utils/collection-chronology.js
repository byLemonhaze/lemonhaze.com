import { COLLECTION_PARENT_DATES } from '../data/collection-parent-dates.js';
import { dateValue } from './sorting.js';

const ROOT_PARENT = '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0';
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/1\/1s/g, '1 of 1s').replace(/[^a-z0-9]/g, '').replace(/^lorphelinat$/, 'orphelinat');
const lineage = item => String(item.provenance || '').match(/[a-f0-9]{64}i\d+/g) || [];
const earliest = items => items.map(item => dateValue(item.timestamp)).filter(value => value != null).sort((a,b) => a-b)[0] ?? null;

// Prefer collection parents, never the shared grandparent or a later child.
// Pre-parent collections use their first documented inscription, not January 1.
export function collectionChronology(name, artworks) {
    artworks = [...COLLECTION_PARENT_DATES, ...artworks];
    const key = normalize(name);
    const members = artworks.filter(item => normalize(item.collection) === key || normalize(item.series) === key);
    const memberIds = new Set(members.map(item => item.id));
    const referencedIds = new Set(members.flatMap(lineage));
    const parents = members.filter(item => item.role === 'parent' || referencedIds.has(item.id));
    if (parents.length) return earliest(parents);
    const externalParents = artworks.filter(item => referencedIds.has(item.id) && item.id !== ROOT_PARENT && !memberIds.has(item.id));
    // A lineage may list multiple ancestors. Retain only the nearest known ones.
    const ancestors = new Set(externalParents.flatMap(lineage));
    const directParents = externalParents.filter(item => !ancestors.has(item.id));
    if (directParents.length) return earliest(directParents);
    return earliest(members.length ? members : artworks.filter(item => normalize(item.name) === key));
}

export function withCollectionChronology(rows, artworks) {
    return rows.map(row => ({...row, chronology: collectionChronology(row.name, artworks)}));
}
