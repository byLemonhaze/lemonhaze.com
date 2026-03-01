export function createCareerHighlightsNode(items) {
    const root = document.createElement('div');
    root.className = 'space-y-0 text-xs md:text-sm text-white/80';

    items.forEach((item, idx) => {
        const num = String(idx + 1).padStart(2, '0');

        if (typeof item === 'string') {
            const row = document.createElement('div');
            row.className = 'flex items-start gap-4 py-3 border-b border-white/5';

            const index = document.createElement('span');
            index.className = 'text-[9px] font-mono text-white/15 shrink-0 mt-0.5';
            index.textContent = num;

            const text = document.createElement('span');
            text.textContent = item;

            row.appendChild(index);
            row.appendChild(text);
            root.appendChild(row);
            return;
        }

        const row = document.createElement('div');
        row.className = 'flex items-start gap-4 py-3 border-b border-white/5 hover:border-white/15 transition-colors cursor-pointer';
        row.onclick = () => window.open(item.link, '_blank');

        const index = document.createElement('span');
        index.className = 'text-[9px] font-mono text-white/15 shrink-0 mt-0.5';
        index.textContent = num;

        const text = document.createElement('span');
        text.textContent = item.text;

        row.appendChild(index);
        row.appendChild(text);
        root.appendChild(row);
    });

    return root;
}
