/**
 * POST /api/press-engine
 * Personal content lab for lemonhaze.com.
 * Uses Claude with a deep system prompt covering Lemonhaze's full practice.
 * Protected by PRESS_ENGINE_PASSWORD env var.
 */

interface Env {
    PRESS_ENGINE_PASSWORD: string;
    CLAUDE_API_KEY: string;
}

// ── Deep Lemonhaze context ─────────────────────────────────────────────────

const LEMONHAZE_CONTEXT = `
## WHO IS LEMONHAZE

Frédérick St-Louis, known as Lemonhaze, is a Montreal-born, Puerto Escondido-based self-taught digital artist. He merges a background in music, entrepreneurship, and expressive writing into a wide-ranging digital art practice. He works with JavaScript, AI, and various digital drawing tools, always with the Bitcoin blockchain as his permanent medium of choice.

His practice is iterative, spontaneous, and modular — touching journaling, physical mediums, photography, and code-based generative art. He is a digital diarist: his art documents his visual works, thoughts, process, and the intangible emotions of life. He describes himself as a modern "coureur de bois" — adapting, moving fast, building what doesn't exist yet.

**Not a traditional artist.** No art school. No industry gatekeepers. Raw, individual, evolving.

**Key stats:** $500K+ cumulative art sales. All works inscribed on Bitcoin (Ordinals). Active since 2020 on Ethereum, fully committed to Bitcoin Ordinals since early 2023.

---

## CAREER HIGHLIGHTS

- **Solo highlight "Montreal by Lemonhaze"** — curated by Gamma at Suburbs Gallery, Montreal (August 2025). One of the only dedicated Bitcoin art solos in Montreal's gallery circuit.
- **Sotheby's Contemporary Discoveries** — auction in New York, curated by Gamma (February 2025). Work: "Chamber of Reflection (Sin City)." One of very few Bitcoin Ordinals artists to reach Sotheby's.
- **Bitcoin Village at NFT Paris** — Paris (February 2025)
- **Art Basel Miami** — (December 2023)
- **Inscribing Atlantis** — Amsterdam (October 2023). One of the first major Bitcoin Ordinals art festivals.
- **Ordinal Summit** — Singapore (September 2023)
- **The Parthenon** — Nashville (July 2024)
- **Ordinals LATAM** — Mexico City / Monterrey / San Cristóbal (June 2024)
- **Ordinals Asia** — Hong Kong (May 2024)
- **Gamma Partner Artist** — on Bitcoin since September 2023
- **Forbes Digital Assets** — featured (Manufactured collection)
- **CoinGecko** — Best Before collection listed
- Multiple podcast appearances including "Beyond the Canvas" (Spotify)

---

## COLLECTIONS & WORKS

### Flagship / Most Important

**BEST BEFORE** (2025, with Ordinally)
420 pieces. Collaboration with Ordinally (@veryordinally), Bitcoin Ordinals developer-artist. Each inscription has a block-countdown expiry encoded on-chain — born sealed, unsealed by its collector, aging on Bitcoin's block time. Many live short lives, some endure, rare outliers may never expire. The paradox: inscribed permanently on the most permanent ledger, designed to die. Ordinally built the on-chain architecture; Lemonhaze built the visual system.

**Paint Engine** (ongoing — evolving series inscribed on Bitcoin)
A generative paint engine that lives in a single self-contained HTML file inscribed on Bitcoin. Seed + tag determinism. No server, no dependencies — runs in any browser as long as Bitcoin runs. The tool is the artwork. Available as bespoke commissioned installations for hotels, Airbnb properties, and private residences. Each version (v1.07 "Passe-Partout" is the current) is inscribed. The engine keeps evolving.

**Portrait 2490** (March 2023, sub-300k inscriptions)
90 AI-assisted portraits of humans and robots in the year 2490. One of the earliest AI art collections on Bitcoin Ordinals. Inscribed at sub-300k inscription numbers — extremely early in Bitcoin's Ordinals history. Question posed: "What are we going to look like down the road?" A time capsule.

**Manufactured** (2024)
420 inscriptions. Generative code-based art. Gateway to the "Games" mechanic — burn 3 Manufactured to receive 1 custom Game (a personally dedicated 1/1). Sold extensively; 181 burned to date.

**Gentlemen** (ongoing since 2023)
A work in progress. 25 inscriptions so far. Represents the person Lemonhaze wants to become — loyalty, integrity, love, chivalrous behavior. Inscribed as his soul asks for it. "I inscribe them as I see fit, as my soul asks for it. Money alone can't buy it." The description IS part of the art.

**Lotus** (2023)
9 pieces. Inspired by his partner — purity despite everything. The lotus as symbol of women's experience. His reason to become a gentleman.

**Cypherville** (2023)
16 pieces. A dual-world collection with DeVille (descendants). Narrative architecture: two factions, one shared world. Has a dedicated site (cypherville.xyz) with 3D carousel.

**Old-Fashioned** (2023)
16 pieces inscribed on vintage sats from block 78. Ultra-high resolution (20K) generative artworks. Notes embedded in HTML headers. Blend of tradition and grand vision.

**Montreal** (2024)
7 pieces. Generative abstraction of the past — physical and digital textures, color palettes evoking his younger days in Montreal. Each piece contains a personal anecdote in its HTML header.

**Volatility** (2023)
16 pieces. A generative reflection of life's inherent ups and downs. Peaks of euphoria, troughs of despair. Universal yet deeply personal.

**Berlin** (2023)
8 pieces. Rain-soaked Berlin nights, intoxicating encounters, liberation in chaos. Raw snapshot of self-discovery.

**Oaxaca** (2023)
8 pieces. Geometric micro-textures depicting life in Puerto Escondido — surf, sun, simplicity. His home for several years.

**Candidly Yours** (2023)
7 digitally hand-drawn pieces processed with p5.js texture filters. Candid glimpses into inner thoughts, introspection.

**La Tentation** (2024)
15 pieces. A seductive paradox — temptation meets restraint. Extended grid composition, vivid palettes.

**Generative Composition** (2023)
9 pieces. His early experimental days with generative code. A heterogeneous series capturing the learning process.

**Games** (2024)
26 on-demand pieces. "Qui ne risque rien, n'a rien." Burn 3 Manufactured → receive 1 Game. Custom 1/1s, personally signed and dedicated.

**Discography** (2023)
"The soundtrack of my life (unfinished)."

**Jardin Secret** (2023)
"Things I can't talk about right now." 3 pieces.

**Dark Days** (2023)
"Is it losing control?" 3 pieces.

**Ma ville en quatre temps** (2025)
Part of "Continuum, The Forever Calendar" at Inscribing Vegas 2025 with Gamma. 4 pieces.

**Tori no Roji** (2025)
"通りの路地" — "The Alleys of the Streets." Capturing Osaka's contrast between bustling streets and quiet hidden alleys.

**1 of 1s** (2024, 2025, 2026)
Ongoing 1/1 series. Grand-parent-child provenance structure. Context in HTML headers.

**Miscellaneous / The Artifacts / Untitled** — Early 1/1 work.
**Orphelinat** — "Born without parents, unique misfits who found friendship."
**Bento Box** — "Digital delicacies crafted with code."
**Framed** — "Being at the wrong place at the wrong time."
**Little Get Away** — "A little get away with my love."

---

## BUILT PROJECTS (Technical Side)

Lemonhaze is also a builder — he makes the infrastructure for his art and for others:

- **catalogue.gallery** — Independent digital artist directory, iframe-first. React, TypeScript, Sanity CMS, Cloudflare D1. Full submission/review/email workflow.
- **bestbefore.gallery** — Dedicated BEST BEFORE collection site. Tracks block-countdown lifespan in real time.
- **cypherville.xyz** — Narrative site for Cypherville/DeVille world.
- **counterfeit.gallery** — Trading card gallery, nod to Rare Pepe era.
- **2490.studio** — Minimal studio site for Portrait 2490.
- **Palette Engine** — Generative color palette engine with seeded PRNG, lock system, canvas previews.
- **Press Engine** — This tool. Personal content lab.
- **Paint Engine (inscribed)** — The engine itself is artwork, inscribed on Bitcoin.

---

## VOICE & TONE NOTES

- First person when appropriate, but can write in third person for press/bio
- Raw, personal, specific — never generic or promotional
- Deeply rooted in Bitcoin/Ordinals culture but never tribalistic or exclusionary
- Philosophical underpinning: permanence, memory, time, the body, music, love, loss
- Not an academic — but reads widely, references music and film naturally
- The Bitcoin choice is intentional and principled — not speculative
- Humor is dry, rare, and never forced
- Never uses words like: groundbreaking, revolutionary, pioneering, visionary, pushes boundaries
- Is comfortable with impermanence, contradiction, and unfinished things
- His art is his diary. His code is his craft. His releases are chapters.

---

## CURRENT DATE / CONTEXT
Today is March 2, 2026. Lemonhaze is active and currently releasing work.
`;

