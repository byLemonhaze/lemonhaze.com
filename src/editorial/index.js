import { createArchivePage, archiveLinksForCollection, archiveEntries } from './archive.js';
import { getArtworkImageSrc } from '../renderers/gallery.js';
import { normalizeEditorialHref } from './links.js';
import {storyKeys, storySections, storyDirectory, artworkFootnotes} from './story-renderer.js';
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
const collectionKeys = new Set(['Montreal', 'Gentlemen', 'Liminality', 'BEST BEFORE', ...storyKeys]);

function scrollToAnchor(hash) {
    const target = document.getElementById(decodeURIComponent(hash.replace(/^#/, '')));
    if (!target) return;
    if (target.tagName === 'DETAILS') target.open = true;
    target.scrollIntoView({ block: 'start', behavior: 'instant' });
    target.classList.add('editorial-anchor-target');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
}

export function wireEditorial(root) {
    root.querySelectorAll('a[href]').forEach(a => {
        a.setAttribute('href', normalizeEditorialHref(a.getAttribute('href'), location.href));
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
        } else if (!/\.[a-z0-9]+$/i.test(url.pathname) && navigate?.(url.pathname, url.hash)) {
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
    const doc = storyKeys.includes(key) ? null : new DOMParser().parseFromString(sources[key], 'text/html');
    const article = document.createElement('article');
    article.className = 'lh-editorial';
    if (storyKeys.includes(key)) {
        article.append(...storySections(key).children);
    } else if (key === 'Montreal') {
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
    const archiveLinks = archiveLinksForCollection(key);
    if (archiveLinks) article.appendChild(archiveLinks);
    if (key === 'practice') illustratePractice(article);
    if (key === 'collecting') {
        const prints = document.createElement('section');
        prints.className = 'essay-section';
        prints.innerHTML = `<h2>At the print table</h2><div class="two-up"><figure class="wide-figure"><a href="/archive#good-night-print"><img src="/editorial/archive/m044.webp" alt="Lemonhaze signing Good Night" width="900" height="1200"></a><figcaption>Signing Good Night, from Downtown. <a href="/archive#good-night-print">View the print →</a></figcaption></figure><figure class="wide-figure"><a href="/archive#signing-pennsylvania"><img src="/editorial/archive/pennsylvania-signing.webp" alt="Video frame showing Lemonhaze signing Pennsylvania"></a><figcaption>Signing Pennsylvania · still from the film. <a href="/archive#signing-pennsylvania">Watch the signing →</a></figcaption></figure></div>`;
        article.appendChild(prints);
    }
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
        const first = archiveEntries.find(entry => entry.collections.includes(collection));
        if (first) nav.innerHTML += `<a href="/archive#${first.slug}">From the archive →</a>`;
        currentViewMeta?.appendChild(wireEditorial(nav));
        return;
    }
    const article = createEditorialPage(collection);
    article.classList.add('collection-story');
    galleryGrid.id = 'gallery-grid';
    galleryGrid.classList.add('relative');
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

export function createExplorePractice(artworks = [], toCollectionSlug = () => '') {
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
    hub.appendChild(storyDirectory());
    const topCards = document.createElement('div'); topCards.className = 'practice-paths';
    const initial = [...hub.children].filter(child => child.matches('a.card-link'));
    initial[0].before(topCards); initial.forEach(card => topCards.appendChild(card));
    const selected = {
        '/practice': ['/editorial/archive/m002.webp', 'A close view of layered digital textures'],
        '/paint-engine': ['/editorial/archive/paint-engine-v0-selected.webp', 'Selected Paint Engine v0 output in blue, green, yellow and purple'],
        '/highlights': ['https://blog.gamma.io/hs-fs/hubfs/LH%20in%20Suburbs.jpeg?width=2412&height=804&name=LH%20in%20Suburbs.jpeg', 'Full panoramic view of Montreal at Suburbs Gallery'],
        '/collecting': ['/editorial/archive/m044.webp', 'Lemonhaze signing a physical print of Good Night from Downtown'],
    };
    hub.querySelectorAll('a.card-link').forEach(card => {
        const path = card.getAttribute('href').split('#')[0];
        const work = path === '/montreal'
            ? artworks.find(work => work.name === 'Five Roses' && work.collection === 'Montreal')
            : path === '/orphelinat'
            ? artworks.find(work => work.name === 'Hosoi' && work.collection === 'Orphelinat')
            : path === '/deprivation-prints'
            ? artworks.find(work => work.name === 'Deprivation')
            : artworks.find(work => '/' + toCollectionSlug(work.collection) === path);
        const image = selected[path] || (work ? [getArtworkImageSrc(work), work.name+' by Lemonhaze'] : null);
        if (!image) return;
        const text = document.createElement('div'); text.className = 'practice-card-text';
        text.append(...card.childNodes);
        const img = document.createElement('img'); img.src = image[0]; img.alt = image[1];
        card.classList.add('practice-image-link'); card.append(img, text);
    });
    const archive = document.createElement('section'); archive.className = 'essay-section practice-archive-invite practice-archive-text';
    archive.innerHTML = `<div><p class="eyebrow">Keep exploring</p><h2>From the archive</h2><p>A house becomes a painting. A photograph becomes a textured work. Stories, experiments and images connect the finished works to the life around them.</p><a href="/archive">Explore the archive →</a></div>`;
    topCards.after(archive);
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
    const footnotes = artworkFootnotes(item.id);
    const relatedArchive = archiveEntries.filter(entry => entry.related.some(link => link.href === '/' + item.id));
    if (!notes && !isSE && !footnotes && !relatedArchive.length) return null;
    const node = document.createElement('div');
    node.className = 'lh-editorial artwork-artist-notes';
    for (const text of notes || []) {
        const p = document.createElement('p'); p.className = 'verbatim'; p.textContent = text; node.appendChild(p);
    }
    if (notes || isSE) {
        const cite = document.createElement('cite');
        cite.textContent = 'Original artist writing · inscription HTML archive'; node.appendChild(cite);
    }
    if (footnotes) node.appendChild(footnotes);
    relatedArchive.forEach(entry => { const a = document.createElement('a'); a.href = '/archive#' + entry.slug; a.className = 'reading-link'; a.textContent = entry.title + ' →'; node.appendChild(a); });
    if (isSE) {
        const a = document.createElement('a'); a.href = '/practice'; a.textContent = 'Read the complete statement & process →'; node.appendChild(a);
    }
    return wireEditorial(node);
}

export function createArchive(artworks, toCollectionSlug) {
    return wireEditorial(createArchivePage(artworks, toCollectionSlug));
}
function illustratePractice(article) {
    const headings = [...article.querySelectorAll('h2')];
    headings.find(h => h.textContent === 'Texture')?.insertAdjacentHTML('afterend', `<figure class="wide-figure"><a href="/archive#paint-engine-layers"><img src="/editorial/archive/m002.webp" alt="Close-up of layered ink-like shapes, sampled fragments and woven digital texture" width="1200" height="533"></a><figcaption>Layers, sampled fragments and texture. <a href="/archive#paint-engine-layers">Inside the process →</a></figcaption></figure>`);
    headings.find(h => h.textContent === 'Selecting the work')?.insertAdjacentHTML('afterend', `<div class="practice-comparison"><figure><img src="/editorial/archive/m004.webp" alt="Revaler Straße 99"><figcaption>Revaler Straße 99 · Krita</figcaption></figure><figure><img src="/editorial/archive/m005.webp" alt="Avant le Crépuscule"><figcaption>Avant le Crépuscule · AI, Krita and p5.js</figcaption></figure><figure><img src="/editorial/archive/m006.webp" alt="From Berlin to Saigon"><figcaption>From Berlin to Saigon · p5.js</figcaption></figure></div><p class="source-line">Three separate works, illustrating an evolving approach. <a href="/archive#three-techniques">Follow the development →</a></p>`);
    headings.find(h => h.textContent === 'Writing as part of the work')?.insertAdjacentHTML('afterend', `<figure class="wide-figure practice-writing-image"><a href="/archive#gentlemen-work-in-progress"><img src="/editorial/archive/m026.webp" alt="Gentleman Special Edition 2025"></a><figcaption>Gentleman Special Edition 2025 carries the original writing preserved on this page.</figcaption></figure>`);
}
