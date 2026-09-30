import { selectedWorks, SELECTED_SERIES, SELECTED_SERIES_COVERS } from './selection.js';
import { getArtworkImageSrc } from '../renderers/gallery.js';
import { wireEditorial } from '../editorial/index.js';

const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const year = work => work.year || String(work.timestamp || '').slice(0, 4);
function seriesCover(title, artworks, toCollectionSlug) {
    if (title === 'BEST BEFORE') return { src: '/editorial/assets/bb-lifecycle.webp', alt: 'BEST BEFORE · sealed, revealed, expired' };
    const work = artworks.find(work => work.id === SELECTED_SERIES_COVERS[title])
        || artworks.find(work => work.series === title && work.role === 'parent')
        || artworks.find(work => work.collection === title || toCollectionSlug(work.collection) === SELECTED_SERIES.find(s => s[0] === title)?.[1]);
    return { src: work ? getArtworkImageSrc(work) : '', alt: work?.name || title };
}
function seriesCard([title, slug, description], artworks, toCollectionSlug) {
    const cover = seriesCover(title, artworks, toCollectionSlug);
    const years = title === '1/1s'
        ? `<nav class="selected-series-years" aria-label="1/1 works by year">${[2026, 2025, 2024].map(year => `<a href="/1-of-1s-${year}">${year}</a>`).join('')}</nav>`
        : '';
    return `<article class="selected-series-card"><div><a href="/${slug}" aria-label="Explore ${escape(title)}"><img src="${escape(cover.src)}" alt="${escape(cover.alt)}" loading="lazy"></a></div><h3><a href="/${slug}">${escape(title)} <span aria-hidden="true">↗︎</span></a></h3>${description ? `<p>${escape(description)}</p>` : ''}${years}</article>`;
}
export function createSelectedWork(artworks, toCollectionSlug) {
    const root = document.createElement('article');
    root.className = 'curated-page';
    root.innerHTML = `<div class="curated-intro"><p class="curated-kicker">A selection · 2023–2026</p><h1>Marks, textures,<br>changing grounds.</h1><p>Black, ink-like forms run through these works, across different backgrounds, collections, and years.</p><a class="curated-text-link" href="/explore">On the practice ↗︎</a></div>
      <nav class="curated-page-nav" aria-label="Selected Work contents"><a href="#selected-artworks">Individual works ↓</a><a href="#selected-series">Selected series ↓</a></nav><div class="selected-work-grid" id="selected-artworks">${selectedWorks(artworks).map((work, i) => `<figure><a class="selected-image" href="/${work.id}"><img src="${escape(getArtworkImageSrc(work))}" alt="${escape(work.name)} by Lemonhaze" loading="lazy"></a><figcaption><span class="work-number">${String(i + 1).padStart(2, '0')}</span><a href="/${work.id}">${escape(work.name)}</a><span>${escape(year(work))}</span></figcaption><a class="selected-collection-link" href="/${toCollectionSlug(work.collection)}">${escape(work.series || work.collection)} →</a></figure>`).join('')}</div>
      <section class="curated-series" id="selected-series"><div class="curated-section-heading"><h2>Selected series</h2><p>Distinct bodies of work, each with its own story.</p></div><div class="selected-series-grid">${SELECTED_SERIES.map(series => seriesCard(series, artworks, toCollectionSlug)).join('')}</div></section>
      <section class="curated-closing"><div><p class="curated-kicker">Systems & possibilities</p><h2>Paint Engines</h2><p>Generative painting, prints, and commissioned visual environments.</p></div><a class="curated-text-link" href="/paint-engine">Explore the engines ↗︎</a></section>
      <p class="curated-footnote">Every collection remains accessible by year in All Works. <a href="/visualizer/">View the visual chronology ↗︎</a></p>`;
    return wireEditorial(root);
}
export function createPracticeOverview(artworks) {
    const root = document.createElement('article');
    root.className = 'curated-page practice-page';
    const work = artworks.find(work => work.name === 'Insaisissable Mirage');
    root.innerHTML = `<div class="curated-intro"><p class="curated-kicker">The practice</p><h1>Image. Texture.<br>Time.</h1><p>Generative images, digital texture, and personal writing. A practice shaped by memories of place, questions of identity, and periods of change.</p></div>
      ${work ? `<figure class="practice-hero"><a href="/${work.id}"><img src="${escape(getArtworkImageSrc(work))}" alt="Insaisissable Mirage" loading="lazy"></a><figcaption>Insaisissable Mirage · ${year(work)}</figcaption></figure>` : ''}
      <div class="practice-chapters"><section><span>01</span><div><h2>The mark and the ground</h2><p>Black, ink-like forms are a recurring thread: a mark against a shifting background, carried across individual works and series.</p><nav><a href="/selected">See the selected works ↗︎</a><a href="/chrysalis">Chrysalis ↗︎</a></nav></div></section>
      <section><span>02</span><div><h2>Place, identity, change</h2><p>Memories become compositions. An aspiration develops over time. A period of transition takes the form of a series. These subjects return through different visual approaches.</p><nav><a href="/gentlemen#collection-story">Gentlemen ↗︎</a><a href="/lotus">Lotus ↗︎</a><a href="/montreal#collection-story">Montreal ↗︎</a><a href="/liminality#collection-story">Liminality ↗︎</a></nav></div></section>
      <section><span>03</span><div><h2>Working with a system</h2><p>Code is part of making the image. So are iteration, texture, and choosing what to keep. In BEST BEFORE, time becomes part of the work itself.</p><nav><a href="/manufactured#collection-story">Manufactured ↗︎</a><a href="/games#collection-story">Games ↗︎</a><a href="/best-before#diary">BEST BEFORE ↗︎</a></nav></div></section>
      <section><span>04</span><div><h2>Beyond the screen</h2><p>Paint Engines extend into prints and bespoke visual environments for hotels, Airbnb properties, and private residences.</p><nav><a href="/paint-engine">Paint Engines ↗︎</a><a href="/collecting">Viewing & collecting ↗︎</a></nav></div></section></div>
      <section class="curated-closing"><div><h2>Further into the studio</h2><p>Original writing, process photographs, and the stories around the works.</p></div><nav><a href="/archive">Read the Studio Notes →</a></nav></section>`;
    return wireEditorial(root);
}
