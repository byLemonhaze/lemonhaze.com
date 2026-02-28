export function renderHomeView({
    galleryGrid,
    appState,
    hasCarouselStyles,
    artworks,
    chronologyByYear,
    onOpenArtworkById,
    getArtworkImageSrc,
}) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';
    galleryGrid.className = 'w-full flex flex-col items-center justify-center min-h-[85vh] relative overflow-hidden md:py-12';

    // Inject Custom Styles for Glow
    if (!hasCarouselStyles()) {
        const style = document.createElement('style');
        style.id = 'carousel-styles';
        style.textContent = `
            @keyframes pulse-glow {
              0% { filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.7)) drop-shadow(0 0 6px rgba(249, 243, 246, 0.3)); }
              50% { filter: drop-shadow(0 0 1.3px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 3.5px rgba(232, 220, 180, 0.75)) drop-shadow(0 0 7px rgba(249, 243, 246, 0.35)); }
              100% { filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.7)) drop-shadow(0 0 6px rgba(249, 243, 246, 0.3)); }
            }
        `;
        document.head.appendChild(style);
    }

    // ---------------------------------------------------------
    // 1. Data Preparation (Same as before)
    // ---------------------------------------------------------

    // 1. Initial Fixed Item: Gentleman #1
    const gentlemanId = "757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0";

    // 2. Best Before Revealed Pool
    const bbRevealedIds = [
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i132",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i168",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i30",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i63",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i91",
        // Removed #52
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i158", // #159
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i160", // #161
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i313",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i302",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i291",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i289",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i280",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i80",  // #81
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i222",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i138",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i93",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i85",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i78",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i76",
        "c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i31"
    ];

    // 3. Fixed IDs Pool
    const fixedIds = [
        "b32cc2fbacb3aa3b83408a8426873a3a649291da44538a462d76b3a84699f1e9i0",
        "8781dfea6d8f4db71df9c3674c2a555ae1815bdb627685bd1b6ab2a028678c42i0",
        "611fad09e407fe63e70c54ee853e755f92cb4d69049eff21f31d3d414a2db74di0",
        "MA_VILLE_PLACEHOLDER",
        "3966f90bf371dbc520bfebed868fd30adc574f60e900118308587001cb27514bi0",
        "33e141b76fba2459796239c0d67ea8bc056ec4abdb7a4f8d22735bb6c6be8ef6i0",
        "b8e34271e6d76d3d3aeea0756d9ad281132196fc30bb62d35ca8fe9b0fceff97i0",
        "9a4f72cb41ca2c4d5c591224bf02fe1fc3b977e4231042ccb45b9026c814b475i0",
        "989242547accbd3df2611aeae8c311e162d4d188f046d8562f18f6684ade4f63i0",
        "4a35c7618d244bd49c24881d17d159f05401d1e6351037cc05edb1749405a2dci0"
    ];

    // Helpers
    const findItem = (id) => artworks.find(a => a.id === id);
    const findMaVille = () => {
        const candidates = artworks.filter(a => a.collection === "Ma ville en quatre temps");
        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    };
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    const selection = [];
    const selectedIds = new Set();
    const ONCHAIN_IMAGE_OVERRIDES = new Set([
        '0c57ce6325d8da6242488d453c13bac0e1e1eaca6a5b3bf4078a6bdd6768d49di0',
    ]);
    const getCarouselImageSrc = (art) => {
        if (art?.id && ONCHAIN_IMAGE_OVERRIDES.has(art.id)) {
            return `https://ordinals.com/content/${art.id}`;
        }

        if (art?.extension) {
            return `https://cdn.lemonhaze.com/assets/assets/${art.id}.${art.extension}`;
        }

        return getArtworkImageSrc(art);
    };

    const add = (item) => {
        if (item && !selectedIds.has(item.id)) {
            selection.push(item);
            selectedIds.add(item.id);
        }
    };

    // --- Selection Logic ---
    add(findItem(gentlemanId));
    // NO forced 2nd BB anymore.

    const pool = [];
    const addToPool = (item) => { if (item) pool.push(item); }

    fixedIds.forEach(id => {
        if (id === "MA_VILLE_PLACEHOLDER") addToPool(findMaVille());
        else addToPool(findItem(id));
    });

    pool.push({ id: "SEALED", name: "SEALED", collection: "BEST BEFORE", artwork_type: "PNG" });
    pool.push({ id: "EXPIRED", name: "EXPIRED", collection: "BEST BEFORE", artwork_type: "PNG" });

    // Add 3 random BB items to the pool (randomly selected from revealed items)
    shuffle([...bbRevealedIds]).slice(0, 3).forEach(id => addToPool(findItem(id)));

    // Extras
    // Use the exact extras block provided
    const dddExtras = [
        { id: "ddd1", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "ddd2", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "ddd3", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "ddd4", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd3", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd7", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd8", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd9", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0" },
        { id: "dd2", name: "Paint Engine v0.1 [Grossier]", collection: "1 of 1s (2025)", artwork_type: "JPEG", extension: "jpeg", targetId: "f93a9e3655a0d9531871248b9a3e6b78c1aaee24c76265247a3172b16bdbc15di0" },
        { id: "dd4", name: "Paint Engine v0.8 [Under Construction]", collection: "1 of 1s (2026)", artwork_type: "JPEG", extension: "jpeg", targetId: "36e74fdb856a69281982f9340739aa10863bbd19da8d7e8fb183b9b9284323f8i0" },
        { id: "dd5", name: "Paint Engine v0.6 [Wild Patch]", collection: "1 of 1s (2026)", artwork_type: "JPEG", extension: "jpeg", targetId: "0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0" },
        { id: "dd6", name: "Paint Engine v0.6 [Wild Patch]", collection: "1 of 1s (2026)", artwork_type: "JPEG", extension: "jpeg", targetId: "0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0" }
    ];
    shuffle(dddExtras).slice(0, 6).forEach(item => pool.push(item));

    const cccExtras = [
        { id: "795a40ea70f17c9de70035395df51dce9510999f0c412bf5068c11115456f1c1i0", name: "Paint Engine v0.9 [Chasing The Dragon]", collection: "1 of 1s (2026)", artwork_type: "PNG" },
        { id: "ccc1", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "PNG" },
        { id: "ccc2", name: "Paint Engine v0", collection: "1 of 1s (2025)", artwork_type: "PNG" },
        { id: "ccc3", name: "Paint Engine v0.9 [Chasing The Dragon]", collection: "1 of 1s (2026)", artwork_type: "PNG" },
        { id: "ccc4", name: "Paint Engine v0.9 [Chasing The Dragon]", collection: "1 of 1s (2026)", artwork_type: "PNG" }
    ];
    cccExtras.forEach(item => pool.push(item));

    const isValid = (item) => item && !selectedIds.has(item.id) && ["PNG", "JPEG", "WEBP"].includes(item.artwork_type);

    (chronologyByYear["2025"] || []).forEach(col => {
        if (col === "BEST BEFORE") return;
        const opts = artworks.filter(a => a.collection === col && isValid(a));
        if (opts.length > 0) pool.push(opts[Math.floor(Math.random() * opts.length)]);
    });

    (chronologyByYear["2024"] || []).forEach(col => {
        if (col === "Manufactured") return; // Exclude Manufactured
        const opts = artworks.filter(a => a.collection === col && isValid(a));
        if (opts.length > 0) pool.push(opts[Math.floor(Math.random() * opts.length)]);
    });

    // 2023: Pick random 4 items from the entire 2023 year
    const all2023 = [];
    const forbidden2023 = ["Cypherville", "Portrait 2490", "Miscellaneous", "Gentlemen"];
    (chronologyByYear["2023"] || []).forEach(col => {
        if (forbidden2023.includes(col)) return; // STRICT EXCLUSION
        const items = artworks.filter(a => a.collection === col && isValid(a));
        all2023.push(...items);
    });
    shuffle(all2023).slice(0, 4).forEach(item => pool.push(item));

    // Shuffle pool and fill selection
    shuffle(pool).slice(0, 60).forEach(item => add(item));


    // ---------------------------------------------------------
    // 2. Interactive Carousel Rendering
    // ---------------------------------------------------------

    // State
    const totalItems = selection.length;
    let activeIndex = 0;
    let dragOffset = 0;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    if (appState.homeInterval) clearInterval(appState.homeInterval);

    // DOM Creation
    const carouselWrapper = document.createElement('div');
    carouselWrapper.className = 'relative w-full h-[450px] md:h-[560px] flex items-center justify-center overflow-hidden -mt-4 md:mt-0'; // Match React heights

    const tracksContainer = document.createElement('div');
    tracksContainer.className = 'relative w-full max-w-7xl h-[380px] md:h-[500px]'; // The track
    carouselWrapper.appendChild(tracksContainer);

    // Build Items
    const loadedImages = new Set(); // Track loaded state
    const itemEls = selection.map((artwork, i) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'absolute top-0 w-[85vw] md:w-[600px] h-full cursor-pointer transition-all duration-500 ease-out';
        itemDiv.style.left = '50%';
        itemDiv.style.transform = 'translateX(-50%)'; // Centered by default

        const src = getCarouselImageSrc(artwork);
        const isPixelated = artwork.artwork_type === 'PNG';
        const isInteractive = artwork.id !== 'SEALED' && artwork.id !== 'EXPIRED';

        // Fix for stretching: enforce object-contain and hide until loaded
        // Fix for blur: enforce image-rendering: pixelated
        // Fix for empty slide: visual loader
        itemDiv.innerHTML = `
            <div class="w-full h-full relative group flex items-center justify-center">
                 <!-- Loader -->
                 <div class="absolute w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 
                 <img src="${src}" 
                    style="width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated;" 
                    class="w-full h-full object-contain opacity-0 transition-opacity duration-500 relative z-10" draggable="false" />
            </div>
        `;

        const img = itemDiv.querySelector('img');
        if (img) {
            img.onload = () => {
                img.classList.remove('opacity-0');
                loadedImages.add(i); // Mark as loaded
            };
            // In case it's cached and already loaded
            if (img.complete) {
                img.classList.remove('opacity-0');
                loadedImages.add(i);
            }
        }


        // Click to Navigate or Open
        itemDiv.onclick = (e) => {
            if (i === activeIndex && !isDragging) {
                if (isInteractive) {
                    const idToOpen = artwork.targetId || artwork.id;
                    window.__openProvenance(idToOpen);
                }
            } else if (!isDragging) {
                setActiveIndex(i);
            }
        };

        tracksContainer.appendChild(itemDiv);
        return itemDiv;
    });



    // Aggressive Preload (Next 10, Immediate)
    // Aggressive Preload (Next 10, Immediate) & Background Sync
    const preloadImage = (index) => {
        if (index < 0 || index >= selection.length) return;
        const art = selection[index];
        new Image().src = getCarouselImageSrc(art);
    };

    // Immediate initial preload (10 items)
    for (let i = 1; i < Math.min(selection.length, 10); i++) {
        preloadImage(i);
    }

    // Background Sync: Load ALL remaining images sequentially
    let bgIndex = 10;
    const bgLoad = () => {
        if (bgIndex >= selection.length) return;
        const art = selection[bgIndex];
        const img = new Image();
        img.src = getCarouselImageSrc(art);
        img.onload = () => {
            bgIndex++;
            // Small delay to yield to main thread interactions
            setTimeout(bgLoad, 20);
        };
        img.onerror = () => {
            bgIndex++;
            bgLoad();
        }
    };
    // Start background sync after initial burst
    setTimeout(bgLoad, 2000);


    // Label Map
    const colToYear = {};
    Object.entries(chronologyByYear).forEach(([y, cols]) => {
        cols.forEach(c => colToYear[c] = y);
    });

    const labelContainer = document.createElement('div');
    // Mobile: mt-2. Desktop: reduced from mt-12 to mt-6 for tighter look.
    labelContainer.className = 'mt-2 md:mt-6 text-center animate-fade-in delay-500 min-h-[4rem] relative z-40';

    // Core Update Logic
    function updateCarousel() {
        itemEls.forEach((el, index) => {
            // Calculate circular distance
            let diff = index - activeIndex;
            if (diff > totalItems / 2) diff -= totalItems;
            if (diff < -totalItems / 2) diff += totalItems;

            const isActive = diff === 0;
            const isPrev = diff === -1;
            const isNext = diff === 1;

            // Reset base styles
            el.style.zIndex = '0';
            el.style.opacity = '0'; // Default hidden (PHANTOM MODE)
            el.style.pointerEvents = 'none';
            // Reset filter on IMG, not EL
            const img = el.querySelector('img');
            if (img) {
                img.style.filter = 'blur(5px) grayscale(100%)';
                img.style.animation = 'none';
                img.style.transitionProperty = 'opacity, transform, filter';
            }
            el.style.transform = 'translateX(-50%) scale(0.8)';

            // Override transition if dragging
            el.style.transition = isDragging ? 'none' : 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';

            if (isActive) {
                el.style.zIndex = '20';
                el.style.opacity = '1';
                el.style.pointerEvents = 'auto';
                if (img) {
                    img.style.filter = 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 3px rgba(232, 220, 180, 0.7)) drop-shadow(0 0 6px rgba(249, 243, 246, 0.3))';
                    img.style.animation = 'pulse-glow 1.8s ease-in-out infinite';
                }
                el.style.transform = `translateX(calc(-50% + ${dragOffset}px)) scale(1)`;
            } else if (isPrev) {
                el.style.zIndex = '10';
                el.style.opacity = '0'; // Phantom opacity
                el.style.pointerEvents = 'auto';
                el.style.transform = `translateX(calc(-120% + ${dragOffset}px)) scale(0.85)`;
            } else if (isNext) {
                el.style.zIndex = '10';
                el.style.opacity = '0'; // Phantom opacity
                el.style.pointerEvents = 'auto';
                el.style.transform = `translateX(calc(20% + ${dragOffset}px)) scale(0.85)`;
            }
        });

        // Update Label
        const item = selection[activeIndex];
        if (item) {
            const year = colToYear[item.collection] || (item.collection === "BEST BEFORE" ? "2025" : "");
            labelContainer.innerHTML = `
              <h4 class="text-sm md:text-base font-bold text-white tracking-widest mb-1 italic opacity-90 text-shadow-sm shadow-black">${item.name || 'Untitled'}</h4>
              <p class="text-[10px] text-white/30 font-mono uppercase tracking-[0.3em] font-light text-shadow-sm shadow-black">${item.collection}</p>
              ${year ? `<p class="text-[9px] text-white/10 font-mono mt-1 tracking-widest font-light text-shadow-sm shadow-black">${year}</p>` : ''}
            `;
        }
    }



    // Smart Skip Helper
    function findNearestLoaded(startIdx, direction) {
        let target = (startIdx + direction + totalItems) % totalItems;
        // If immediate target is loaded, return it
        if (loadedImages.has(target)) return target;

        // Scan ahead through ALL items to find the nearest loaded one
        for (let offset = 1; offset < totalItems; offset++) {
            const candidate = (startIdx + (direction * offset) + totalItems) % totalItems;
            if (candidate === startIdx) continue; // Full circle
            if (loadedImages.has(candidate)) {
                return candidate;
            }
        }

        // If literally nothing else is loaded, fallback to immediate neighbor
        return target;
    }

    function setActiveIndex(newIndex) {
        activeIndex = newIndex;
        // Normalize wrap-around logic for "change" not just display
        // Actually, logic handles arbitrary integers if we mod, but here we just pass direct index.
        updateCarousel();

        // Smart Preload Neighbors
        // We handle wrap-around indices for preloading
        let nextIdx = (activeIndex + 1) % totalItems;
        let prevIdx = (activeIndex - 1 + totalItems) % totalItems;
        preloadImage(nextIdx);
        preloadImage(prevIdx);
        // Aggressively fetch next 5 steps to ensure smart skip has targets
        for (let k = 2; k <= 5; k++) {
            preloadImage((activeIndex + k) % totalItems);
        }
    }

    function next() {
        // Smart Next: Skip unloaded images
        const target = findNearestLoaded(activeIndex, 1);
        setActiveIndex(target);
    }

    function prev() {
        // Smart Prev: Skip unloaded images (scan backwards)
        const target = findNearestLoaded(activeIndex, -1);
        setActiveIndex(target);
    }

    // Auto Play with Smart Skip
    function startAutoPlay() {
        if (appState.homeInterval) clearInterval(appState.homeInterval);
        appState.homeInterval = setInterval(() => {
            if (!isDragging) {
                // Smart Skip Logic
                const target = findNearestLoaded(activeIndex, 1);
                setActiveIndex(target);
            }
        }, 5000);
    }

    // Interactions

    // Touch / Swipe
    const onTouchStart = (e) => {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentX = startX;
        dragOffset = 0;
        if (appState.homeInterval) clearInterval(appState.homeInterval); // Pause on interact
        updateCarousel(); // Remove transition
    };

    const onTouchMove = (e) => {
        if (!isDragging) return;
        const x = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
        currentX = x;
        dragOffset = currentX - startX;
        updateCarousel();
    };

    const onTouchEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;

        const diff = currentX - startX;
        // Increase threshold to 75 to avoid accidental swipes
        if (Math.abs(diff) > 75) {
            // CRITICAL FIX: Reset offset BEFORE navigating so it snaps to center of new index
            dragOffset = 0;
            if (diff > 0) prev();
            else next();
        } else {
            // Snap back to current
            dragOffset = 0;
            updateCarousel();
        }

        // Resume autoplay
        startAutoPlay();
    };

    // Attach Swipe Events to Wrapper
    carouselWrapper.addEventListener('touchstart', onTouchStart, { passive: true });
    carouselWrapper.addEventListener('touchmove', onTouchMove, { passive: true });
    carouselWrapper.addEventListener('touchend', onTouchEnd);

    // Mouse Drag (Desktop "Swipe")
    carouselWrapper.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);

    // Setup Controls (Arrows)
    const createArrow = (dir) => {
        const btn = document.createElement('button');
        const isRight = dir === 'right';
        btn.className = `absolute ${isRight ? 'right-4 md:right-12' : 'left-4 md:left-12'} top-1/2 -translate-y-1/2 z-30 text-white/30 hover:text-white transition-all duration-300 hover:scale-125`;
        btn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="${isRight ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}"></polyline></svg>`;
        btn.onclick = (e) => {
            e.stopPropagation();
            if (appState.homeInterval) clearInterval(appState.homeInterval);
            isRight ? next() : prev();
            startAutoPlay();
        };
        return btn;
    };

    carouselWrapper.appendChild(createArrow('left'));
    carouselWrapper.appendChild(createArrow('right'));

    /* Dots Removed */



    // Keyboard support
    const handleKey = (e) => {
        if (appState.currentFilter !== 'Home') return; // Only if home
        if (e.key === 'ArrowLeft') {
            if (appState.homeInterval) clearInterval(appState.homeInterval);
            prev();
            startAutoPlay();
        }
        if (e.key === 'ArrowRight') {
            if (appState.homeInterval) clearInterval(appState.homeInterval);
            next();
            startAutoPlay();
        }
    };
    window.addEventListener('keydown', handleKey);

    // Initial Start
    galleryGrid.appendChild(carouselWrapper);
    galleryGrid.appendChild(labelContainer);

    updateCarousel();
    startAutoPlay();
}
