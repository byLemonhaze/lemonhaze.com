export function createCollectionResolver({ chronologyByYear, getArtworks }) {
    let collectionNameToSlug = new Map();
    let collectionSlugToName = new Map();

    const slugifyCollectionName = (name) => {
        return String(name)
            .toLowerCase()
            .trim()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const findKnownCollectionName = (value) => {
        const rawValue = String(value || '').trim();
        if (!rawValue) return null;

        const chronologyCollections = Object.values(chronologyByYear).flat();
        const chronologyMatch = chronologyCollections.find((col) => col.toLowerCase() === rawValue.toLowerCase());
        if (chronologyMatch) return chronologyMatch;

        const artworks = getArtworks();
        const artworkMatch = artworks.find((item) => (item.collection || '').toLowerCase() === rawValue.toLowerCase());
        if (artworkMatch?.collection) return artworkMatch.collection;

        return null;
    };

    const resolveCollectionName = (name) => {
        if (!name) return null;

        const rawName = String(name).trim();
        if (!rawName) return null;
        if (rawName.toLowerCase() === 'home') return 'Home';

        const knownCollection = findKnownCollectionName(rawName);
        if (knownCollection) return knownCollection;

        return rawName;
    };

    const rebuildCollectionSlugs = () => {
        collectionNameToSlug = new Map();
        collectionSlugToName = new Map();

        const orderedNames = [];
        const seenNames = new Set();
        const addName = (name) => {
            if (!name) return;
            const normalized = String(name).trim();
            if (!normalized || normalized.toLowerCase() === 'home' || seenNames.has(normalized)) return;
            seenNames.add(normalized);
            orderedNames.push(normalized);
        };

        Object.values(chronologyByYear).flat().forEach(addName);
        getArtworks().forEach((item) => addName(item.collection));

        orderedNames.forEach((name) => {
            const baseSlug = slugifyCollectionName(name);
            if (!baseSlug) return;

            let slug = baseSlug;
            let suffix = 2;
            while (collectionSlugToName.has(slug) && collectionSlugToName.get(slug) !== name) {
                slug = `${baseSlug}-${suffix}`;
                suffix += 1;
            }

            collectionNameToSlug.set(name, slug);
            collectionSlugToName.set(slug, name);
        });
    };

    const resolveCollectionParam = (value) => {
        if (!value) return null;

        const rawValue = String(value).trim();
        if (!rawValue) return null;

        const slugMatch = collectionSlugToName.get(rawValue.toLowerCase());
        if (slugMatch) return slugMatch;

        return findKnownCollectionName(rawValue);
    };

    const resolveCollectionPathToken = (value) => {
        if (!value) return null;
        const rawValue = String(value).trim().toLowerCase();
        if (!rawValue) return null;
        return collectionSlugToName.get(rawValue) || null;
    };

    const toCollectionSlug = (collectionName) => {
        const resolved = resolveCollectionName(collectionName);
        if (!resolved || resolved === 'Home') return null;
        return collectionNameToSlug.get(resolved) || slugifyCollectionName(resolved);
    };

    return {
        slugifyCollectionName,
        resolveCollectionName,
        rebuildCollectionSlugs,
        resolveCollectionParam,
        resolveCollectionPathToken,
        toCollectionSlug,
    };
}
