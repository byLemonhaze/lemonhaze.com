import montreal from './content/index.html?raw';
import gentlemen from './content/gentlemen.html?raw';
import liminality from './content/liminality.html?raw';
import bestBefore from './content/best-before.html?raw';
import practice from './content/process.html?raw';
import engine from './content/paint-engine.html?raw';
import exhibitions from './content/exhibitions.html?raw';
import collecting from './content/collecting.html?raw';
import artistNotes from './artist-notes.json';
import './style.css';

let navigate = null;
export function configureEditorialNavigation(callback) { navigate = callback; }
const sources = { Montreal: montreal, Gentlemen: gentlemen, Liminality: liminality, 'BEST BEFORE': bestBefore, practice, 'paint-engine': engine, exhibitions, collecting };
const routes = { 'index.html': '/montreal', 'process.html': '/practice', 'paint-engine.html': '/paint-engine', 'gentlemen.html': '/gentlemen', 'liminality.html': '/liminality', 'best-before.html': '/best-before', 'exhibitions.html': '/highlights', 'collecting.html': '/collecting', 'review.html': '/about', 'editorial-sources.md': '/editorial/sources.md', 'sources.md': '/editorial/archive-sources.md' };
const collectionKeys = new Set(['Montreal', 'Gentlemen', 'Liminality', 'BEST BEFORE']);

function scrollToAnchor(hash) {
    const target = document.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
    if (!target) return;
    if (target.tagName === 'DETAILS') target.open = true;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
}

