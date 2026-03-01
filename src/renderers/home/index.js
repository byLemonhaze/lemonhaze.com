import { HOME_ONCHAIN_IMAGE_OVERRIDES } from '../../data/featured.js';
import { createHomeCarousel } from './carousel.js';
import { buildHomeSelection } from './selection.js';

export function renderHomeView({
    galleryGrid,
    appState,
    artworks,
    chronologyByYear,
    onOpenArtworkById,
    getArtworkImageSrc,
}) {
    if (!galleryGrid) return () => {};

    galleryGrid.innerHTML = '';
    galleryGrid.className = 'w-full flex flex-col items-center justify-center min-h-[88vh] md:min-h-[calc(100vh-3rem)] relative overflow-hidden md:py-4';

    const selection = buildHomeSelection({
        artworks,
        chronologyByYear,
    });

    if (!selection.length) {
        galleryGrid.innerHTML = `
            <div class="col-span-full h-96 flex flex-col items-center justify-center text-white/30">
                <p class="text-xl">No artworks found</p>
            </div>
        `;
        return () => {};
    }

    const getCarouselImageSrc = (artwork) => {
        if (artwork?.id && HOME_ONCHAIN_IMAGE_OVERRIDES.has(artwork.id)) {
            return `https://ordinals.com/content/${artwork.id}`;
        }
        if (artwork?.extension) {
            return `https://cdn.lemonhaze.com/assets/assets/${artwork.id}.${artwork.extension}`;
        }
        return getArtworkImageSrc(artwork);
    };

    const carousel = createHomeCarousel({
        appState,
        selection,
        chronologyByYear,
        onOpenArtworkById,
        getCarouselImageSrc,
    });

    carousel.mount(galleryGrid);
    return carousel.cleanup;
}
