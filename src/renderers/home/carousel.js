import { createHomePreloader } from './preloader.js';

function buildCollectionYearMap(chronologyByYear) {
    const colToYear = {};
    Object.entries(chronologyByYear || {}).forEach(([year, collections]) => {
        (collections || []).forEach((collectionName) => {
            colToYear[collectionName] = year;
        });
    });
    return colToYear;
}

function createArrowButton(direction, onClick) {
    const isRight = direction === 'right';
    const button = document.createElement('button');
    button.className = `absolute ${isRight ? 'right-4 md:right-12' : 'left-4 md:left-12'} top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-white transition-colors duration-300`;
    button.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="${isRight ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}"></polyline></svg>`;
    button.addEventListener('click', onClick);
    return button;
}

export function createHomeCarousel({
    appState,
    selection,
    chronologyByYear,
    onOpenArtworkById,
    getCarouselImageSrc,
}) {
    const totalItems = selection.length;
    const loadedImages = new Set();
    const colToYear = buildCollectionYearMap(chronologyByYear);
    const preloader = createHomePreloader({ selection, getCarouselImageSrc });

    let activeIndex = 0;
    let dragOffset = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'relative w-full h-[450px] md:h-[560px] flex items-center justify-center overflow-hidden -mt-4 md:mt-0';

    const tracksContainer = document.createElement('div');
    tracksContainer.className = 'relative w-full max-w-7xl h-[380px] md:h-[500px]';
    carouselWrapper.appendChild(tracksContainer);

    const labelContainer = document.createElement('div');
    labelContainer.className = 'mt-2 md:mt-6 text-center animate-fade-in delay-500 min-h-[4rem] relative z-40';

    const itemEls = selection.map((artwork, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'absolute top-0 w-[85vw] md:w-[600px] h-full cursor-pointer transition-all duration-500 ease-out';
        itemDiv.style.left = '50%';
        itemDiv.style.transform = 'translateX(-50%)';

        const src = getCarouselImageSrc(artwork);
        const isInteractive = artwork.id !== 'SEALED' && artwork.id !== 'EXPIRED';

        itemDiv.innerHTML = `
            <div class="w-full h-full relative group flex items-center justify-center">
                 <div class="absolute w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 <img src="${src}"
                    style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;"
                    class="w-full h-full object-contain opacity-0 transition-opacity duration-500 relative z-10" draggable="false" />
            </div>
        `;

        const img = itemDiv.querySelector('img');
        if (img) {
            const handleImageLoad = () => {
                img.classList.remove('opacity-0');
                loadedImages.add(index);
            };
            img.addEventListener('load', handleImageLoad, { once: true });
            if (img.complete) handleImageLoad();
        }

        itemDiv.addEventListener('click', () => {
            if (isDragging) return;
            if (index === activeIndex) {
                if (!isInteractive) return;
                const idToOpen = artwork.targetId || artwork.id;
                onOpenArtworkById(idToOpen);
                return;
            }
            setActiveIndex(index);
        });

        tracksContainer.appendChild(itemDiv);
        return itemDiv;
    });

    function updateLabel() {
        const item = selection[activeIndex];
        if (!item) {
            labelContainer.innerHTML = '';
            return;
        }
        const year = colToYear[item.collection] || (item.collection === 'BEST BEFORE' ? '2025' : '');
        labelContainer.innerHTML = `
            <h4 class="text-sm md:text-base font-bold text-white tracking-widest mb-1 opacity-90 text-shadow-sm shadow-black">${item.name || 'Untitled'}</h4>
            <p class="text-[10px] text-white/30 font-mono uppercase tracking-[0.3em] font-light text-shadow-sm shadow-black">${item.collection}</p>
            ${year ? `<p class="text-[9px] text-white/10 font-mono mt-1 tracking-widest font-light text-shadow-sm shadow-black">${year}</p>` : ''}
        `;
    }

    function updateCarousel() {
        itemEls.forEach((element, index) => {
            let diff = index - activeIndex;
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;

            const isActive = diff === 0;
            const isPrev = diff === -1;
            const isNext = diff === 1;
            const img = element.querySelector('img');

            element.style.zIndex = '0';
            element.style.opacity = '0';
            element.style.pointerEvents = 'none';
            element.style.transform = 'translateX(-50%) scale(0.8)';
            element.style.transition = isDragging
                ? 'none'
                : 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';

            if (img) {
                img.style.filter = 'blur(5px) grayscale(100%)';
                img.style.animation = 'none';
                img.style.transitionProperty = 'opacity, transform, filter';
            }

            if (isActive) {
                element.style.zIndex = '20';
                element.style.opacity = '1';
                element.style.pointerEvents = 'auto';
                element.style.transform = `translateX(calc(-50% + ${dragOffset}px)) scale(1)`;
                if (img) {
                    img.style.filter = 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.85)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.5))';
                }
                return;
            }

            if (isPrev) {
                element.style.zIndex = '10';
                element.style.opacity = '0';
                element.style.pointerEvents = 'auto';
                element.style.transform = `translateX(calc(-120% + ${dragOffset}px)) scale(0.85)`;
                return;
            }

            if (isNext) {
                element.style.zIndex = '10';
                element.style.opacity = '0';
                element.style.pointerEvents = 'auto';
                element.style.transform = `translateX(calc(20% + ${dragOffset}px)) scale(0.85)`;
            }
        });

        updateLabel();
    }

    function findNearestLoaded(startIndex, direction) {
        let target = (startIndex + direction + totalItems) % totalItems;
        if (loadedImages.has(target)) return target;

        for (let offset = 1; offset < totalItems; offset += 1) {
            const candidate = (startIndex + (direction * offset) + totalItems) % totalItems;
            if (candidate === startIndex) continue;
            if (loadedImages.has(candidate)) return candidate;
        }

        return target;
    }

    function setActiveIndex(newIndex) {
        activeIndex = (newIndex + totalItems) % totalItems;
        updateCarousel();
        preloader.preloadNeighbors(activeIndex, 5);
    }

    function next() {
        const target = findNearestLoaded(activeIndex, 1);
        setActiveIndex(target);
    }

    function prev() {
        const target = findNearestLoaded(activeIndex, -1);
        setActiveIndex(target);
    }

    function stopAutoPlay() {
        if (appState.homeInterval) {
            clearInterval(appState.homeInterval);
            appState.homeInterval = null;
        }
    }

    function startAutoPlay() {
        stopAutoPlay();
        appState.homeInterval = setInterval(() => {
            if (!isDragging) next();
        }, 5000);
    }

    const onTouchStart = (event) => {
        isDragging = true;
        startX = event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
        currentX = startX;
        dragOffset = 0;
        stopAutoPlay();
        updateCarousel();
    };

    const onTouchMove = (event) => {
        if (!isDragging) return;
        const x = event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
        currentX = x;
        dragOffset = currentX - startX;
        updateCarousel();
    };

    const onTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentX - startX;
        if (Math.abs(diff) > 75) {
            dragOffset = 0;
            if (diff > 0) prev();
            else next();
        } else {
            dragOffset = 0;
            updateCarousel();
        }

        startAutoPlay();
    };

    const onKeyDown = (event) => {
        if (appState.currentFilter !== 'Home') return;
        if (event.key === 'ArrowLeft') {
            stopAutoPlay();
            prev();
            startAutoPlay();
            return;
        }
        if (event.key === 'ArrowRight') {
            stopAutoPlay();
            next();
            startAutoPlay();
        }
    };

    carouselWrapper.addEventListener('touchstart', onTouchStart, { passive: true });
    carouselWrapper.addEventListener('touchmove', onTouchMove, { passive: true });
    carouselWrapper.addEventListener('touchend', onTouchEnd);
    carouselWrapper.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    const leftArrow = createArrowButton('left', (event) => {
        event.stopPropagation();
        stopAutoPlay();
        prev();
        startAutoPlay();
    });
    const rightArrow = createArrowButton('right', (event) => {
        event.stopPropagation();
        stopAutoPlay();
        next();
        startAutoPlay();
    });
    carouselWrapper.appendChild(leftArrow);
    carouselWrapper.appendChild(rightArrow);

    function mount(container) {
        container.appendChild(carouselWrapper);
        container.appendChild(labelContainer);
        updateCarousel();
        preloader.preloadInitialBurst(10);
        preloader.startBackgroundSync(2000);
        startAutoPlay();
    }

    function cleanup() {
        stopAutoPlay();
        preloader.stopBackgroundSync();

        carouselWrapper.removeEventListener('touchstart', onTouchStart);
        carouselWrapper.removeEventListener('touchmove', onTouchMove);
        carouselWrapper.removeEventListener('touchend', onTouchEnd);
        carouselWrapper.removeEventListener('mousedown', onTouchStart);
        window.removeEventListener('mousemove', onTouchMove);
        window.removeEventListener('mouseup', onTouchEnd);
        window.removeEventListener('keydown', onKeyDown);

        leftArrow.remove();
        rightArrow.remove();
        carouselWrapper.remove();
        labelContainer.remove();
    }

    return { mount, cleanup };
}
