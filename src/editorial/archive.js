import archive from './archive-data.json';
import { filterArchiveEntries } from './archive-model.js';
import { getArtworkImageSrc } from '../renderers/gallery.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const archiveEntries = archive.entries;
function imageTag(image, className = '') {
    return `<img class="${className}" src="${escape(image.src)}" alt="${escape(image.alt)}" ${image.width ? `width="${image.width}" height="${image.height}"` : ''} loading="lazy" decoding="async">`;
}
function coverFor(entry, artworks) {
    // Keep the signing photograph inside the story; its thumbnail shows the work.
    if (entry.slug === 'good-night-print') {
        const work = artworks.find(work => work.name === 'Good Night');
        if (work) return {src:getArtworkImageSrc(work),alt:'Good Night by Lemonhaze'};
    }
    if (entry.video) return {src:entry.video.poster,alt:entry.video.title};
    if (entry.images[0]) return entry.images[0];
    const work = artworks.find(work => entry.related.some(link => link.href === '/'+work.id))
        || artworks.find(work => entry.collections.includes(work.collection));
    return work ? {src:getArtworkImageSrc(work),alt:work.name+' by Lemonhaze'} : null;
}
export function archiveLinksForCollection(collection) {
    const entries = archive.entries.filter(entry => entry.collections.includes(collection));
    if (!entries.length) return null;
    const section = document.createElement('section');
    section.className = 'essay-section archive-related';
    section.innerHTML = `<h2>From the archive</h2><div class="archive-related-links">${entries.map(entry => `<a href="/archive#${entry.slug}">${escape(entry.title)} →</a>`).join('')}</div>`;
    return section;
}
export function createArchivePage(artworks, toCollectionSlug) {
    const root = document.createElement('article'); root.className = 'lh-editorial archive-page';
    const kinds = [...new Set(archive.entries.map(entry => entry.kind))];
    const collections = [...new Set(archive.entries.flatMap(entry => entry.collections))].sort();
    const years = [...new Set(archive.entries.flatMap(entry => entry.years))].sort().reverse();
    const options = values => values.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('');
    root.innerHTML = `<div class="page-intro"><p class="eyebrow">Stories · Process · Writing · Display</p><p class="lead">Stories, process and traces of a life inscribed on Bitcoin.</p><p>Photographs, experiments, artist notes and connections between works. Follow a story into its collection, or return to the original words.</p></div>
        <div class="archive-feature"><a href="/archive#signing-pennsylvania"><img src="/editorial/archive/pennsylvania-signing.webp" alt="Lemonhaze signing Pennsylvania, a still from the film" decoding="async"></a><div><p class="eyebrow">At the print table</p><h2>Signing Pennsylvania</h2><p>A digital work meets paper. Watch Lemonhaze sign the physical print, and explore the photographs and stories behind the works.</p><a href="/archive#signing-pennsylvania">Watch the signing →</a></div></div>
        <form class="archive-filters" role="search"><label>Search the archive<input type="search" name="query" placeholder="A work, a place, a memory…"></label><label>Subject<select name="kind"><option value="">All subjects</option>${options(kinds)}</select></label><label>Collection<select name="collection"><option value="">All collections</option>${options(collections)}</select></label><label>Shared in<select name="year"><option value="">All years</option>${options(years)}</select></label><button type="reset">Clear filters</button></form><p class="archive-count" role="status" aria-live="polite"></p>
        <div class="archive-grid">${archive.entries.map(entry => {
            const cover = coverFor(entry, artworks);
            return `<article class="archive-card" data-entry="${entry.slug}">${cover ? `<a class="archive-cover" href="/archive#${entry.slug}" aria-label="Read ${escape(entry.title)}">${imageTag(cover)}${entry.video ? '<span class="archive-video-label">Film ↗</span>' : ''}</a>` : ''}<p class="eyebrow">${escape(entry.kind)}${entry.event ? ' · '+escape(entry.event) : ''}</p><details id="${entry.slug}"><summary><h2>${escape(entry.title)}</h2><span class="archive-read-label">Read the story</span></summary><div class="archive-entry-body">${entry.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}${entry.video ? `<figure class="wide-figure"><video controls playsinline preload="none" poster="${escape(entry.video.poster)}" aria-label="${escape(entry.video.title)}"><source src="${escape(entry.video.src)}" type="video/mp4"></video><figcaption>${entry.video.caption ? escape(entry.video.caption) : entry.slug === 'blood-lemon-tango' ? 'Video supplied by the collector and shared by Lemonhaze.' : entry.slug === 'montreal-exhibition' ? 'Montreal at Suburbs Gallery · Curated by Gamma · Footage shared by Lemonhaze.' : 'Process film shared by Lemonhaze. The actual process moves back and forth between these steps.'}</figcaption></figure>` : ''}${entry.images.length ? `<div class="archive-media-grid">${entry.images.map(image => `<figure><a href="${escape(image.src)}" target="_blank" rel="noopener">${imageTag(image)}</a><figcaption>${escape(image.caption)}</figcaption></figure>`).join('')}</div>` : ''}<nav class="story-work-links" aria-label="Related works and collections">${entry.related.map(link => `<a href="${link.href}">View ${escape(link.label)} →</a>`).join('')}${entry.collections.map(collection => `<a href="/${toCollectionSlug(collection)}">${escape(collection)} →</a>`).join('')}${entry.slug.startsWith('best-before') || entry.slug === 'opening-number-33' ? '<a href="/best-before#diary">Read the complete diary →</a>' : ''}</nav><div class="story-sources"><span>Original words · shared</span>${entry.sources.map(source => `<a href="${source.url}" target="_blank" rel="noopener">${source.date} ↗</a>`).join('')}<a href="/archive#${entry.slug}">Link to this entry</a></div></div></details></article>`;
        }).join('')}</div><p class="archive-empty" hidden>No entries match these filters. Try another word or clear the filters.</p>
        <section class="essay-section"><h2>Continue reading</h2><div class="story-directory">${archive.reading.map(link => `<a class="card-link" href="${link.href}"><strong>${escape(link.title)} →</strong><span>${escape(link.description)}</span></a>`).join('')}</div></section>`;
    const form = root.querySelector('form');
    const cards = [...root.querySelectorAll('[data-entry]')];
    const featuredStory = root.querySelector('#signing-pennsylvania');
    const feature = root.querySelector('.archive-feature');
    const update = () => {
        const filters = Object.fromEntries(new FormData(form));
        const filtering = Object.values(filters).some(value => String(value).trim());
        const showFeature = !filtering && !featuredStory.open;
        feature.hidden = !showFeature;
        const entries = filterArchiveEntries(archive.entries, filters);
        const shown = new Set(entries.map(entry => entry.slug));
        cards.forEach(card => {card.hidden = !shown.has(card.dataset.entry) || (showFeature && card.dataset.entry === 'signing-pennsylvania');});
        root.querySelector('.archive-count').textContent = showFeature
            ? `${archive.entries.length} entries · 1 featured above · ${entries.length - 1} below`
            : `${entries.length} of ${archive.entries.length} entries · Year filters refer to the source posts.`;
        root.querySelector('.archive-empty').hidden = entries.length > 0;
    };
    form.addEventListener('input', update);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => requestAnimationFrame(update));
    root.addEventListener('click', event => {
        const link = event.target.closest('a[href^="/archive#"]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        // Reveal targets even when an active filter has hidden their cards.
        form.reset(); cards.forEach(card => card.hidden = false);
        if (link.hash === '#signing-pennsylvania') {
            featuredStory.open = true;
            featuredStory.closest('.archive-card').classList.add('is-open');
            update();
        }
    });
    root.addEventListener('toggle', event => {
        if (event.target.tagName !== 'DETAILS') return;
        const card = event.target.closest('[data-entry]');
        if (card) card.classList.toggle('is-open', event.target.open);
        if (!event.target.open) event.target.querySelectorAll('video').forEach(video => video.pause());
        if (event.target === featuredStory) update();
    }, true);
    const hash = location.hash.slice(1);
    const target = [...root.querySelectorAll('details')].find(detail => detail.id === hash);
    if (target) {target.open = true;target.closest('.archive-card').classList.add('is-open');}
    update();
    return root;
}