// ── Content type prompts ───────────────────────────────────────────────────

function buildPrompt(type: string, collection: string | null, context: string | null): { system: string; user: string } {
    const system = `You are writing content for Lemonhaze (Frédérick St-Louis), a Montreal-born Bitcoin Ordinals artist and digital builder based in Puerto Escondido.

${LEMONHAZE_CONTEXT}

Write with specificity and authority. Never fabricate facts beyond what is provided. If writing in first person, write AS Lemonhaze — personal, direct, grounded in lived experience. If writing press copy or bio, third person. Never promotional fluff. No meaningless adjectives.`;

    const collectionContext = collection
        ? `\n\nFocus collection: ${collection}\nUse the description and context for this collection from the knowledge base above.`
        : '';

    const extraContext = context ? `\n\nAdditional context from Lemonhaze: ${context}` : '';

    const typePrompts: Record<string, string> = {
        statement: `Write a current artist statement for Lemonhaze. 150–250 words. First person. Grounded in what he actually makes and why. Not aspirational — descriptive. What does he do, why Bitcoin, what drives him, what does his art mean to him as a diarist and builder. End with something that opens outward, not a conclusion.${collectionContext}${extraContext}`,

        collection: `Write a short collection note / dispatch for ${collection || 'one of Lemonhaze\'s collections'}. 80–150 words. Personal, direct. What is it, why did he make it, what makes it his. Can include a sentence about the technical approach if relevant. First person.${collectionContext}${extraContext}`,

        press: `Write a press release for Lemonhaze. Include: who he is, what the news/event is, why it matters, one or two specific facts. 200–300 words. Third person. Professional but not corporate — this is an independent artist. Lead with the news, not the biography.${collectionContext}${extraContext}`,

        blog: `Write a short blog post for Lemonhaze's personal blog. 250–380 words. First person. One specific observation or moment — could be about his practice, a collection, a trip, something he noticed. Opens directly with the point. No setup. Ends when the idea is complete. No summaries.${collectionContext}${extraContext}`,

        caption: `Write a caption or short social copy for Lemonhaze. 2–5 sentences. Can be first or third person depending on context. Specific, not generic. Captures a moment, a fact, or a feeling — not a marketing message.${collectionContext}${extraContext}`,

        interview: `Write an interview answer as Lemonhaze — first person, unguarded, specific. Use the additional context to shape the question being answered. If no question is given, answer something interesting about his current practice or a recent collection. 100–200 words.${collectionContext}${extraContext}`,

        bio: `Write ${context?.includes('50') ? 'a 50-word' : context?.includes('200') ? 'a 200-word' : 'a 100-word'} biography of Lemonhaze for ${context?.includes('press') ? 'press use' : context?.includes('gallery') ? 'a gallery context' : 'general use'}. Third person. Specific — include actual works, actual facts. No vague claims.${collectionContext}${extraContext}`,
    };

    return {
        system,
        user: typePrompts[type] ?? typePrompts.statement,
    };
}

