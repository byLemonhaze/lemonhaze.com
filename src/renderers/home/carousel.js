// These works are animated by their original inscribed HTML, not a recording.
const PORCELAIN_ID = '4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0';
const LOTUS_ID = '22c45a61ac26e42545e29a1c0af72190134f94f489596619f0b0e023908952e3i0';
const LIVE_CAROUSEL_IDS = new Set([PORCELAIN_ID, LOTUS_ID]);

// Match the original inscriptions' display bounds so the poster-to-live handoff
// does not resize the artwork. The inscription itself remains untouched.
function liveArtworkBounds(id, width, height) {
    if (id === PORCELAIN_ID) {
        const side = Math.min(.92 * Math.min(width, height), 720,
            width - 2 * Math.max(8, .015 * Math.min(width, height)),
            height - 2 * Math.max(8, .015 * Math.min(width, height)));
        return { width: Math.max(0, side), height: Math.max(0, side) };
    }
    if (id === LOTUS_ID) {
        const artworkHeight = Math.min(height, width * 16 / 9) * .9;
        return { width: artworkHeight * 9 / 16, height: artworkHeight };
    }
    return null;
}

export function createHomeCarousel({ appState, selection, chronologyByYear, toCollectionSlug, onOpenArtworkById, getCarouselImageSrc }) {
    let activeIndex = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let paused = reducedMotion;
    let motionEnabled = !reducedMotion;
    let pointerStart = null;
    let dragged = false;
    const root = document.createElement('section');
    root.className = 'curated-carousel';
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', 'Selected artworks');
    const top = document.createElement('div'); top.className = 'carousel-heading';
    top.innerHTML = '<span>Selected works</span><a href="/selected">Explore ↗︎</a>';
    const stage = document.createElement('div'); stage.className = 'carousel-stage';
    const slides = selection.map((work, index) => {
        const link = document.createElement('a'); link.className = 'carousel-slide';
        link.href = work.href || '/' + work.id;
        link.setAttribute('aria-label', `View ${work.name}`);
        const image = document.createElement('img'); image.src = getCarouselImageSrc(work);
        image.alt = work.name + ' by Lemonhaze'; image.decoding = 'async';
        image.loading = index < 2 ? 'eager' : 'lazy';
        image.fetchPriority = index === 0 ? 'high' : 'auto';
        link.appendChild(image);
        if (LIVE_CAROUSEL_IDS.has(work.id)) {
            const frame = document.createElement('iframe');
            frame.className = 'carousel-live-artwork';
            frame.title = `${work.name} · live inscription`;
            frame.dataset.inscriptionSrc = `https://ordinals.com/content/${work.id}`;
            frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            frame.setAttribute('aria-hidden', 'true');
            frame.tabIndex = -1;
            frame.addEventListener('load', () => {
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (frame.isConnected && frame.getAttribute('src') === frame.dataset.inscriptionSrc && link.classList.contains('is-active')) link.classList.add('live-ready');
                }));
            });
            link.appendChild(frame);
        }
        link.onclick = event => {
            if (dragged) { event.preventDefault(); return; }
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (work.href) return;
            event.preventDefault(); onOpenArtworkById(work.id);
        };
        stage.appendChild(link); return link;
    });
    const bottom = document.createElement('div'); bottom.className = 'carousel-bottom';
    const caption = document.createElement('div'); caption.className = 'carousel-caption';
    const title = document.createElement('a'); const detail = document.createElement('p');
    const collectionLink = document.createElement('a');
    const yearLabel = document.createTextNode('');
    detail.append(collectionLink, yearLabel);
    caption.append(title, detail);
    const controls = document.createElement('div'); controls.className = 'carousel-controls';
    controls.innerHTML = '<button type="button" aria-label="Previous artwork">←</button><span class="carousel-position"></span><button type="button" aria-label="Next artwork">→</button><button type="button" class="carousel-pause"></button>';
    const [previous, next, pause] = controls.querySelectorAll('button');
    const count = controls.querySelector('.carousel-position');
    bottom.append(caption, controls); root.append(top, stage, bottom);
    function sizeLivePosters() {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        slides.forEach((slide, index) => {
            const bounds = liveArtworkBounds(selection[index].id, width, height);
            if (!bounds) return;
            const image = slide.querySelector('img');
            image.style.width = bounds.width + 'px';
            image.style.height = bounds.height + 'px';
        });
    }
    const stageObserver = new ResizeObserver(sizeLivePosters);
    function update() {
        slides.forEach((slide, index) => {
            const active = index === activeIndex;
            slide.classList.toggle('is-active', active);
            slide.setAttribute('aria-hidden', String(!active));
            slide.tabIndex = active ? 0 : -1;
            if (active) slide.querySelector('img').loading = 'eager';
            const frame = slide.querySelector('iframe');
            if (frame) {
                if (active && motionEnabled && !document.hidden) {
                    if (frame.getAttribute('src') !== frame.dataset.inscriptionSrc) frame.src = frame.dataset.inscriptionSrc;
                } else if (frame.hasAttribute('src')) {
                    slide.classList.remove('live-ready');
                    frame.removeAttribute('src');
                }
            }
        });
        const work = selection[activeIndex];
        const year = work.year || Object.entries(chronologyByYear).find(([, collections]) => collections.includes(work.collection))?.[0] || String(work.timestamp || '').slice(0, 4);
        title.textContent = work.name; title.href = work.href || '/' + work.id;
        collectionLink.hidden = !work.collection;
        collectionLink.textContent = work.series || work.collection || '';
        if (work.collection) collectionLink.href = '/' + toCollectionSlug(work.collection);
        else collectionLink.removeAttribute('href');
        yearLabel.textContent = work.caption || ` · ${year}`;
        count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(selection.length).padStart(2, '0')}`;
        pause.textContent = paused ? 'Play' : 'Pause';
        pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    }
    function stop() { if (appState.homeInterval) clearInterval(appState.homeInterval); appState.homeInterval = null; }
    function play() { stop(); if (!paused) appState.homeInterval = setInterval(() => move(1, false), 7000); }
    function move(direction, manual = true) { activeIndex = (activeIndex + direction + selection.length) % selection.length; if (manual) { paused = true; stop(); } update(); }
    previous.onclick = () => move(-1); next.onclick = () => move(1);
    pause.onclick = () => { paused = !paused; if (!paused) motionEnabled = true; update(); play(); };
    const onVisibilityChange = () => { update(); if (document.hidden) stop(); else play(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    stage.addEventListener('pointerdown', event => { pointerStart = event.clientX; dragged = false; });
    const onPointerUp = event => { if (pointerStart === null) return; const delta = event.clientX - pointerStart; pointerStart = null; if (Math.abs(delta) > 60) { dragged = true; move(delta > 0 ? -1 : 1); } };
    window.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('dragstart', event => event.preventDefault());
    root.addEventListener('keydown', event => { if (event.target.matches('button')) return; if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } });
    return {
        mount(container) { container.appendChild(root); sizeLivePosters(); stageObserver.observe(stage); update(); play(); },
        cleanup() { stop(); stageObserver.disconnect(); document.removeEventListener('visibilitychange', onVisibilityChange); slides.forEach(slide => slide.querySelector('iframe')?.removeAttribute('src')); window.removeEventListener('pointerup', onPointerUp); root.remove(); },
    };
}
