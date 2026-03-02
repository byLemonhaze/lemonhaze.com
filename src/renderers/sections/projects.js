const BUILT = [
    // ── Galleries & Directories ────────────────────────────────────────────────
    {
        name: 'CATALOGUE',
        stack: 'TypeScript · React · Sanity',
        desc: 'Independent digital artist directory. Each profile opens the artist\'s own site in an iframe. Built on React, Sanity CMS, and Cloudflare — with a full submission, review, and email workflow.',
        live: 'https://catalogue.gallery',
        github: 'https://github.com/byLemonhaze/catalogue.gallery',
    },
    {
        name: 'BEST BEFORE GALLERY',
        stack: 'Vanilla JS · Vite',
        desc: 'Dedicated site for the BEST BEFORE collection. Tracks phase, palette, and block-countdown lifespan for each piece in real time.',
        live: 'https://bestbefore.gallery',
        github: null,
    },
    // ── Tools & Engines ────────────────────────────────────────────────────────
    {
        name: 'PAINT ENGINE',
        stack: 'HTML · On-chain',
        desc: 'A generative paint engine that lives in a single self-contained HTML file inscribed on Bitcoin. Seed + tag determinism, no server, no dependencies — runs in any browser as long as Bitcoin runs. Available for commission as bespoke visual environments for hotels, Airbnb properties, and private residences.',
        live: null,
        github: 'https://github.com/byLemonhaze/paint-engine-v1.07-passe-partout',
    },
    {
        name: 'PALETTE ENGINE',
        stack: 'Vanilla JS · Built-in',
        desc: 'Generative color palette engine with seeded PRNG, a lock/pin system, and canvas sketch previews. 27 curated themes. Runs entirely in-browser.',
        live: null,
        github: null,
        action: 'palette',
    },
    {
        name: 'PRESS ENGINE',
        stack: 'Claude · Built-in',
        desc: 'Personal content lab. Generates artist statements, press releases, collection notes, blog drafts, captions, interview answers, and bio variants — with deep Lemonhaze context baked in.',
        live: null,
        github: null,
        action: 'press',
    },
    // ── Collection & Artist Sites ──────────────────────────────────────────────
    {
        name: 'COUNTERFEIT GALLERY',
        stack: 'TypeScript · React · Vite',
        desc: 'Toy gallery for Bitcoin-inscribed digital trading cards — a nod to the Rare Pepe era of crypto art.',
        live: 'https://counterfeit.gallery',
        github: 'https://github.com/byLemonhaze/counterfeit.gallery',
    },
    {
        name: 'CYPHERVILLE',
        stack: 'JavaScript · Cloudflare',
        desc: 'Narrative site for the dual Cypherville / DeVille world — two factions, one shared story, built around a 3D carousel and on-chain lore.',
        live: 'https://cypherville.xyz',
        github: 'https://github.com/byLemonhaze/cypherville.xyz',
    },
    {
        name: '2490.STUDIO',
        stack: 'JavaScript · Vite',
        desc: 'Minimal studio site for Portrait 2490 — 90 AI-assisted portraits of humans and robots in the year 2490, all inscribed sub-300k on Bitcoin.',
        live: 'https://2490.studio',
        github: 'https://github.com/byLemonhaze/2490.studio',
    },
];

export function createProjectsSectionNode() {
    const root = document.createElement('div');
    root.className = 'space-y-0';

    BUILT.forEach((project) => {
        const hasAction = Boolean(project.action);
        const row = document.createElement('div');
        row.className = [
            'py-4 border-b border-white/5',
            hasAction ? 'cursor-pointer hover:border-white/15 transition-colors' : '',
        ].filter(Boolean).join(' ');

        if (hasAction) {
            row.onclick = () => handleAction(project.action);
        }

        // ── Header: name + stack ──────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'flex items-baseline justify-between gap-4 mb-1.5';

        const name = document.createElement('span');
        name.className = 'text-[11px] font-bold uppercase tracking-[0.18em] text-white';
        name.textContent = project.name;

        const stackWrap = document.createElement('div');
        stackWrap.className = 'flex items-center gap-2 shrink-0';

        if (hasAction) {
            const badge = document.createElement('span');
            badge.className = 'font-mono text-[8px] uppercase tracking-[0.15em] text-white/30 border border-white/15 px-1.5 py-0.5';
            badge.textContent = 'built-in';
            stackWrap.appendChild(badge);
        }

        const stack = document.createElement('span');
        stack.className = 'text-[9px] font-mono uppercase tracking-[0.12em] text-white/25';
        stack.textContent = project.stack;
        stackWrap.appendChild(stack);

        header.appendChild(name);
        header.appendChild(stackWrap);

        // ── Description ───────────────────────────────────────────────────────
        const desc = document.createElement('p');
        desc.className = 'text-[11px] text-white/50 leading-relaxed mb-2.5';
        desc.textContent = project.desc;

        // ── Links ─────────────────────────────────────────────────────────────
        const links = document.createElement('div');
        links.className = 'flex items-center gap-4';

        if (hasAction) {
            const openBtn = document.createElement('button');
            openBtn.className = 'font-mono text-[9px] text-white/40 hover:text-white transition-colors tracking-[0.1em]';
            openBtn.textContent = '→ open';
            openBtn.onclick = (e) => { e.stopPropagation(); handleAction(project.action); };
            links.appendChild(openBtn);
        }

        if (project.live) {
            const liveLink = document.createElement('a');
            liveLink.href = project.live;
            liveLink.target = '_blank';
            liveLink.rel = 'noopener noreferrer';
            liveLink.className = 'text-[9px] font-mono text-white/40 hover:text-white transition-colors tracking-[0.1em]';
            liveLink.textContent = '↗ ' + project.live.replace(/^https?:\/\//, '');
            liveLink.onclick = e => e.stopPropagation();
            links.appendChild(liveLink);
        }

        if (project.github) {
            const ghLink = document.createElement('a');
            ghLink.href = project.github;
            ghLink.target = '_blank';
            ghLink.rel = 'noopener noreferrer';
            ghLink.className = 'text-[9px] font-mono text-white/25 hover:text-white/60 transition-colors tracking-[0.1em]';
            ghLink.textContent = '⌥ github';
            ghLink.onclick = e => e.stopPropagation();
            links.appendChild(ghLink);
        }

        row.appendChild(header);
        row.appendChild(desc);
        row.appendChild(links);
        root.appendChild(row);
    });

    return root;
}

// ── Action dispatcher ─────────────────────────────────────────────────────
async function handleAction(action) {
    if (action === 'palette') {
        const { openPaletteModal } = await import('../modal/palette.js');
        openPaletteModal();
    } else if (action === 'press') {
        const { openPressEngine } = await import('../modal/press.js');
        openPressEngine();
    }
}
