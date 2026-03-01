function createTextNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
}

export function createMediaSectionNode(items) {
    const root = createTextNode('div', 'space-y-0 animate-fade-in');

    items.forEach((item, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'w-full flex items-start gap-4 py-4 border-b border-white/5 hover:border-white/15 transition-colors cursor-pointer group text-left';
        row.addEventListener('click', () => window.open(item.link, '_blank'));

        const index = createTextNode('span', 'text-[9px] font-mono text-white/15 shrink-0 mt-0.5', num);

        const body = document.createElement('div');
        body.className = 'flex-1 min-w-0';

        const meta = createTextNode(
            'p',
            'text-[9px] font-mono text-white/25 uppercase tracking-[0.25em] mb-1',
            item.platform
        );
        const title = createTextNode(
            'h4',
            'text-[13px] font-bold text-white/80 leading-tight group-hover:text-white transition-colors mb-1',
            item.title
        );
        const caption = createTextNode('p', 'text-[11px] text-white/35 leading-relaxed', item.caption);

        body.appendChild(meta);
        body.appendChild(title);
        body.appendChild(caption);

        const arrow = createTextNode('span', 'text-white/15 group-hover:text-white/50 transition-colors shrink-0 font-mono mt-1', '→');

        row.appendChild(index);
        row.appendChild(body);
        row.appendChild(arrow);
        root.appendChild(row);
    });

    return root;
}
