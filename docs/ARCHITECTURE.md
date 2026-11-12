# Site architecture

Current application baseline: `041ea75`, November 11, 2026. [Documentation index](README.md) · [Immersive details](immersive/ARCHITECTURE.md).

## Runtime and source map

The primary application is modular vanilla JavaScript with Vite and Tailwind. Market Watch is a separately loaded React module, so the repository is not entirely framework-free. Static/prerendered pages and Cloudflare Pages Functions share the production origin.

| Area | Source | Responsibility |
| --- | --- | --- |
| Entry | `index.html`, `src/main.js`, `src/app/runtime.js` | First-paint theme/mode, bootstrap, catalogue assembly and shared controllers |
| Website routing | `src/router/`, `src/app/section-flow.js`, `src/app/collection-flow.js` | Canonical paths, legacy aliases, sections and collections |
| Viewing modes | `src/immersive/modes.js`, `experience.js` | Mode intent, artwork context, history, stale-transition cancellation |
| Explore | `src/immersive/explore.js`, `layout.js`, `field-physics.js`, `zoom.js` | Field geometry, camera, touch/wheel input, containment and bounce |
| Gallery | `src/immersive/gallery.js`, `gallery-motion.js`, `collections.js` | Infinite slots, gestures, snap, collection chooser and remembered positions |
| Shared detail | `src/immersive/detail.js`, `presentation.js`, `media.js`, `live-document.js` | Artwork/metadata split, desktop solo, image fitting and live-media lifetime |
| Full metadata | `src/renderers/modal/artwork.js`, `src/modules/` | Inscription context, ownership, notes, sales, specialised viewer/export support |
| Curation | `src/curation/`, `src/data/`, `src/data.js` | Selected works, covers, collection records, Ethereum entries and editorial metadata |
| Editorial | `src/editorial/`, `src/renderers/sections/` | Existing writing, Studio Notes, collecting, exhibitions and supply |
| Presentation | `src/ui/presentation.*`, `src/immersive/modes.css`, `experience.css` | Shared paper/charcoal theme, stable chrome and responsive layouts |
| Services | `functions/`, `server/` | Metadata compatibility endpoint, Market Watch, private Press Engine, shop and response headers |
| Build | `scripts/build_*`, `scripts/prerender_seo.mjs` | Manifests, title index, visualizer, bundled application and generated route HTML |

## Boot and routing

The initial HTML selects paper by default, reads a saved/explicit theme before first paint, and resolves the requested view before the app loads. Storage failure keeps the paper default. The mobile root includes a lightweight lemon preview, not a serialized desktop camera with eager large images.

Runtime assembles provenance, BEST BEFORE and repo-managed featured manifests. Local fallbacks preserve browsing when remote data is unavailable. The immersive catalogue adds the existing Impossible Folds print records. Its original-only Explore roster is separate from the complete inscription catalogue and the visualizer.

The root opens Explore; explicit `view=explore|gallery|website` selects a mode. `work=<id>` opens detail; `at=<id>` focuses the field or carousel without detail. Gallery also uses `series=<name>`. Existing collection, section and inscription paths retain Website behavior unless a view is explicitly requested. Legacy `c`, `collection`, `name`, `s`, `section`, `a`, and `id` aliases remain accepted. `/explore` redirects to `/practice`; `/provenance` redirects to `/all-works`.

