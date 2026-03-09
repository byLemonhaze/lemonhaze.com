import { ALL_QUERY_ROUTE_KEYS, QUERY_ROUTE_KEYS } from './constants.js';

const DUPLICATE_SLASH_PATTERN = /\/{2,}/g;
const TRAILING_SLASH_PATTERN = /\/+$/;

function readFirstSearchValue(params, keys) {
    for (const key of keys) {
        if (!params.has(key)) continue;
        return params.get(key);
    }
    return null;
}

function safeDecode(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function sanitizePathname(pathname) {
    let next = String(pathname || '/').trim() || '/';
    if (!next.startsWith('/')) next = `/${next}`;
    next = next.replace(DUPLICATE_SLASH_PATTERN, '/');
    if (next.length > 1) {
        next = next.replace(TRAILING_SLASH_PATTERN, '');
    }
    return next || '/';
}

export function isHomePath(pathname) {
    const normalized = sanitizePathname(pathname);
    return normalized === '/' || normalized === '/index.html';
}

export function buildCanonicalPath({ collection = null, section = null, artwork = null, toCollectionSlug }) {
    const artworkId = String(artwork || '').trim();
    if (artworkId) return `/${encodeURIComponent(artworkId)}`;

    const sectionKey = String(section || '').trim().toLowerCase();
    if (sectionKey) return `/${encodeURIComponent(sectionKey)}`;

    const collectionSlug = toCollectionSlug?.(collection);
    if (collectionSlug) return `/${encodeURIComponent(collectionSlug)}`;

    return '/';
}

export function stripRouteSearchParams(searchParams) {
    ALL_QUERY_ROUTE_KEYS.forEach((key) => searchParams.delete(key));
    return searchParams;
}

export function parseRouteUrl(url, {
    normalizeSectionKey,
    resolveCollectionParam,
    resolveCollectionPathToken,
    toCollectionSlug,
}) {
    const pathname = sanitizePathname(url.pathname);
    const pathSegments = pathname.split('/').filter(Boolean);
    const hasUnsupportedPath = !isHomePath(pathname) && pathSegments.length !== 1;
    const rawPathToken = hasUnsupportedPath || isHomePath(pathname)
        ? null
        : (safeDecode(pathSegments[0]) || '').trim() || null;

    const params = new URLSearchParams(url.search);
    const rawCollection = readFirstSearchValue(params, QUERY_ROUTE_KEYS.collection);
    const rawSection = readFirstSearchValue(params, QUERY_ROUTE_KEYS.section);
    const rawArtwork = readFirstSearchValue(params, QUERY_ROUTE_KEYS.artwork);

    let collection = null;
    let section = null;
    let artwork = null;

    if (rawPathToken) {
        section = normalizeSectionKey(rawPathToken);
        if (!section) {
            collection = resolveCollectionPathToken(rawPathToken);
        }
        if (!section && !collection) {
            artwork = rawPathToken;
        }
    } else {
        collection = resolveCollectionParam(rawCollection);
        section = normalizeSectionKey(rawSection);
        artwork = rawArtwork?.trim() || null;
    }

    const hasQueryRouteParams = ALL_QUERY_ROUTE_KEYS.some((key) => params.has(key));
    const canonicalPath = buildCanonicalPath({
        collection,
        section,
        artwork,
        toCollectionSlug,
    });

    return {
        collection,
        section,
        artwork,
        rawCollection,
        rawSection,
        rawArtwork,
        rawPathToken,
        pathname,
        canonicalPath,
        hasQueryRouteParams,
        hasUnsupportedPath,
        hasNonCanonicalPath: pathname !== canonicalPath,
    };
}