export function wireEditorial(root) {
    root.querySelectorAll('a[href]').forEach(a => {
        const originalUrl = new URL(a.getAttribute('href'), location.href);
        if (['lemonhaze.com', 'www.lemonhaze.com'].includes(originalUrl.hostname)) {
            a.setAttribute('href', originalUrl.pathname + originalUrl.search + originalUrl.hash);
        }
        const href = a.getAttribute('href');
        const [file, rawHash] = href.split('#');
        const hash = rawHash === 'gallery' ? 'artworks' : rawHash;
        if (file.startsWith('assets/')) a.href = '/editorial/' + file;
        if (routes[file]) a.href = routes[file] + (hash ? '#' + hash : '');
        if (a.getAttribute('href').startsWith('/')) {
            a.removeAttribute('target');
        }
    });
    root.querySelectorAll('img[src^="assets/"]').forEach(img => img.src = '/editorial/' + img.getAttribute('src'));
    root.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
    root.addEventListener('click', event => {
        const phase = event.target.closest('[data-phase]');
        if (phase) {
            root.querySelectorAll('[data-phase]').forEach(b => {
                b.setAttribute('aria-selected', String(b === phase));
                b.tabIndex = b === phase ? 0 : -1;
            });
            root.querySelectorAll('[data-phase-panel]').forEach(p => p.hidden = p.dataset.phasePanel !== phase.dataset.phase);
        }
        const launch = event.target.closest('[data-engine]');
        if (launch) {
            const frame = document.createElement('iframe');
            frame.src = '/editorial/assets/paint-engine-v1-07.html';
            frame.title = 'Paint Engine v1.07 interactive study';
            frame.className = 'engine-frame';
            frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
            launch.parentElement.replaceWith(frame);
        }
        const a = event.target.closest('a');
        if (!a || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin || a.target === '_blank' || a.hasAttribute('download')) return;
        if (url.pathname === location.pathname && url.hash) {
            event.preventDefault();
            history.replaceState({}, '', url.pathname + url.hash);
            scrollToAnchor(url.hash);
        } else if (navigate?.(url.pathname, url.hash)) {
            event.preventDefault();
            if (url.hash) {
                history.replaceState({}, '', location.pathname + url.hash);
                requestAnimationFrame(() => scrollToAnchor(url.hash));
            }
        }
    });
    root.querySelectorAll('[data-phase]').forEach(b => b.tabIndex = b.getAttribute('aria-selected') === 'true' ? 0 : -1);
    root.addEventListener('keydown', event => {
        if (!event.target.matches('[data-phase]') || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        const tabs = [...root.querySelectorAll('[data-phase]')];
        const current = tabs.indexOf(event.target);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        event.preventDefault(); tabs[next].click(); tabs[next].focus();
    });
    return root;
}

export function createEditorialPage(key) {
    // These are reviewed editorial fragments. Parse their body in an inert document;
    // never attach their standalone scripts, navigation, styles, or document shell.
    const doc = new DOMParser().parseFromString(sources[key], 'text/html');
    const article = document.createElement('article');
    article.className = 'lh-editorial';
    if (key === 'Montreal') {
        article.append(...doc.querySelector('#additions').children);
    } else {
        const main = doc.querySelector('main');
        main.querySelectorAll('script, .editorial-footer, .page-intro h1').forEach(n => n.remove());
        main.querySelectorAll('.tag').forEach(n => {
            if (n.textContent.startsWith('This local page') || n.textContent.startsWith('Local source:')) n.remove();
        });
        if (key === 'paint-engine') {
            const launch = main.querySelector('[data-engine]');
            launch.textContent = 'Open the paint engine';
            launch.closest('section').querySelector('h2').textContent = 'Explore Passe-Partout';
        }
        if (key === 'BEST BEFORE') main.querySelectorAll('.two-up figcaption').forEach((n, i) => {
            n.textContent = `Framed presentation study ${i + 1} · AI-generated mockup.`;
        });
        if (collectionKeys.has(key)) {
            main.querySelector('.page-intro')?.remove();
            main.querySelectorAll('.essay-section').forEach(section => {
                if (section.querySelector('h2')?.textContent === 'The collection') section.remove();
            });
        }
        if (key === 'exhibitions') {
            main.querySelector('.page-intro')?.remove();
            main.querySelectorAll('.essay-section').forEach(section => {
                if (section.querySelector('.timeline')) section.remove();
            });
        }
        if (key === 'practice') {
            main.querySelector('h1')?.remove();
            const intro = main.querySelector('.intro');
            if (intro) intro.textContent = 'Selected passages from Gentleman SE 2025, with headings for navigation. These are dated reflections from January 2025; the original writing is preserved below.';
        }
        article.append(...main.children);
    }
    article.querySelectorAll('[id=""]').forEach(n => n.removeAttribute('id'));
    // Keep original source attribution alongside the collection reading.
    if (collectionKeys.has(key)) article.id = 'collection-story';
    const back = document.createElement('nav');
    back.className = 'editorial-related';
    back.setAttribute('aria-label', 'Related reading');
    back.innerHTML = collectionKeys.has(key)
        ? '<a href="#artworks">↑ Back to the works</a><a href="/practice">Practice & process →</a><a href="/collecting">Viewing & collecting →</a>'
        : '<a href="/explore">← Explore the practice</a><a href="/about">About Lemonhaze</a><a href="/paint-engine">Explore the paint engine →</a>';
    article.appendChild(back);
    return wireEditorial(article);
}

export function appendCollectionStory({ collection, galleryGrid, currentViewMeta }) {
    if (!collectionKeys.has(collection)) {
        const nav = document.createElement('nav');
        nav.className = 'editorial-jumps';
        nav.setAttribute('aria-label', 'Related reading');
        nav.innerHTML = '<a href="/explore">Explore the practice →</a>';
        currentViewMeta?.appendChild(wireEditorial(nav));
        return;
    }
    const article = createEditorialPage(collection);
    article.classList.add('collection-story');
    galleryGrid.id = 'gallery-grid';
    // The original gallery cards and their order are retained; the essay spans the next row.
    galleryGrid.prepend(Object.assign(document.createElement('span'), { id: 'artworks', className: 'editorial-anchor' }));
    galleryGrid.appendChild(article);
    const nav = document.createElement('nav');
    nav.className = 'editorial-jumps';
    nav.setAttribute('aria-label', 'Collection contents');
    nav.innerHTML = '<a href="#artworks">Artworks</a><a href="#collection-story">About this series ↓</a>';
    if (collection === 'BEST BEFORE') nav.innerHTML += '<a href="#diary">Read the diary ↓</a>';
    if (collection === 'Montreal') nav.innerHTML += '<a href="#exhibition">Exhibition ↓</a>';
    nav.innerHTML += '<a href="/explore">Explore the practice →</a>';
    currentViewMeta?.appendChild(wireEditorial(nav));
}

export function enhanceAbout(aboutText) {
    const wrap = document.createElement('div');
    wrap.innerHTML = aboutText;
    const entry = readingLink('/explore', 'Explore the practice →', 'Process, tools, and the stories behind the collections.');
    entry.classList.add('editorial-about-links');
    wrap.appendChild(entry);
    return wrap;
}

export function createExplorePractice() {
    const hub = document.createElement('article');
    hub.className = 'lh-editorial';
    hub.innerHTML = `<p class="lead">Process, tools, and the stories behind the collections.</p>
      <a class="card-link" href="/practice"><strong>Practice & process →</strong><span>Texture, selection, and writing in the artist’s own words.</span></a>
      <a class="card-link" href="/paint-engine"><strong>An evolving paint engine →</strong><span>Inscribed milestones, controls, and an interactive study.</span></a>
      <a class="card-link" href="/highlights"><strong>Exhibitions & career →</strong><span>Selected documentation and the full career record.</span></a>
      <a class="card-link" href="/collecting"><strong>Viewing & collecting →</strong><span>How to explore a work, display it, and get in touch.</span></a>
      <section class="essay-section"><h2>In the collections</h2>
        <a class="card-link" href="/montreal#collection-story"><strong>Montreal →</strong><span>Memories, textures, and the notes that accompany each work.</span></a>
        <a class="card-link" href="/gentlemen#collection-story"><strong>Gentlemen →</strong><span>The original statement and an aspiration that keeps changing.</span></a>
        <a class="card-link" href="/best-before#diary"><strong>BEST BEFORE →</strong><span>Making the work, living with time, and the complete diary.</span></a>
        <a class="card-link" href="/liminality#collection-story"><strong>Liminality →</strong><span>The personal transition behind the series.</span></a>
      </section>`;
    return wireEditorial(hub);
}

export function enhanceHighlights(original) {
    const wrap = document.createElement('div');
    wrap.append(original, readingLink('/explore', 'Explore the practice →', 'Read about the process and stories behind the works.'), createEditorialPage('exhibitions'));
    return wrap;
}

export function readingLink(href, title, description) {
    const node = document.createElement('div');
    node.className = 'lh-editorial editorial-entry';
    const a = document.createElement('a'); a.className = 'card-link'; a.href = href;
    const strong = document.createElement('strong'); strong.textContent = title;
    const span = document.createElement('span'); span.textContent = description;
    a.append(strong, span); node.append(a);
    return wireEditorial(node);
}

export function createArtistNotes(item) {
    const notes = artistNotes[item.id];
    const isSE = item.id === '627d9a054e2db14bc892cec8a747da726dbadc1677079ff49675b17f78e262d8i0';
    if (!notes && !isSE) return null;
    const node = document.createElement('div');
    node.className = 'lh-editorial artwork-artist-notes';
    for (const text of notes || []) {
        const p = document.createElement('p'); p.className = 'verbatim'; p.textContent = text; node.appendChild(p);
    }
    const cite = document.createElement('cite');
    cite.textContent = 'Original artist writing · inscription HTML archive'; node.appendChild(cite);
    if (isSE) {
        const a = document.createElement('a'); a.href = '/practice'; a.textContent = 'Read the complete statement & process →'; node.appendChild(a);
    }
    return wireEditorial(node);
}
