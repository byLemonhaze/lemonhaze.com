import { showComingSoon } from '../ui/coming-soon.js';
import { selectedWorks, SELECTED_SERIES, SELECTED_SERIES_COVERS } from './selection.js';
import { getArtworkImageSrc } from '../renderers/gallery.js';
import { wireEditorial } from '../editorial/index.js';
import { FEATURED_PAINT_ENGINES } from '../data/paint-engines.js';

const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const year = work => work.year || String(work.timestamp || '').slice(0, 4);
function seriesCover(title, artworks, toCollectionSlug) {
    if (title === 'BEST BEFORE') return { src: '/editorial/assets/bb-lifecycle.webp', alt: 'BEST BEFORE · Sealed, Opened, Expired' };
    const work = artworks.find(work => work.id === SELECTED_SERIES_COVERS[title])
        || artworks.find(work => work.series === title && work.role === 'parent')
        || artworks.find(work => work.collection === title || toCollectionSlug(work.collection) === SELECTED_SERIES.find(s => s[0] === title)?.[1]);
    return { src: work ? getArtworkImageSrc(work) : '', alt: work?.name || title };
}
function seriesCard([title, slug, description, collectionLinks], artworks, toCollectionSlug) {
    const coverWork = artworks.find(work => work.id === SELECTED_SERIES_COVERS[title]);
    const coverSlug = collectionLinks && coverWork ? toCollectionSlug(coverWork.collection) : slug;
    const coverLabel = collectionLinks?.find(([, path]) => path === coverSlug)?.[0] || title;
    const cover = seriesCover(title, artworks, toCollectionSlug);
    const years = title === '1/1s'
        ? `<nav class="selected-series-years" aria-label="1/1 works by year">${[2026, 2025, 2024].map(year => `<a href="/1-of-1s-${year}">${year}</a>`).join('')}</nav>`
        : '';
    const heading = collectionLinks
        ? collectionLinks.map(([label, path]) => `<a class="selected-series-collection-link" href="/${path}">${escape(label)}&nbsp;↗︎</a>`).join(' / ')
        : `<a href="/${slug}">${escape(title)} <span aria-hidden="true">↗︎</span></a>`;
    return `<article class="selected-series-card"><div><a href="/${coverSlug}" aria-label="Explore ${escape(coverLabel)}"><img src="${escape(cover.src)}" alt="${escape(cover.alt)}" loading="lazy"></a></div><h3>${heading}</h3>${description ? `<p>${escape(description)}</p>` : ''}${years}</article>`;
}
export function createSelectedWork(artworks, toCollectionSlug) {
    const root = document.createElement('article');
    root.className = 'curated-page';
    root.innerHTML = `<div class="curated-intro"><p class="curated-kicker">A selection · 2023–2026</p><h1>An evolving practice.</h1><p>Individual works, selected series, and generative paint engines. Different approaches to image, texture, and composition.</p><a class="curated-text-link" href="/practice">On the practice ↗︎</a></div>
      <nav class="curated-page-nav" aria-label="Selected Work contents"><a href="#selected-artworks">Individual works ↓</a><a href="#selected-series">Selected series ↓</a><a href="#selected-engines">Paint Engines ↓</a></nav><div class="selected-work-grid" id="selected-artworks">${selectedWorks(artworks).map((work, i) => `<figure>${work.comingSoon ? `<button type="button" class="selected-image" data-coming-soon aria-label="Untitled — coming soon">` : `<a class="selected-image" href="${escape(work.href || "/" + work.id)}">`}<img src="${escape(getArtworkImageSrc(work))}" alt="${escape(work.name)} by Lemonhaze" loading="lazy">${work.comingSoon ? "</button>" : "</a>"}<figcaption><span class="work-number">${String(i + 1).padStart(2, '0')}</span>${work.comingSoon ? `<button type="button" data-coming-soon>${escape(work.name)}</button>` : `<a href="${escape(work.href || "/" + work.id)}">${escape(work.name)}</a>`}<span>${escape(work.caption || year(work))}</span></figcaption>${work.collection ? `<a class="selected-collection-link" href="/${toCollectionSlug(work.collection)}">${escape(work.series || work.collection)} →</a>` : ""}</figure>`).join('')}</div>
      <section class="curated-series" id="selected-series"><div class="curated-section-heading"><h2>Selected series</h2><p>Distinct bodies of work, each with its own story.</p></div><div class="selected-series-grid">${SELECTED_SERIES.map(series => seriesCard(series, artworks, toCollectionSlug)).join('')}</div></section>
      <section class="selected-engines curated-series" id="selected-engines" aria-labelledby="selected-engines-title">
        <div class="curated-section-heading"><div><p class="curated-kicker">Generative painting · Prints · Interiors</p><h2 id="selected-engines-title">Paint Engines</h2></div><a class="curated-text-link" href="/paint-engine">Explore the engines ↗︎</a></div>
        <div class="selected-engines-intro"><p>The engines are part of the practice itself: self-contained generative painting systems, inscribed on Bitcoin. Each version offers a different way to work with colour, texture, and composition.</p><p>They also extend the work into physical spaces, through prints and bespoke commissions for hotels, rental properties, and private residences. A single engine can generate an entire set of works, customized to a space, a palette, or personal preferences.</p></div>
        <div class="selected-engine-grid">${FEATURED_PAINT_ENGINES.map(engine => `<figure><a class="selected-engine-image" href="/${engine.id}" aria-label="Explore ${escape(engine.name)}"><img src="https://cdn.lemonhaze.com/assets/assets/${engine.image || engine.id + '.png'}" alt="${escape(engine.coverName || engine.name)} · Paint Engine output by Lemonhaze" loading="lazy"></a><figcaption><h3><a href="/${engine.id}">${escape(engine.name)} <span aria-hidden="true">↗︎</span></a></h3><p>${escape(engine.caption || `Paint Engine ${engine.version} · 2026`)}</p></figcaption></figure>`).join('')}</div>
      </section>
      <p class="curated-footnote">Every collection remains accessible by year in All Works. <a href="/visualizer/">View the visual chronology ↗︎</a></p>`;
    root.querySelectorAll("[data-coming-soon]").forEach(button => button.addEventListener("click", showComingSoon));
    return wireEditorial(root);
}
export function createPracticeOverview(artworks) {
    const root = document.createElement('article');
    root.className = 'curated-page practice-page';
    const work = artworks.find(work => work.name === 'Wondrous Place');
    root.innerHTML = `<div class="curated-intro"><p class="curated-kicker">The practice</p><h1>Image. Texture.<br>Time.</h1><p>The work begins with an image, a mark, a system, or some combination of the three.</p></div>
      ${work ? `<figure class="practice-hero"><a href="${escape(work.href || "/" + work.id)}"><img src="${escape(getArtworkImageSrc(work))}" alt="Wondrous Place" loading="lazy"></a><figcaption>Wondrous Place · ${year(work)}</figcaption></figure>` : ''}
      <div class="practice-chapters"><section><span>01</span><div><h2>The mark and the ground</h2><p>Black, ink-like forms are a recurring thread: a mark against a shifting background, carried across individual works and series.</p><nav><a href="/selected">See the selected works ↗︎</a><a href="/chrysalis">Chrysalis ↗︎</a></nav></div></section>
      <section><span>02</span><div><h2>Place, identity, change</h2><p>Memories become compositions. An aspiration develops over time. A period of transition takes the form of a series. These subjects return through different visual approaches.</p><nav><a href="/gentlemen#collection-story">Gentlemen ↗︎</a><a href="/lotus">Lotus ↗︎</a><a href="/montreal#collection-story">Montreal ↗︎</a><a href="/liminality#collection-story">Liminality ↗︎</a></nav></div></section>
      <section><span>03</span><div><h2>Working with a system</h2><p>Code is part of the image. Recent works are built in vanilla JavaScript and WebGL, without external libraries, written in part with large language models. The code, the logic, and the image belong to the same object: a small system made to run from what is inscribed.</p>
        <p>The Paint Engines open some of those systems. Another person can enter, decide, and produce an image. The engine is authored; the outcome is not predetermined.</p><nav><a href="/manufactured#collection-story">Manufactured ↗︎</a><a href="/games#collection-story">Games ↗︎</a><a href="/best-before#diary">BEST BEFORE ↗︎</a><a href="/paint-engine">Paint Engines ↗︎</a></nav></div></section>
      <section><span>04</span><div><h2>Beyond the screen</h2><p>The same systems extend into prints and bespoke visual environments for hotels, rental properties, and private residences.</p><nav><a href="/collecting">Viewing & collecting ↗︎</a></nav></div></section></div>
      <section class="curated-closing"><div><h2>Further into the studio</h2><p>Original writing, process photographs, and the stories around the works.</p></div><nav><a href="/archive">Read the Studio Notes →</a></nav></section>`;
    return wireEditorial(root);
}
