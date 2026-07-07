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

const DIRECT_ONCHAIN_CONTENT_PREVIEW_ARTWORK_IDS = new Set([
    '15ed0a345c10cb0b26fad820f364898f355924dbf0ce5527dd5d7237e0a25964i0', // Off-Kilter
    '58d21c5f1bbc25932fe1cc784ac47baf8b0ed9241ea989ad2a47b41839d132e7i0', // Glass Breaker
    'a75945e142877ade9392a0855ef0fdab215af10a7f3e4381d31697c706836228i0', // Mending Out
    'e363af225398924fbc52df5fe605a6b1e1290ed464ded09dba82516154913be5i0', // Necronies
    'b66a29be1861ef12253635e0dff825344dc39c5c44644e3224b7974deac8a092i0', // Flashback
    '28cc6c152b736d59551de08f0d6bd7984a49a0a1f9eca80df62938eaa96ac7e6i0', // Soleil & Mer
    'ada7662763439c6a786c1a06b653efb244b9abd722593c9a97606c7050c931b6i0', // Birthday Girl
    '3103fcd71deeacd50251d7d6c14778ff74fd26c6ee9b46ec24341aac9bc874fdi0', // Loft Gallery Prototype
]);

const CDN_MEDIA_EXTENSION_OVERRIDES = new Map([
    ['6f4dee1d7fb56cb3f6655f343d3824e0694f1932d20e41b0abe982cae958ae21i0', 'mp4'],
]);

const CDN_MEDIA_FALLBACK_IMAGE_EXTENSIONS = new Map([
    ['6f4dee1d7fb56cb3f6655f343d3824e0694f1932d20e41b0abe982cae958ae21i0', 'png'],
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
    if (!id) return false;
    return (
        DIRECT_ONCHAIN_PREVIEW_ARTWORK_IDS.has(id) ||
        DIRECT_ONCHAIN_CONTENT_PREVIEW_ARTWORK_IDS.has(id)
    );
}

export function getDirectOnchainPreviewSrc(item) {
    const id = String(item?.id || '').trim();
    if (!id || !shouldUseDirectOnchainPreview(item)) return null;

    return DIRECT_ONCHAIN_PREVIEW_ARTWORK_IDS.has(normalize(id))
        ? `https://ordinals.com/preview/${id}`
        : `https://ordinals.com/content/${id}`;
}

export function getCdnMediaSrc(item, extension = null) {
    const ext = extension || getPreferredFileExtension(item);
    return `https://cdn.lemonhaze.com/assets/assets/${item.id}.${ext}`;
}

export function getCdnFallbackImageSrc(item) {
    const id = normalize(item?.id);
    const fallbackExtension = CDN_MEDIA_FALLBACK_IMAGE_EXTENSIONS.get(id);
    if (!fallbackExtension) return null;
    return getCdnMediaSrc(item, fallbackExtension);
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
