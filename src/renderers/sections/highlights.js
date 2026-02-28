export function createCareerHighlightsNode(items) {
    const root = document.createElement('div');
    root.className = 'space-y-3 text-xs md:text-sm text-white/80';

    items.forEach((item) => {
        if (typeof item === 'string') {
            const row = document.createElement('div');
            row.className = 'flex items-start gap-2';

            const arrow = document.createElement('span');
            arrow.className = 'opacity-40';
            arrow.textContent = '→';

            const text = document.createElement('span');
            text.textContent = item;

            row.appendChild(arrow);
            row.appendChild(text);
            root.appendChild(row);
            return;
        }

        const row = document.createElement('div');
        row.className = 'hover:text-white transition-colors cursor-pointer group flex items-start gap-2';
        row.onclick = () => window.open(item.link, '_blank');

        const arrow = document.createElement('span');
        arrow.className = 'opacity-40 group-hover:opacity-100 transition-opacity';
        arrow.textContent = '→';

        const text = document.createElement('span');
        text.textContent = item.text;

        row.appendChild(arrow);
        row.appendChild(text);
        root.appendChild(row);
    });

    return root;
}
