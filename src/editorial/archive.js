import archive from './archive-data.json';
import { sortStudioNotes } from './archive-curation.js';
import { storyDirectory } from './story-renderer.js';
import { filterArchiveEntries, entryLinks } from './archive-model.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const archiveEntries = archive.entries;
function imageTag(image, className = '') {
    return `<img class="${className}" src="${escape(image.src)}" alt="${escape(image.alt)}" ${image.width ? `width="${image.width}" height="${image.height}"` : ''} loading="lazy" decoding="async">`;
}
export function archiveLinksForCollection(collection) {
    const entries = sortStudioNotes(archive.entries.filter(entry => entry.collections.includes(collection)));
    if (!entries.length) return null;
    const section = document.createElement('section');
    section.className = 'essay-section archive-related';
    section.innerHTML = `<h2>Studio Notes</h2><div class="archive-related-links">${entries.map(entry => `<a href="/archive#${entry.slug}">${escape(entry.title)} →</a>`).join('')}</div>`;
    return section;
}
export function createArchivePage(artworks, toCollectionSlug) {
    const root = document.createElement('article'); root.className = 'lh-editorial archive-page';
    const kinds = [...new Set(archive.entries.map(entry => entry.kind))];
    const collections = [...new Set(archive.entries.flatMap(entry => entry.collections))].sort();
    const years = [...new Set(archive.entries.flatMap(entry => entry.years))].sort().reverse();
    const options = values => values.map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('');
    root.innerHTML = `<div class="page-intro"><p class="eyebrow">Stories · Process · Writing · Display</p><p class="lead">Stories, process and traces of a life inscribed on Bitcoin.</p><p>Photographs, experiments and original writing from the studio. Each note connects to its works and collections.</p></div><nav class="curated-page-nav" aria-label="Studio Notes contents"><a href="#studio-notes">Browse notes ↓</a><a href="#studio-reading">Longer reading ↓</a><a href="#collection-stories">Collection stories ↓</a></nav>
        <form id="studio-notes" class="archive-filters" role="search"><label>Search Studio Notes<input type="search" name="query" placeholder="A work, a place, a memory…"></label><label>Order<select name="order"><option value="selected">Selected order</option><option value="newest">Newest shared</option><option value="oldest">Oldest shared</option></select></label><details class="archive-filter-options"><summary>Filter notes</summary><div class="archive-filter-fields"><label>Subject<select name="kind"><option value="">All subjects</option>${options(kinds)}</select></label><label>Collection<select name="collection"><option value="">All collections</option>${options(collections)}</select></label><label>Shared in<select name="year"><option value="">All years</option>${options(years)}</select></label></div></details><button type="reset">Clear filters</button></form><p class="archive-count" role="status" aria-live="polite"></p>
        <div class="archive-grid">${sortStudioNotes(archive.entries).map(entry => {
            return `<article class="archive-card" data-entry="${entry.slug}"><p class="eyebrow">${escape(entry.kind)}${entry.collections.length ? ' · '+escape(entry.collections.slice(0, 2).join(' / ')) : ''}${entry.event ? ' · '+escape(entry.event) : ''}</p><details id="${entry.slug}"><summary><h2>${escape(entry.title)}</h2><span class="archive-read-label"><span class="when-closed">Read note</span><span class="when-open">Close note</span></span></summary><div class="archive-entry-body">${entry.paragraphs.map(p => `<p>${escape(p)}</p>`).join('')}${entry.video ? `<figure class="wide-figure"><video controls playsinline preload="none" poster="${escape(entry.video.poster)}" aria-label="${escape(entry.video.title)}"><source src="${escape(entry.video.src)}" type="video/mp4"></video><figcaption>${entry.video.caption ? escape(entry.video.caption) : entry.slug === 'blood-lemon-tango' ? 'Video supplied by the collector and shared by Lemonhaze.' : entry.slug === 'montreal-exhibition' ? 'Montreal at Suburbs Gallery · Curated by Gamma · Footage shared by Lemonhaze.' : 'Process film shared by Lemonhaze. The actual process moves back and forth between these steps.'}</figcaption></figure>` : ''}${entry.images.length ? `<div class="archive-media-grid">${entry.images.map(image => `<figure><a href="${escape(image.src)}" target="_blank" rel="noopener">${imageTag(image)}</a><figcaption>${escape(image.caption)}</figcaption></figure>`).join('')}</div>` : ''}<nav class="story-work-links" aria-label="Related works and collections">${entryLinks(entry, toCollectionSlug).map(link => `<a href="${escape(link.href)}">${escape(link.label)} →</a>`).join('')}${entry.slug.startsWith('best-before') || entry.slug === 'opening-number-33' ? '<a href="/best-before#diary">Read the complete diary →</a>' : ''}</nav><div class="story-sources"><span>Original words · shared</span>${entry.sources.map(source => `<a href="${source.url}" target="_blank" rel="noopener">${source.date} ↗︎</a>`).join('')}<a href="/archive#${entry.slug}">Link to this note</a><a href="/archive#studio-notes">Back to all notes ↑</a></div></div></details></article>`;
        }).join('')}</div><p class="archive-empty" hidden>No entries match these filters. Try another word or clear the filters.</p>
        <details class="studio-reading" id="studio-reading"><summary>Longer reading</summary><div class="story-directory">${archive.reading.map(link => `<a class="card-link" href="${link.href}"><strong>${escape(link.title)} →</strong><span>${escape(link.description)}</span></a>`).join('')}</div></details>`;
    const directory = document.createElement('details');
    directory.className = 'studio-reading'; directory.id = 'collection-stories';
    directory.innerHTML = '<summary>Collection stories</summary>';
    directory.appendChild(storyDirectory()); root.appendChild(directory);
    const onward = document.createElement('nav'); onward.className = 'editorial-related';
    onward.setAttribute('aria-label', 'Continue exploring');
    onward.innerHTML = '<a href="/selected">Selected Work →</a><a href="/explore">Practice →</a>';
    root.appendChild(onward);
    const form = root.querySelector('form');
    const cards = [...root.querySelectorAll('[data-entry]')];
    const grid = root.querySelector('.archive-grid');
    const update = () => {
        const filters = Object.fromEntries(new FormData(form));
        const entries = sortStudioNotes(filterArchiveEntries(archive.entries, filters), filters.order);
        const shown = new Set(entries.map(entry => entry.slug));
        const bySlug = new Map(cards.map(card => [card.dataset.entry, card]));
        cards.forEach(card => { card.hidden = !shown.has(card.dataset.entry); });
        entries.forEach(entry => grid.appendChild(bySlug.get(entry.slug)));
        root.querySelector('.archive-count').textContent = `${entries.length} of ${archive.entries.length} notes · ${filters.order === 'newest' ? 'Newest shared first' : filters.order === 'oldest' ? 'Oldest shared first' : 'Selected order'}`;
        root.querySelector('.archive-empty').hidden = entries.length > 0;
    };
    form.addEventListener('input', update);
    form.addEventListener('submit', event => event.preventDefault());
    form.addEventListener('reset', () => requestAnimationFrame(update));
    root.addEventListener('click', event => {
        const link = event.target.closest('a[href^="/archive#"]');
        if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        // Reveal targets even when an active filter has hidden their cards.
        const target = root.querySelector(`[id="${CSS.escape(decodeURIComponent(link.hash.slice(1)))}"]`);
        const card = target?.closest('[data-entry]');
        if (card?.hidden) { form.reset(); update(); }
    });
    root.addEventListener('toggle', event => {
        if (event.target.tagName !== 'DETAILS') return;
        const card = event.target.closest('[data-entry]');
        if (card) card.classList.toggle('is-open', event.target.open);
        if (!event.target.open) event.target.querySelectorAll('video').forEach(video => video.pause());

    }, true);
    const hash = location.hash.slice(1);
    const target = hash ? [...root.querySelectorAll('details')].find(detail => detail.id === hash) : null;
    if (target) {target.open = true;target.closest('.archive-card')?.classList.add('is-open');}
    update();
    return root;
}
