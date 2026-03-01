/**
 * Blog section renderer for lemonhaze.com
 * List view → post view, within the existing about-modal pattern.
 */

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Render post body — splits on double newline into paragraphs */
function renderContent(content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-5';

    const blocks = content.split(/\n\n+/);
    blocks.forEach(block => {
        const trimmed = block.trim();
        if (!trimmed) return;

        // Heading: lines starting with # or ##
        if (trimmed.startsWith('## ')) {
            const h = el('h3', 'text-[11px] font-bold uppercase tracking-[0.25em] text-white/40 mt-8 mb-2', trimmed.slice(3));
            wrapper.appendChild(h);
        } else if (trimmed.startsWith('# ')) {
            const h = el('h2', 'text-sm font-bold uppercase tracking-[0.2em] text-white/60 mt-8 mb-3', trimmed.slice(2));
            wrapper.appendChild(h);
        } else if (trimmed.startsWith('---')) {
            const hr = document.createElement('hr');
            hr.className = 'border-white/8 my-6';
            wrapper.appendChild(hr);
        } else {
            const p = el('p', 'text-[13px] text-white/70 leading-relaxed', trimmed);
            wrapper.appendChild(p);
        }
    });

    return wrapper;
}

/** Full post view — rendered inside the about-modal content area */
function createPostNode(post, onBack) {
    const root = document.createElement('div');
    root.className = 'animate-fade-in';

    // Back button
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-white/25 hover:text-white transition-colors mb-8 cursor-pointer';
    back.innerHTML = '← Blog';
    back.addEventListener('click', onBack);
    root.appendChild(back);

    // Post header
    const header = document.createElement('div');
    header.className = 'mb-8 pb-6 border-b border-white/8';

    const date = el('p', 'text-[10px] font-mono text-white/25 uppercase tracking-[0.2em] mb-3', formatDate(post.date));
    const title = el('h2', 'text-xl font-black uppercase tracking-tight text-white leading-tight', post.title);

    if (post.tags && post.tags.length) {
        const tags = document.createElement('div');
        tags.className = 'flex flex-wrap gap-2 mt-3';
        post.tags.forEach(tag => {
            const t = el('span', 'text-[9px] font-mono text-white/20 uppercase tracking-widest border border-white/10 px-2 py-0.5', tag);
            tags.appendChild(t);
        });
        header.appendChild(date);
        header.appendChild(title);
        header.appendChild(tags);
    } else {
        header.appendChild(date);
        header.appendChild(title);
    }

    root.appendChild(header);

    // Post content
    const body = renderContent(post.content || '');
    root.appendChild(body);

    return root;
}

/** Blog list view */
export function createBlogSectionNode(posts) {
    const published = posts.filter(p => p.status === 'published').sort((a, b) => b.date.localeCompare(a.date));

    const root = document.createElement('div');
    root.className = 'animate-fade-in';

    if (!published.length) {
        const empty = document.createElement('div');
        empty.className = 'py-12 text-center';
        const msg = el('p', 'text-[11px] font-mono text-white/20 uppercase tracking-[0.3em]', 'No posts yet.');
        empty.appendChild(msg);
        root.appendChild(empty);
        return root;
    }

    /** Re-render with a full post view, swapping the root content */
    const showPost = (post) => {
        root.innerHTML = '';
        const postNode = createPostNode(post, () => {
            root.innerHTML = '';
            renderList();
        });
        root.appendChild(postNode);
    };

    const renderList = () => {
        published.forEach((post, idx) => {
            const num = String(idx + 1).padStart(2, '0');

            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'w-full text-left flex items-start gap-4 py-4 border-b border-white/5 hover:border-white/15 transition-colors cursor-pointer group';
            row.addEventListener('click', () => showPost(post));

            const index = el('span', 'text-[9px] font-mono text-white/15 shrink-0 mt-0.5', num);

            const body = document.createElement('div');
            body.className = 'flex-1 min-w-0';

            const date = el('p', 'text-[9px] font-mono text-white/25 uppercase tracking-[0.2em] mb-1', formatDate(post.date));
            const title = el('h4', 'text-[13px] font-bold text-white/80 leading-tight group-hover:text-white transition-colors mb-1 uppercase tracking-tight', post.title);
            const excerpt = el('p', 'text-[11px] text-white/35 leading-relaxed line-clamp-2', post.excerpt || '');

            body.appendChild(date);
            body.appendChild(title);
            body.appendChild(excerpt);

            const arrow = el('span', 'text-white/15 group-hover:text-white/50 transition-colors shrink-0 font-mono mt-1', '→');

            row.appendChild(index);
            row.appendChild(body);
            row.appendChild(arrow);
            root.appendChild(row);
        });
    };

    renderList();
    return root;
}
