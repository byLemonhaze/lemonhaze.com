import {
    getCdnFallbackImageSrc,
    getCdnMediaSrc,
    getDirectOnchainPreviewSrc,
    getPreferredFileExtension,
    isHtmlArtwork,
    isVideoArtwork,
    shouldUseDirectOnchainPreview,
    shouldUseDirectOnchainMedia,
} from '../modules/artwork-media.js';

const ONCHAIN_IMAGE_OVERRIDES = new Set([
    '0c57ce6325d8da6242488d453c13bac0e1e1eaca6a5b3bf4078a6bdd6768d49di0',
]);

const ENCRYPTED_ARTWORKS = new Set([
    '41bd86ca3414a204bf5bd735f79f57219db5113a4655d46613d27c1218606638i0', // Self-Portrait by Lemonhaze
    '773bcd4be1b8a4a9f3e9c427fb4264066e2043b56a9ecb22c8ebcf2192fda561i0', // Paint Engine v1.08 [Bam]
]);

export function getArtworkImageSrc(item) {
    if (item?._imgSrc) return item._imgSrc;
    if (item?.grid_preview) return item.grid_preview;
    if (item?.id && ONCHAIN_IMAGE_OVERRIDES.has(item.id)) {
        return `https://ordinals.com/content/${item.id}`;
    }
    if (item?.id && shouldUseDirectOnchainMedia(item) && !isHtmlArtwork(item)) {
        return `https://ordinals.com/content/${item.id}`;
    }

    const ext = getPreferredFileExtension(item);
    return getCdnMediaSrc(item, ext);
}

export function renderGalleryGrid(items, { galleryGrid, contentArea, onOpenArtworkById, parentIds }) {
    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';
    galleryGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-20';

    if (contentArea) {
        contentArea.scrollTop = 0;
    }

    if (items.length === 0) {
        galleryGrid.innerHTML = `
      <div class="col-span-full h-96 flex flex-col items-center justify-center text-white/30">
        <p class="text-xl">No artworks found</p>
      </div>
    `;
        return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'group animate-fade-in cursor-pointer';
        card.style.animationDelay = `${idx * 20}ms`;

        const isEncrypted = ENCRYPTED_ARTWORKS.has(item.id);
        const isParent = parentIds?.has(item.id) ?? false;
        const mediaSrc = getArtworkImageSrc(item);
        const previewSrc = getDirectOnchainPreviewSrc(item);
        const shouldUsePreview = shouldUseDirectOnchainPreview(item);
        const isVideo = isVideoArtwork(item);
        const fallbackImageSrc = getCdnFallbackImageSrc(item);
        const mediaClass = `w-[85%] h-[85%] object-contain drop-shadow-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 ${item.artwork_type === 'PNG' ? 'pixelated' : ''}`;

        const mediaMarkup = isEncrypted
            ? `<div class="flex flex-col items-center justify-center gap-2">
                 <span class="text-[9px] font-mono uppercase tracking-[0.22em] text-white/20">Artwork Encrypted</span>
               </div>`
            : shouldUsePreview && previewSrc
            ? `<iframe src="${previewSrc}" data-onchain-preview-src="${previewSrc}" class="${mediaClass}" loading="lazy" sandbox="allow-scripts allow-same-origin" scrolling="no" aria-hidden="true" tabindex="-1" style="border:0; pointer-events:none;"></iframe>`
            : isVideo
            ? `<video src="${mediaSrc}" class="${mediaClass}" muted loop autoplay playsinline preload="metadata"${fallbackImageSrc ? ` poster="${fallbackImageSrc}"` : ''}></video>`
            : `<img src="${mediaSrc}" class="${mediaClass}" loading="lazy" />`;

        const parentLabel = isParent
            ? `<span class="absolute bottom-2 left-0 right-0 text-center text-[8px] font-mono uppercase tracking-[0.22em] text-white/0 group-hover:text-white/50 transition-all duration-300">Collection Parent</span>`
            : '';
        const borderClass = isParent
            ? 'border border-white/10 group-hover:border-white/25 transition-colors duration-300'
            : '';

        card.innerHTML = `
      <div class="relative aspect-square bg-[#0a0a0a] overflow-hidden flex items-center justify-center ${borderClass}">
        ${mediaMarkup}
        ${parentLabel}
      </div>
      <div class="pt-2 pb-1">
        <p class="text-[10px] font-bold uppercase tracking-widest text-white text-center truncate">${item.name || 'Untitled'}</p>
      </div>
    `;

        card.onclick = () => onOpenArtworkById(item.id);

        if (isVideo && fallbackImageSrc) {
            const video = card.querySelector('video');
            if (video) {
                video.addEventListener('error', () => {
                    const fallbackImage = document.createElement('img');
                    fallbackImage.src = fallbackImageSrc;
                    fallbackImage.className = mediaClass;
                    fallbackImage.loading = 'lazy';
                    video.replaceWith(fallbackImage);
                }, { once: true });
            }
        }

        fragment.appendChild(card);
    });

    galleryGrid.appendChild(fragment);
}
