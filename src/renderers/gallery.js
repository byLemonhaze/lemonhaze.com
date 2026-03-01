import {
    getPreferredFileExtension,
    isHtmlArtwork,
    isVideoArtwork,
    shouldUseDirectOnchainMedia,
} from '../modules/artwork-media.js';

const ONCHAIN_IMAGE_OVERRIDES = new Set([
    '0c57ce6325d8da6242488d453c13bac0e1e1eaca6a5b3bf4078a6bdd6768d49di0',
]);

export function getArtworkImageSrc(item) {
    if (item?._imgSrc) return item._imgSrc;
    if (item?.id && ONCHAIN_IMAGE_OVERRIDES.has(item.id)) {
        return `https://ordinals.com/content/${item.id}`;
    }
    if (item?.id && shouldUseDirectOnchainMedia(item) && !isHtmlArtwork(item)) {
        return `https://ordinals.com/content/${item.id}`;
    }

    const ext = getPreferredFileExtension(item);
    return `https://cdn.lemonhaze.com/assets/assets/${item.id}.${ext}`;
}

export function renderGalleryGrid(items, { galleryGrid, contentArea, onOpenArtworkById }) {
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

        const mediaSrc = getArtworkImageSrc(item);
        const isVideo = isVideoArtwork(item);
        const mediaClass = `w-[85%] h-[85%] object-contain drop-shadow-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 ${item.artwork_type === 'PNG' ? 'pixelated' : ''}`;

        const mediaMarkup = isVideo
            ? `<video src="${mediaSrc}" class="${mediaClass}" muted loop autoplay playsinline preload="metadata"></video>`
            : `<img src="${mediaSrc}" class="${mediaClass}" loading="lazy" />`;

        card.innerHTML = `
      <div class="aspect-square bg-[#0a0a0a] overflow-hidden flex items-center justify-center">
        ${mediaMarkup}
      </div>
      <div class="pt-2 pb-1">
        <p class="text-[10px] font-bold uppercase tracking-widest text-white text-center truncate">${item.name || 'Untitled'}</p>
      </div>
    `;

        card.onclick = () => onOpenArtworkById(item.id);
        fragment.appendChild(card);
    });

    galleryGrid.appendChild(fragment);
}
