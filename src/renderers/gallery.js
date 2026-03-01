const ONCHAIN_IMAGE_OVERRIDES = new Set([
    '0c57ce6325d8da6242488d453c13bac0e1e1eaca6a5b3bf4078a6bdd6768d49di0',
]);

export function getArtworkImageSrc(item) {
    if (item?.id && ONCHAIN_IMAGE_OVERRIDES.has(item.id)) {
        return `https://ordinals.com/content/${item.id}`;
    }

    let ext = 'png';
    if (item.artwork_type === 'JPEG') ext = 'jpg';
    else if (item.artwork_type === 'WEBP') ext = 'webp';
    return `https://cdn.lemonhaze.com/assets/assets/${item.id}.${ext}`;
}

export function renderGalleryGrid(items, { galleryGrid, contentArea, onOpenArtworkById }) {
    if (!galleryGrid) return;

    galleryGrid.innerHTML = '';
    galleryGrid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-20';

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
        card.className = 'surface overflow-hidden group transition-colors duration-300 animate-fade-in cursor-pointer hover:border-white/30';
        card.style.animationDelay = `${idx * 20}ms`;

        const imgSrc = getArtworkImageSrc(item);
        const imgClass = item.artwork_type === 'PNG' ? 'pixelated' : '';

        card.innerHTML = `
      <div class="aspect-square bg-[#0a0a0a] border border-white/10 relative group overflow-hidden flex items-center justify-center">
        <img src="${imgSrc}" class="w-[85%] h-[85%] object-contain drop-shadow-2xl ${imgClass}" loading="lazy" />
        <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p class="text-[11px] font-bold text-white tracking-widest italic">${item.name || 'Untitled'}</p>
        </div>
      </div>
    `;

        card.onclick = () => onOpenArtworkById(item.id);
        fragment.appendChild(card);
    });

    galleryGrid.appendChild(fragment);
}
