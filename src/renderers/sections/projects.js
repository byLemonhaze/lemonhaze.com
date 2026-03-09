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
        github: 'https://github.com/BEST-BEFORE-ORDINALS/bestbefore.gallery',
    },
    // ── Tools & Engines ────────────────────────────────────────────────────────
    {
        name: 'PAINT ENGINE',
        stack: 'HTML · On-chain',
        desc: 'A generative paint engine that lives in a single self-contained HTML file inscribed on Bitcoin. Seed + tag determinism, no server, no dependencies — runs in any browser as long as Bitcoin runs. Available for commission as bespoke visual environments for hotels, Airbnb properties, and private residences.',
        live: null,
        github: 'https://github.com/byLemonhaze/paint-engine-v1.07-passe-partout',
        inscriptions: [
            { label: 'v0',                          id: '0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0' },
            { label: 'v0.1 [Grossier]',             id: 'f93a9e3655a0d9531871248b9a3e6b78c1aaee24c76265247a3172b16bdbc15di0' },
            { label: 'v0.2 [O-Swirl]',              id: '054eb44d57f5bd34a9153c5a605e32710fbc36912945db0fc91693526e7c9201i0' },
            { label: 'v0.3 [Jackie\'s]',            id: '0b1c283e4fe2637a881639a2a715348c56759840f06f7e1142652da60a4a2d4ei0' },
            { label: 'v0.3.1 [Max Colors]',         id: '723f548d5a05ff53075cfc3be76587040bef3cc129e95b423f01611c21d8122di0' },
            { label: 'v0.6 [Wild Patch]',           id: '0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0' },
            { label: 'v0.8 [Under Const.]',         id: '36e74fdb856a69281982f9340739aa10863bbd19da8d7e8fb183b9b9284323f8i0' },
            { label: 'v0.9 [Chasing The Dragon]',   id: '795a40ea70f17c9de70035395df51dce9510999f0c412bf5068c11115456f1c1i0' },
            { label: 'v1.03 [Faux-Chat]',           id: '7a6d380af9adc2b7b70ac0cea5d054ab8c69a0d7d0f612e66870213276dd4349i0' },
            { label: 'v1.04 [Mon Enfant]',          id: '99132e479d4c64dcb8267e5a04b959396e90f8f6628c8741eb39f379e6e40840i0' },
            { label: 'v1.05 [Hidden Gems]',         id: '2cbef7662c4e6c84457e57c9fd9f04fc585956cf66302ba01862c73e53e1e75di0' },
            { label: 'v1.07 [Passe-Partout]',       id: 'c8d790c42ce1a43c02acf15114d4053c1c9f086dc2856ebd3031ce268f5d58dbi0' },
        ],
    },
    {
        name: 'ARTWORK ENCRYPTOR',
        stack: 'Vanilla JS · Web Crypto',
        desc: 'Offline browser encryptor for artwork HTML/images. Packages work into a standalone sealed HTML with Argon2id + AES-GCM, passphrase checks, and deterministic export formatting for inscription workflows.',
        live: null,
        github: 'https://github.com/byLemonhaze/artwork-encryptor-v4',
    },
    {
        name: 'PALETTE ENGINE',
        stack: 'Vanilla JS',
        desc: 'Generative color palette engine with seeded PRNG, a lock/pin system, and canvas sketch previews. 27 curated themes. Runs entirely in-browser.',
        live: null,
        github: null,
        action: 'palette',
    },
    {
        name: 'PRESS ENGINE',
        stack: 'Claude · Sonnet',
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

    // ── Explainer ─────────────────────────────────────────────────────────────
    const intro = document.createElement('div');
    intro.className = 'mb-8 pb-6 border-b border-white/10';

    const label = document.createElement('p');
    label.className = 'text-[9px] font-mono uppercase tracking-[0.18em] text-white/30 mb-2';
    label.textContent = 'Field Work';

    const blurb = document.createElement('p');
    blurb.className = 'text-[11px] text-white/50 leading-relaxed';
    blurb.textContent = 'Studio Output: Everything here was designed, built, and shipped by Lemonhaze — tools, galleries, engines, systems.';

    intro.appendChild(label);
    intro.appendChild(blurb);
    root.appendChild(intro);

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

        // ── Inscriptions ──────────────────────────────────────────────────────
        if (project.inscriptions?.length) {
            const insRow = document.createElement('div');
            insRow.className = 'flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5';

            const insLabel = document.createElement('span');
            insLabel.className = 'text-[9px] font-mono uppercase tracking-[0.12em] text-white/20 shrink-0';
            insLabel.textContent = 'inscribed:';
            insRow.appendChild(insLabel);

            project.inscriptions.forEach(({ label, id }) => {
                const a = document.createElement('a');
                a.href = `/${encodeURIComponent(id)}`;
                a.className = 'text-[9px] font-mono text-white/35 hover:text-white transition-colors tracking-[0.08em]';
                a.textContent = label;
                a.title = id;
                a.onclick = e => e.stopPropagation();
                insRow.appendChild(a);
            });

            row.appendChild(insRow);
        }

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
