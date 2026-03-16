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
        name: 'DESIGN BANK',
        stack: 'Vanilla JS · CSS · WebGL',
        desc: 'Personal UI component library. Navigation, balance heroes, action buttons, transaction lists — each kit with its own visual language and motion system.',
        live: null,
        github: null,
        action: 'design-bank',
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
            {
                label: 'v0',
                id: '0c0ba94df1720c8ed40afbc38f97f806e758de9234f99cbaa060bafd22231efbi0',
                help: 'G generate · B undo\nP palette · R ratio\nT texture toggle · S save',
            },
            {
                label: 'v0.1 [Grossier]',
                id: 'f93a9e3655a0d9531871248b9a3e6b78c1aaee24c76265247a3172b16bdbc15di0',
                help: 'G generate · B undo\nP palette · R ratio\nT texture toggle · S save\n\nVisual refinement of v0 — thicker, rougher strokes.',
            },
            {
                label: 'v0.2 [O-Swirl]',
                id: '054eb44d57f5bd34a9153c5a605e32710fbc36912945db0fc91693526e7c9201i0',
                help: 'G generate · B undo\nP palette · R ratio\nT texture toggle · S save\n\nSwirl-dominant composition variant.',
            },
            {
                label: 'v0.3 [Jackie\'s]',
                id: '0b1c283e4fe2637a881639a2a715348c56759840f06f7e1142652da60a4a2d4ei0',
                help: 'G generate · B undo\nP palette · R ratio\nW version select · T texture · S save\n\nSeed input: type a seed + Enter to load a specific output.',
            },
            {
                label: 'v0.3.1 [Max Colors]',
                id: '723f548d5a05ff53075cfc3be76587040bef3cc129e95b423f01611c21d8122di0',
                help: 'G generate · B undo\nP palette · R ratio\nW version select · T texture · S save\nSeed input: type + Enter to load.\n\nExpanded palette range — more simultaneous colours than any prior version.',
            },
            {
                label: 'v0.6 [Wild Patch]',
                id: '0109e594769bd8c50e1f8fc15e80db0b93188d881bf2a258c7a88dcbe609b391i0',
                help: 'Button-only — no keyboard shortcuts.\n\nGenerate · Undo · Frame · Background · Save\n\nFirst version with frame and background selectors.',
            },
            {
                label: 'v0.8 [Under Const.]',
                id: '36e74fdb856a69281982f9340739aa10863bbd19da8d7e8fb183b9b9284323f8i0',
                help: 'G generate · B undo\nP palette · R ratio\nT cycle texture (3 modes) · S save\n\nSeed system: seed number + palette tag + iteration tag.\nType any combination + Enter to reload a specific output.',
            },
            {
                label: 'v0.9 [Chasing The Dragon]',
                id: '795a40ea70f17c9de70035395df51dce9510999f0c412bf5068c11115456f1c1i0',
                help: 'G generate · B undo\nP palette · R ratio\nT cycle texture (3 modes) · S save\n\nSame seed system as v0.8: seed + palette tag + iteration tag.\nA thematic continuation — same engine, darker instinct.',
            },
            {
                label: 'v1.03 [Faux-Chat]',
                id: '7a6d380af9adc2b7b70ac0cea5d054ab8c69a0d7d0f612e66870213276dd4349i0',
                help: 'G generate · B undo\nI iterations · Z brush · F frame\n\nSeed panel: apply a seed, randomise, or load saved params.\nFirst version with a gallery browser — browse and revisit past outputs.',
            },
            {
                label: 'v1.04 [Mon Enfant]',
                id: '99132e479d4c64dcb8267e5a04b959396e90f8f6628c8741eb39f379e6e40840i0',
                help: 'G generate · B undo\nI iterations · Z brush · F frame\nBG background selector (new in this version)\n\nSeed panel: apply, randomise, load params.\nGallery browser included.',
            },
            {
                label: 'v1.05 [Hidden Gems]',
                id: '2cbef7662c4e6c84457e57c9fd9f04fc585956cf66302ba01862c73e53e1e75di0',
                help: 'G generate · B undo\nI iterations · Z brush · F frame · BG background\nCorner radius controls: BL · BR (bottom corners)\n\nSeed panel: apply, randomise, load params.\nFirst version with geometric shape controls.',
            },
            {
                label: 'v1.07 [Passe-Partout]',
                id: 'c8d790c42ce1a43c02acf15114d4053c1c9f086dc2856ebd3031ce268f5d58dbi0',
                help: 'G generate · B undo\nI iterations · Z brush · F frame · BG background\nV favourites · L collection · C customise\n\nSeed panel: apply, randomise, load params.\nSave outputs to a favourites list. Export your full collection.\nMost complete version of the engine.',
            },
            {
                label: 'Into The Wild',
                id: 'a7a29fda9317c0689b6cebba74ef9381e46fc783f073619643a0ec6f28edd49bi0',
                help: 'G generate · B undo\nP palette · R ratio\nT texture · F frame · O background\nW or S seed panel · I iterations\nEsc close any modal\n\nSpecialised engine — portrait-format composition with extended modal controls. Seed + palette + iteration system.',
            },
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
    } else if (action === 'latch') {
        openLatchOverlay();
    } else if (action === 'design-bank') {
        openDesignBankOverlay();
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

// ── Design Bank fullscreen overlay (password protected) ───────────────────
function openDesignBankOverlay() {
    if (document.getElementById('db-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'db-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '9999',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: '0',
        transform: 'translateY(24px)',
        transition: 'opacity 0.32s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1)',
    });

    const prevUrl = location.pathname + location.search + location.hash;
    history.pushState({ designBank: true }, '', '/lab/design-bank');

    function close() {
        overlay.style.opacity = '0';
        overlay.style.transform = 'translateY(24px)';
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('popstate', onPop);
        history.pushState({}, '', prevUrl);
        setTimeout(() => overlay.remove(), 340);
    }

    function onKey(e) { if (e.key === 'Escape') close(); }
    function onPop() { close(); }
    document.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);

    // ── Password gate ──────────────────────────────────────────────────────
    const gate = document.createElement('div');
    Object.assign(gate.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '280px',
    });

    const gateLabel = document.createElement('p');
    Object.assign(gateLabel.style, {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '9px',
        fontWeight: '500',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.2)',
    });
    gateLabel.textContent = 'Design Bank · lemonhaze';

    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'Password';
    Object.assign(input.style, {
        width: '100%',
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.75)',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '12px',
        padding: '10px 12px',
        letterSpacing: '2px',
        outline: 'none',
    });
    input.addEventListener('focus', () => { input.style.borderColor = 'rgba(200,168,80,0.5)'; });
    input.addEventListener('blur',  () => { input.style.borderColor = 'rgba(255,255,255,0.12)'; });

    const err = document.createElement('p');
    Object.assign(err.style, {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '9px',
        color: 'rgba(220,80,70,0.75)',
        letterSpacing: '0.5px',
        display: 'none',
    });
    err.textContent = 'Wrong password.';

    const btn = document.createElement('button');
    Object.assign(btn.style, {
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '10px',
        fontWeight: '500',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#000',
        background: 'rgba(200,168,80,0.9)',
        border: 'none',
        padding: '10px 0',
        cursor: 'pointer',
        transition: 'background 0.15s',
        width: '100%',
    });
    btn.textContent = 'Enter';
    btn.addEventListener('mouseenter', () => { btn.style.background = '#C8A850'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(200,168,80,0.9)'; });

    const attempt = async () => {
        const pass = input.value.trim();
        if (!pass) return;
        btn.textContent = '···';
        btn.style.opacity = '0.6';
        try {
            const res = await fetch('/api/design-bank-auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-db-password': pass },
            });
            if (res.ok) {
                // Unlock — swap gate for iframe
                gate.style.opacity = '0';
                gate.style.transition = 'opacity 0.2s ease';
                setTimeout(() => {
                    gate.remove();
                    mountIframe();
                }, 200);
            } else {
                err.style.display = 'block';
                input.value = '';
                input.focus();
                btn.textContent = 'Enter';
                btn.style.opacity = '1';
            }
        } catch {
            err.style.display = 'block';
            btn.textContent = 'Enter';
            btn.style.opacity = '1';
        }
    };

    btn.onclick = attempt;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });

    gate.appendChild(gateLabel);
    gate.appendChild(input);
    gate.appendChild(err);
    gate.appendChild(btn);

    // ── Discreet close button (top-right) ────────────────────────────────
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    Object.assign(closeBtn.style, {
        position: 'absolute',
        top: '16px',
        right: '18px',
        zIndex: '10',
        width: '32px',
        height: '32px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'transparent',
        color: 'rgba(255,255,255,0.3)',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"IBM Plex Mono", monospace',
        transition: 'border-color 0.14s, color 0.14s',
        lineHeight: '1',
    });
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.borderColor = 'rgba(255,255,255,0.3)';
        closeBtn.style.color = 'rgba(255,255,255,0.8)';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.borderColor = 'rgba(255,255,255,0.08)';
        closeBtn.style.color = 'rgba(255,255,255,0.3)';
    });
    closeBtn.onclick = close;

    // ── Mount iframe after auth ──────────────────────────────────────────
    function mountIframe() {
        // Recenter overlay for the iframe view
        overlay.style.justifyContent = 'flex-start';
        overlay.style.alignItems = 'stretch';

        const iframe = document.createElement('iframe');
        iframe.src = '/lab/design-bank/';
        Object.assign(iframe.style, {
            flex: '1',
            width: '100%',
            border: 'none',
            display: 'block',
        });
        iframe.setAttribute('allowfullscreen', '');
        overlay.appendChild(iframe);

        // Re-expose close button above iframe
        closeBtn.style.zIndex = '10001';
    }

    overlay.appendChild(closeBtn);
    overlay.appendChild(gate);
    document.body.appendChild(overlay);

    // Trigger entrance animation
    requestAnimationFrame(() => requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.transform = 'translateY(0)';
    }));

    // Focus input after animation
    setTimeout(() => input.focus(), 380);
}