Mode switches preserve the wordmark and switch position. Website always opens its editorial home rather than an inherited artwork page. Gallery/detail → Explore focuses the same work in the field; detail → Gallery retains that work’s collection. Navigation generations discard stale asynchronous continuations and obsolete fades. See the [navigation contract](immersive/ARCHITECTURE.md#navigation-contract).

## Website and editorial content

The Website landing introduces the destinations without repeating Selected Work’s artwork grid or “A continuous practice” introduction. One right-hand Menu serves desktop/mobile. All Works expands into years and a final visual chronology link within a bounded scroll area; expanding a year cannot move Studio Notes, Collecting, Print Shop or Lab out of view.

`/selected` retains eight individual works, six selected-series cards and the Paint Engines chapter. `/practice` contains the existing practice chapters and physical-work context, including the uncropped Hosoi signing film segment. `/archive` contains 86 Studio Notes with search, subject/collection/year filters, editorial/date ordering and preserved note anchors. A note’s summary image disappears when its full content opens. `/collecting` includes contextual art/print imagery while preserving the existing prose. `/gentleman-se-2025` remains a separate writing destination. Source credits remain in `public/editorial/sources.md`.

Reviewed collection narratives and exact-ID footnotes remain in `src/editorial/collection-stories.json` and `artwork-footnotes.json`. Original writing is not replaced by new summaries during UI work. The previous homepage carousel remains historical code, not the active landing experience.

## Artwork and data boundaries

The shared detail shows one artwork and metadata; complete records/sales mount on expansion. Large stills decode before replacing previews. Live documents wait for actual paint and fall back to static imagery when unavailable. The desktop solo state enlarges the existing media without changing the selected work, URL or live instance. Native proportions and the shared mat apply throughout.

Live ownership comes from Ordinals through the current client metadata module. The legacy Hiro-based API remains a compatibility endpoint; it is not the viewer’s live metadata source. Burn status requires explicit evidence, not an absent address. Sales use the curated historical ledger, and current BTC/USD is only approximate present-day context when appropriate. See [Data sources](DATA-SOURCES.md).

“Provenance” is an internal grouping in source records, not a public collection. Those records must not be deleted merely to remove a UI group. Parent-child records, edition provenance, collection leads and the original-only Explore policy have distinct purposes. Five Ethereum works live in their own verified manifest and All Works; they are not added to the approved inscription field.

## Server and build boundaries

`npm run build` generates SEO routes, the market title index, the visualizer and the Vite bundle, then prerenders known routes. Release `041ea75` generated 1,704 routes. `functions/[[path]].ts` handles selected legacy redirects and app-entry aliases; known clean routes are generated HTML. Unknown routes retain genuine 404s rather than receiving an arbitrary SPA shell.

`functions/_middleware.ts` applies `server/security-headers.js`. Public site HTML permits same-origin, catalogue.gallery and www.catalogue.gallery parents. Direct shop/privacy/terms responses deny framing. Lab, visualizer and third-party content exceptions remain separate. Some resource restrictions are report-only and must not be described as fully enforced policy.

Market Watch persists shared observations and scan leases in `MARKET_WATCH_DB`. The closed shop uses separate `SHOP_DB` inventory/order infrastructure, also used by private Press Engine budgets. The old `db/migrations/` sales schema remains scaffolding; it is not the active Market Watch or shop database. [API inventory](API.md) · [Deployment](DEPLOYMENT.md) · [Shop operations](SHOP.md).

## BEST BEFORE specialised player and recording

The existing specialised viewer/export implementation remains distinct from the immersive first-paint bridge. The toolbar and export support below refer to that player, not to extra controls added to the new immersive solo view.


The individual viewer fetches the original on-chain HTML and runs it in a `srcdoc` iframe with an opaque origin (`allow-scripts allow-downloads`, without `allow-same-origin`). The adapter preserves the inscription ID and real chain lookups, removes the renderer’s page background and inset, and aligns both canvas layers to a 900 × 1600 display viewport without changing their native 1800 × 3200 resolution. The bounded source adaptation fails visibly if the renderer version changes.

A per-instance token and source-window checks authenticate messages between viewer and frame. PNG uses the renderer’s own save function. MP4 capture scales both canvas layers to fit 1080 × 1920 (1920 × 1080 for landscape), with even dimensions and no upscaling. The authenticated bridge transfers one ImageBitmap at a time to the parent. The lazily loaded `best-before-mp4.js` uses WebCodecs through Mediabunny to encode H.264 High (up to Level 4.1) at a 6 Mbps constant bitrate target, with exactly 30 explicitly timestamped frames per second and a generated stereo 48 kHz AAC-LC silent access unit repeated to the selected duration, avoiding browser audio-encoder priming padding. The 15/30/60-second exports are finalized as non-fragmented MP4s with front-loaded metadata. No microphone, AudioContext, external conversion service, or cross-origin isolation is needed. The encoder checks actual codec support, frame count, and an 8 Mbps average video bitrate ceiling before download. Unsupported browsers fail clearly without downloading a raw fallback. The unmodified Mediabunny dependency is pinned; its license and source links are published at `/third-party/mediabunny.txt`. Recording is enabled only for fully rendered OPEN works. Cancellation, hidden-tab changes, and modal teardown stop capture; closing the viewer also removes listeners, observers, and the embedded document.

The gallery viewer separates the toolbar, artwork stage, and scrollable details. Export controls live in the right details sidebar alongside the palette. Solo hides that sidebar against an opaque background, leaving the artwork unobstructed. Lemonhaze retains its existing viewer palette. Deep-link startup adopts any prerendered wrapper and replaces serialized capture controls before initializing a fresh player.
