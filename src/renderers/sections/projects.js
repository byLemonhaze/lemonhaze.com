import { PAINT_ENGINE_DESCRIPTION, PAINT_ENGINE_VERSIONS } from '../../data/paint-engines.js';

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
        name: 'LATCH WALLET',
        stack: 'React Native · Expo Router · TypeScript',
        desc: 'Demo-wallet prototype. Self-custodial spending layer — hold BTC and USDT, spend anywhere Visa is accepted. Full UI: balance hero, Visa card reveal, transaction feed, send flow with numpad.',
        live: null,
        github: null,
        action: 'latch',
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
        desc: PAINT_ENGINE_DESCRIPTION,
        live: null,
        github: 'https://github.com/byLemonhaze/paint-engine-v1.07-passe-partout',
        inscriptions: PAINT_ENGINE_VERSIONS,
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
        github: null,
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
    label.textContent = 'Field Work — Builder & Designer Portfolio';

    const blurb = document.createElement('p');
    blurb.className = 'text-[11px] text-white/50 leading-relaxed';
    blurb.textContent = 'Everything here was designed, built, and shipped by Lemonhaze — tools, galleries, engines, systems.';

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
        header.className = 'min-w-0 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 mb-1.5';

        const name = document.createElement('span');
        name.className = 'min-w-0 text-[11px] font-bold uppercase tracking-[0.18em] text-white break-words';
        name.textContent = project.name;

        const stackWrap = document.createElement('div');
        stackWrap.className = 'min-w-0 flex items-center gap-2 sm:shrink-0';

        const stack = document.createElement('span');
        stack.className = 'min-w-0 text-[9px] font-mono uppercase tracking-[0.12em] text-white/25 break-words';
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
        links.className = 'min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1';

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
            liveLink.className = 'max-w-full text-[9px] font-mono text-white/40 hover:text-white transition-colors tracking-[0.1em] break-all';
            liveLink.textContent = '↗ ' + project.live.replace(/^https?:\/\//, '');
            liveLink.onclick = e => e.stopPropagation();
            links.appendChild(liveLink);
        }

        if (project.github) {
            const ghLink = document.createElement('a');
            ghLink.href = project.github;
            ghLink.target = '_blank';
            ghLink.rel = 'noopener noreferrer';
            ghLink.className = 'max-w-full text-[9px] font-mono text-white/25 hover:text-white/60 transition-colors tracking-[0.1em] break-all';
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
                a.className = 'max-w-full text-[9px] font-mono text-white/35 hover:text-white transition-colors tracking-[0.08em] break-words';
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
    } else if (action === 'latch') {
        openLatchOverlay();
    }
}

// ── Latch fullscreen overlay ───────────────────────────────────────────────
function openLatchOverlay() {
    if (document.getElementById('latch-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'latch-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '9999',
        background: '#161E1C',
        display: 'flex',
        flexDirection: 'column',
        opacity: '0',
        transform: 'translateY(24px)',
        transition: 'opacity 0.32s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1)',
    });

    // Close button — top right, discreet
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '16px',
        right: '18px',
        zIndex: '10',
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.45)',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'background 0.15s, color 0.15s',
        lineHeight: '1',
    });
    closeBtn.onmouseenter = () => {
        closeBtn.style.background = 'rgba(255,255,255,0.12)';
        closeBtn.style.color = 'rgba(255,255,255,0.88)';
    };
    closeBtn.onmouseleave = () => {
        closeBtn.style.background = 'rgba(255,255,255,0.05)';
        closeBtn.style.color = 'rgba(255,255,255,0.45)';
    };

    const iframe = document.createElement('iframe');
    iframe.src = '/lab/latch-demo-wallet/';
    Object.assign(iframe.style, {
        flex: '1',
        width: '100%',
        border: 'none',
        display: 'block',
    });
    iframe.setAttribute('allowfullscreen', '');

    const prevUrl = location.pathname + location.search + location.hash;
    history.pushState({ latch: true }, '', '/lab/latch-demo-wallet');

    function close() {
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(24px)';
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('popstate', onPop);
        history.pushState({}, '', prevUrl);
        setTimeout(() => overlay.remove(), 340);
    }

    function onKey(e) {
        if (e.key === 'Escape') close();
    }

    function onPop() { close(); }

    closeBtn.onclick = close;
    document.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);

    overlay.appendChild(closeBtn);
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.transform = 'translateY(0)';
    }));
}
