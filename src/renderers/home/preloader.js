export function createHomePreloader({ selection, getCarouselImageSrc }) {
    let backgroundTimer = null;
    let backgroundIndex = 10;

    function preloadIndex(index) {
        if (index < 0 || index >= selection.length) return;
        const art = selection[index];
        if (!art) return;
        const img = new Image();
        img.src = getCarouselImageSrc(art);
    }

    function preloadInitialBurst(limit = 10) {
        for (let i = 1; i < Math.min(selection.length, limit); i += 1) {
            preloadIndex(i);
        }
    }

    function stopBackgroundSync() {
        if (backgroundTimer) {
            clearTimeout(backgroundTimer);
            backgroundTimer = null;
        }
    }

    function queueBackgroundSync(delay = 20) {
        stopBackgroundSync();
        backgroundTimer = setTimeout(runBackgroundSyncStep, delay);
    }

    function runBackgroundSyncStep() {
        if (backgroundIndex >= selection.length) {
            backgroundTimer = null;
            return;
        }

        const art = selection[backgroundIndex];
        if (!art) {
            backgroundIndex += 1;
            queueBackgroundSync(0);
            return;
        }

        const img = new Image();
        img.onload = () => {
            backgroundIndex += 1;
            queueBackgroundSync(20);
        };
        img.onerror = () => {
            backgroundIndex += 1;
            queueBackgroundSync(0);
        };
        img.src = getCarouselImageSrc(art);
    }

    function startBackgroundSync(initialDelay = 2000) {
        backgroundIndex = Math.min(10, selection.length);
        queueBackgroundSync(initialDelay);
    }

    function preloadNeighbors(activeIndex, radius = 5) {
        if (!selection.length) return;
        for (let k = 1; k <= radius; k += 1) {
            preloadIndex((activeIndex + k) % selection.length);
            preloadIndex((activeIndex - k + selection.length) % selection.length);
        }
    }

    return {
        preloadIndex,
        preloadInitialBurst,
        preloadNeighbors,
        startBackgroundSync,
        stopBackgroundSync,
    };
}
