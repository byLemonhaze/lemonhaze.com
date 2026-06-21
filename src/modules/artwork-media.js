const DIRECT_ONCHAIN_COLLECTIONS = new Set([
    'Cypherville',
    'Portrait 2490',
    'Miscellaneous',
    'Gentlemen',
    'Tad Small',
    'Le Bar a Tapas',
    'The Artifacts',
    'Framed',
    'Ordinals Summer',
    'Polaroid',
    'Dark Days',
    'Mending Fragments',
    'Fading',
    'Berlin',
    'Lotus',
    'Jardin Secret',
    'World Tour',
    'Discography',
]);

const DIRECT_ONCHAIN_PREVIEW_ARTWORK_IDS = new Set([
    '22c45a61ac26e42545e29a1c0af72190134f94f489596619f0b0e023908952e3i0',
]);

const CDN_MEDIA_EXTENSION_OVERRIDES = new Map([
    ['6f4dee1d7fb56cb3f6655f343d3824e0694f1932d20e41b0abe982cae958ae21i0', 'mp4'],
]);

function normalize(value) {
    return String(value || '').trim().toLowerCase();
}

export function isHtmlArtwork(item) {
    const id = normalize(item?.id);
    const contentType = normalize(item?.content_type);
    const artworkType = normalize(item?.artwork_type);
    return (
        id.includes('.html') ||
        contentType.includes('html') ||
        artworkType === 'html' ||
        artworkType.includes('javascript')
    );
}

export function isVideoArtwork(item) {
    const contentType = normalize(item?.content_type);
    const artworkType = normalize(item?.artwork_type);
    return (
        contentType.startsWith('video/') ||
        artworkType === 'mp4' ||
        artworkType === 'webm'
    );
}

export function shouldUseDirectOnchainMedia(item) {
    const collection = String(item?.collection || '').trim();
    return collection.length > 0 && DIRECT_ONCHAIN_COLLECTIONS.has(collection);
}

export function shouldUseDirectOnchainPreview(item) {
    const id = normalize(item?.id);
    return id.length > 0 && DIRECT_ONCHAIN_PREVIEW_ARTWORK_IDS.has(id);
}

export function getDirectOnchainPreviewSrc(item) {
    const id = String(item?.id || '').trim();
    return shouldUseDirectOnchainPreview(item) && id ? `https://ordinals.com/preview/${id}` : null;
}

export function getPreferredFileExtension(item) {
    const id = normalize(item?.id);
    const overriddenExtension = CDN_MEDIA_EXTENSION_OVERRIDES.get(id);
    if (overriddenExtension) return overriddenExtension;

    const artworkType = normalize(item?.artwork_type);
    if (artworkType === 'jpeg' || artworkType === 'jpg') return 'jpg';
    if (artworkType === 'webp') return 'webp';
    if (artworkType === 'gif') return 'gif';
    if (artworkType === 'mp4') return 'mp4';
    if (artworkType === 'webm') return 'webm';
    if (artworkType === 'svg') return 'svg';
    if (artworkType === 'png' || artworkType === 'image/png') return 'png';

    const contentType = normalize(item?.content_type);
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('video/mp4')) return 'mp4';
    if (contentType.includes('video/webm')) return 'webm';
    if (contentType.includes('svg')) return 'svg';

    return 'png';
}
