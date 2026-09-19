const routes = { 'index.html': '/montreal', 'process.html': '/practice', 'paint-engine.html': '/paint-engine', 'gentlemen.html': '/gentlemen', 'liminality.html': '/liminality', 'best-before.html': '/best-before', 'exhibitions.html': '/highlights', 'collecting.html': '/collecting', 'review.html': '/about', 'editorial-sources.md': '/editorial/sources.md', 'sources.md': '/editorial/archive-sources.md' };
const siteHosts = new Set(['lemonhaze.com', 'www.lemonhaze.com']);

// Resolve legacy editorial filenames before returning a canonical internal URL.
// Relative links have the production hostname too; they must follow the same
// mapping as local preview links instead of becoming /best-before.html.
export function normalizeEditorialHref(href, currentUrl) {
    const base = new URL(currentUrl);
    const url = new URL(href, base);
    if (url.origin !== base.origin && !siteHosts.has(url.hostname)) return href;
    const file = url.pathname.replace(/^\//, '');
    url.pathname = routes[file] || (file.startsWith('assets/') ? '/editorial/' + file : url.pathname);
    if (url.hash === '#gallery') url.hash = '#artworks';
    return url.pathname + url.search + url.hash;
}