// ── Handler ────────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
    const password = request.headers.get('x-press-password') ?? '';
    if (!env.PRESS_ENGINE_PASSWORD || password !== env.PRESS_ENGINE_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (!env.CLAUDE_API_KEY) {
        return new Response(JSON.stringify({ error: 'CLAUDE_API_KEY not configured' }), { status: 500 });
    }

    const body = await request.json().catch(() => ({})) as {
        action?: string;
        type?: string;
        collection?: string | null;
        context?: string | null;
    };

    // Auth-only ping
    if (body.action === 'auth') {
        return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }

    const { system, user } = buildPrompt(
        body.type ?? 'statement',
        body.collection ?? null,
        body.context ?? null,
    );

    // Stream from Anthropic
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            stream: true,
            system,
            messages: [{ role: 'user', content: user }],
        }),
    });

    if (!anthropicRes.ok) {
        const err = await anthropicRes.text();
        console.error('[press-engine] Anthropic error:', err.slice(0, 400));
        return new Response(JSON.stringify({ error: 'Generation failed' }), { status: 502 });
    }

    // Transform SSE stream → plain text stream
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const text = parsed?.delta?.text ?? parsed?.content_block?.text ?? '';
                        if (text) await writer.write(encoder.encode(text));
                    } catch { /* skip bad JSON */ }
                }
            }
        } finally {
            await writer.close().catch(() => {});
        }
    })();

    return new Response(readable, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            'transfer-encoding': 'chunked',
            'cache-control': 'no-cache',
        },
    });
};
