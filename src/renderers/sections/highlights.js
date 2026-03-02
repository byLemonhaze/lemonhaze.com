export function createCareerHighlightsNode(items) {
    const root = document.createElement('div');
    root.className = 'space-y-0 text-xs md:text-sm text-white/80';

    items.forEach((item, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const isTier1 = typeof item === 'object' && item.tier === 1;
        const hasLink = typeof item === 'object' && item.link;
        const textContent = typeof item === 'string' ? item : item.text;

        const row = document.createElement('div');
        row.className = [
            'flex items-start gap-4 py-3 border-b',
            isTier1 ? 'border-white/10' : 'border-white/5',
            hasLink ? 'hover:border-white/20 transition-colors cursor-pointer' : '',
        ].filter(Boolean).join(' ');

        if (hasLink) {
            row.onclick = () => window.open(item.link, '_blank');
        }

        const index = document.createElement('span');
        index.className = isTier1
            ? 'text-[9px] font-mono text-white/30 shrink-0 mt-0.5'
            : 'text-[9px] font-mono text-white/15 shrink-0 mt-0.5';
        index.textContent = num;

        const text = document.createElement('span');
        text.className = isTier1 ? 'text-white font-bold' : '';
        text.textContent = textContent;

        row.appendChild(index);
        row.appendChild(text);
        root.appendChild(row);
    });

    return root;
}
