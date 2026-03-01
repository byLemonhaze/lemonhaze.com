import {
    HOME_BEST_BEFORE_REVEALED_IDS,
    HOME_CCC_EXTRAS,
    HOME_DDD_EXTRAS,
    HOME_FIXED_IDS,
    HOME_GENTLEMAN_ID,
    HOME_MA_VILLE_PLACEHOLDER,
} from '../../data/featured.js';

const FORBIDDEN_2023_COLLECTIONS = new Set([
    'Cypherville',
    'Portrait 2490',
    'Miscellaneous',
    'Gentlemen',
]);

function shuffle(items) {
    const cloned = [...items];
    for (let i = cloned.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
}

function pickRandom(items) {
    if (!items || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
}

export function buildHomeSelection({ artworks, chronologyByYear }) {
    const selection = [];
    const selectedIds = new Set();

    const findItem = (id) => artworks.find((item) => item.id === id) || null;

    const findMaVille = () => {
        const candidates = artworks.filter(
            (item) => item.collection === 'Ma ville en quatre temps'
        );
        return pickRandom(candidates);
    };

    const add = (item) => {
        if (!item || selectedIds.has(item.id)) return;
        selection.push(item);
        selectedIds.add(item.id);
    };

    const addToPool = (pool, item) => {
        if (!item) return;
        pool.push(item);
    };

    const isValidArtwork = (item) => (
        item
        && !selectedIds.has(item.id)
        && ['PNG', 'JPEG', 'WEBP'].includes(item.artwork_type)
    );

    add(findItem(HOME_GENTLEMAN_ID));

    const pool = [];

    HOME_FIXED_IDS.forEach((id) => {
        if (id === HOME_MA_VILLE_PLACEHOLDER) {
            addToPool(pool, findMaVille());
            return;
        }
        addToPool(pool, findItem(id));
    });

    pool.push({
        id: 'SEALED',
        name: 'SEALED',
        collection: 'BEST BEFORE',
        artwork_type: 'PNG',
    });
    pool.push({
        id: 'EXPIRED',
        name: 'EXPIRED',
        collection: 'BEST BEFORE',
        artwork_type: 'PNG',
    });

    shuffle(HOME_BEST_BEFORE_REVEALED_IDS)
        .slice(0, 3)
        .forEach((id) => addToPool(pool, findItem(id)));

    shuffle(HOME_DDD_EXTRAS)
        .slice(0, 6)
        .forEach((item) => addToPool(pool, { ...item }));

    HOME_CCC_EXTRAS.forEach((item) => addToPool(pool, { ...item }));

    (chronologyByYear['2025'] || []).forEach((collectionName) => {
        if (collectionName === 'BEST BEFORE') return;
        const candidates = artworks.filter(
            (item) => item.collection === collectionName && isValidArtwork(item)
        );
        addToPool(pool, pickRandom(candidates));
    });

    (chronologyByYear['2024'] || []).forEach((collectionName) => {
        if (collectionName === 'Manufactured') return;
        const candidates = artworks.filter(
            (item) => item.collection === collectionName && isValidArtwork(item)
        );
        addToPool(pool, pickRandom(candidates));
    });

    const all2023 = [];
    (chronologyByYear['2023'] || []).forEach((collectionName) => {
        if (FORBIDDEN_2023_COLLECTIONS.has(collectionName)) return;
        const candidates = artworks.filter(
            (item) => item.collection === collectionName && isValidArtwork(item)
        );
        all2023.push(...candidates);
    });

    shuffle(all2023)
        .slice(0, 4)
        .forEach((item) => addToPool(pool, item));

    shuffle(pool)
        .slice(0, 60)
        .forEach((item) => add(item));

    return selection;
}
