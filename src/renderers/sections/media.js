function createTextNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
}

export function createMediaSectionNode(items) {
    const root = createTextNode('div', 'space-y-6 animate-fade-in');
    const intro = createTextNode(
        'p',
        'text-white/40 text-xs font-mono uppercase tracking-widest mb-4',
        'Interviews & Podcasts'
    );
    root.appendChild(intro);

    const grid = createTextNode('div', 'grid grid-cols-1 md:grid-cols-2 gap-4');

    items.forEach((item, idx) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'glass p-4 border border-white/10 hover:border-white/30 transition-colors cursor-pointer group text-left';
        card.style.animation = `fade-in 0.5s ease-out ${idx * 0.1}s both`;
        card.addEventListener('click', () => window.open(item.link, '_blank'));

        const heading = createTextNode('div', 'flex items-center justify-between mb-2');
        const platform = createTextNode(
            'span',
            'text-[10px] font-mono text-white/50 uppercase tracking-tighter',
            item.platform
        );
        const arrow = createTextNode('span', 'text-white/20 group-hover:text-white/60 transition-colors', '→');
        heading.appendChild(platform);
        heading.appendChild(arrow);

        const title = createTextNode(
            'h4',
            'text-[13px] font-bold text-white/90 leading-tight mb-2 group-hover:text-white transition-colors',
            item.title
        );
        const caption = createTextNode('p', 'text-[11px] text-white/40 leading-relaxed font-light', item.caption);

        card.appendChild(heading);
        card.appendChild(title);
        card.appendChild(caption);
        grid.appendChild(card);
    });

    root.appendChild(grid);
    return root;
}
