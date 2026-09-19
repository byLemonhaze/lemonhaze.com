import stories from './collection-stories.json';
import footnotes from './artwork-footnotes.json';

function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
}
function link(href, label) {
    const a = node('a', label); a.href = href;
    if (href.startsWith('https://')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
}
export const storyKeys = Object.keys(stories);
export function storySections(key) {
    const wrap = node('div');
    for (const part of stories[key].sections) {
        const section = node('section', null, 'essay-section');
        section.appendChild(node('h2', part.title));
        part.paragraphs.forEach(p => section.appendChild(node('p', p)));
        part.quotes.forEach(p => {
            section.appendChild(node('blockquote', typeof p === 'string' ? p : p.text, 'verbatim'));
            if (p.credit) section.appendChild(node('cite', p.credit));
        });
        if (part.works.length) {
            const works = node('nav', null, 'story-work-links'); works.setAttribute('aria-label', `Works: ${part.title}`);
            part.works.forEach(w => works.appendChild(link(w.href, w.title+' ↗'))); section.appendChild(works);
        }
        const sources = node('div', null, 'story-sources');
        part.sources.forEach(s => sources.appendChild(link(s.url, s.label+' ↗'))); section.appendChild(sources);
        wrap.appendChild(section);
    }
    return wrap;
}
export function storyDirectory() {
    const section = node('section', null, 'essay-section'); section.appendChild(node('h2', 'More collection stories'));
    const grid = node('div', null, 'story-directory');
    for (const story of Object.values(stories)) {
        const a = link('/'+story.slug+'#collection-story', ''); a.className = 'card-link';
        a.append(node('strong', (story.title === 'Orphelinat' ? 'L’Orphelinat' : story.title)+' →'), node('span', story.teaser));
        grid.appendChild(a);
    }
    section.appendChild(grid); return section;
}
export function artworkFootnotes(id) {
    const notes = footnotes[id]; if (!notes) return null;
    const wrap = node('div', null, 'story-footnotes');
    notes.forEach(note => {
        wrap.appendChild(node('p', note.text, note.verbatim ? 'verbatim' : ''));
        wrap.appendChild(link(note.source.url, note.source.label+' ↗'));
    });
    return wrap;
}
