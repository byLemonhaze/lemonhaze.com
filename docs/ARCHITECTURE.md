# lemonhaze.com Architecture

## Purpose

This document is the high-level engineering map for `lemonhaze.com`:

- how the public site boots and routes
- where collection and inscription data comes from
- how artwork metadata and sales enrichment are assembled
- what runs in the browser versus Cloudflare Pages Functions

## System Components

| Layer | Component | Responsibility |
|---|---|---|
| Frontend | Vite app (`index.html`, `src/`) | Collection browsing, deep links, modals, internal sections, blog, and supply navigation |
| Legacy alias | `public/_redirects` | Redirect rules preserving `/marketplace`, `/supplyCAP.html`, and `/supply.html` as aliases to `/supply` |
| Static data | `src/data.js`, `src/data/*`, `public/data/*` | Curated copy, chronology, supply tables, blog posts, fallback provenance, generated sales indices |
| Edge runtime | Cloudflare Pages Functions (`functions/`) | SPA shell fallback, inscription metadata proxying, and password-protected Press Engine generation |
| Sales pipeline | `scripts/` + `data/sales-master/` | Marketplace scraping, manual private-sale merge, inscription-level sales index generation |
| Hosting | Cloudflare Pages (`wrangler.toml`) | Production build/deploy target for static assets and Functions |

## Public App Flow

### 1. Boot

1. The browser loads `index.html`, which bootstraps `src/main.js`.
2. `startApp()` in `src/app/runtime.js` fetches provenance data, the live BEST BEFORE collection, and the repo-managed featured collection manifests.
3. BEST BEFORE rows from provenance are replaced at runtime with the live collection payload when available.
4. Satoshi, Deprivation prints, Mirage prints, the prints trilogy, Griffintown, Liminality, and Eclosion are merged from their repo-managed local manifests, taking precedence over matching provenance IDs.
5. Sidebar navigation, section definitions, and collection slug maps are built from the resolved artwork set.

### 2. Routing

The router in `src/router/index.js` owns canonical path-based state:

- `/<collection-slug>` for collection browsing
- `/<section-name>` for internal sections (`about`, `highlights`, `explore`, `practice`, `paint-engine`, `collecting`, `supply`, `media`, `lab`)
- `/<inscription-id>` for artwork modal deep links

Legacy query links (`c`, `collection`, `name`, `s`, `section`, `a`, `id`) are still accepted and normalized. Invalid or conflicting combinations are rewritten to the canonical path shape.

### 3. Views

- Collection browsing is coordinated by `collection-flow.js`.
- Internal sections (`about`, `highlights`, `supply`, `media`, `blog`, `lab`) are coordinated by `section-flow.js`.
- Home, gallery, sidebar, and modal rendering live under `src/renderers/`.

The app is intentionally framework-free: state is kept in a small shared store and DOM rendering is explicit.

## Artwork Detail Flow

When an artwork opens:

1. The modal controller in `src/renderers/modal/artwork.js` selects a media strategy.
2. Media may come from:
   - curated CDN/fallback image URLs
   - direct on-chain HTML/media for selected collections
   - BEST BEFORE live HTML and status data
3. Metadata is enriched from Hiro and Ordinals endpoints.
4. Collection medium, creation tools, source links, and documented launch prices are read from `COLLECTION_DETAILS` in `src/data.js`.
5. Sales history is loaded from the canonical ledger in `public/data/sales-master/`.
6. BTC/USD spot is fetched client-side to add approximate current fiat context when sale-time USD is unavailable.

The artwork modal is therefore the main integration point between curated repo data, live Ordinals metadata, and generated market history.

## Edge Services

### `functions/[[path]].ts`

- Serves `index.html` for clean direct-path visits like `/about`, `/best-before`, and `/<inscription-id>`
- Rewrites legacy app entry pages such as `/collection.html` and `/modal.html` to the SPA shell so old shared links can normalize forward
- Redirects legacy `/marketplace` requests to the canonical `/supply` route
- Leaves asset and API requests alone

### `GET /api/inscription-metadata`

- Validates `inscription_id`
- Queries Hiro
- Returns a normalized JSON payload for address, inscription number, timestamp, sat rarity, and source/warning flags

### `POST /api/press-engine`

- Requires `x-press-password`
- Uses `PRESS_ENGINE_PASSWORD` and `CLAUDE_API_KEY`
- Streams generated text from Anthropic back to the browser
- Powers the private Press Engine UI opened from the site

## Data Boundaries

- `src/data.js` and `src/data/*` contain editorially curated site copy and chronology.
- Supply rows, marketplace links, and supply-page collection overrides are centralized in `src/data.js`.
- The supply summary separates manually documented primary volume from indexed resale volume. It never infers primary sales from transfer history, includes documented launch bundles, and excludes secondary aggregate roll-ups that would duplicate inscription-level trades.
- `src/renderers/sections/supply.js` contains the shared supply UI for the canonical `/supply` section, including Bitcoin collections, Ethereum works, and physical works.
- Provenance is expected primarily from Lemonhaze CDN, with `/public/data/provenance.json` as a local fallback.
- BEST BEFORE is intentionally treated as a live external integration rather than static repo data.
- `data/sales-master/` is working data for scripts; `public/data/sales-master/` is the browser-served output.
- `db/migrations/` currently documents a future D1-backed sales schema and is not part of the production runtime path yet.

## Operational Notes

- The public app should fail soft when external data is unavailable: provenance falls back across multiple sources, BEST BEFORE data degrades gracefully, and missing metadata/sales data should not block browsing.
- `public/_headers` controls cache behavior for HTML and immutable built assets.
- Clean path routing depends on the Cloudflare Pages fallback function in `functions/[[path]].ts`; local `vite preview` exercises the built client app but not that edge fallback layer.

## Explore the practice

`/explore` is the reading hub linked directly below Career Highlights in the sidebar, from About and Career Highlights, and from every collection header. It leads to `/practice`, `/paint-engine`, `/collecting`, and the four collection stories. Those reading pages keep Explore the practice active in the sidebar.

`src/editorial/` contains scoped styles, reviewed HTML content fragments, original Montreal notes keyed by inscription ID, and DOM navigation helpers. Collection stories are appended beneath the existing gallery cards for Montreal, Gentlemen, Liminality, and BEST BEFORE. Header anchors jump directly to the story or diary. The gallery renderer and collection datasets are unchanged.

The artwork modal receives an optional artist-note renderer from runtime; Montreal notes and the Gentleman SE 2025 reading link appear alongside existing metadata. Original biography, collection descriptions, and career entries are retained. BEST BEFORE includes dated excerpts, a complete expandable diary, lifecycle explanation, and clearly labeled AI framing studies. The composite nature of diary Part Two is explicitly attributed.

`public/editorial/` holds image assets, public source credits, and the saved Passe-Partout engine. The engine iframe loads only on request. Original artist writing remains unchanged; local-review labels and document shells are excluded from production fragments. New reading routes use the existing Pages SPA fallback. Route changes clear obsolete collection anchors, while direct reading anchors are restored after initial rendering.

### Collection reading and sorting

Collection narratives in `src/editorial/collection-stories.json` extend the existing gallery with dated source links. `artwork-footnotes.json` attaches reviewed excerpts or summaries to exact inscription IDs. The renderer uses text nodes; original HTML scripts are never executed. The Explore hub links to each story and collection headers retain the works/story navigation. Original descriptions and provenance data are unchanged. The editorial content covers 30 collection readings and 71 artwork IDs. Later reflections are dated to distinguish them from creation history. Hosoi’s sales-source classification was corrected to an artist-confirmed public primary sale; the visible copy omits the marketplace.

Supply lists have independent search and name/year/supply/circulation/burn sorts for desktop and mobile, without changing aggregate totals. Ethereum lists expose their supported year/platform/count fields. Market Watch collection, cross-listing and offer tabs each have relevant sort controls. `src/utils/sorting.js` puts missing values last in either direction, preserves known zeros and never mutates source arrays. Market totals, scan behavior and coverage qualifiers are unchanged. Sort state lasts for the mounted page; it is not persisted in the URL.

Editorial links are normalized by `src/editorial/links.js` before click handling. Legacy reading filenames and presentation assets resolve to canonical internal routes on both production hosts and local preview, preserving query strings and section anchors. Tests cover the links extracted from every editorial HTML fragment.


### Collection chronology and mobile Market Watch

Supply’s newest/oldest controls use collection parent timestamps rather than year labels. Pre-parent collections use their first documented inscription; missing dates remain last. `src/utils/collection-chronology.js` resolves the chronology from artwork lineage, with verified dates for missing parent records in `src/data/collection-parent-dates.js`.

Market Watch uses explicit parent/first-artwork choices from `src/market-watch/lib/collection-thumbnails.json`. Optimized assets in `public/images/market-watch/` retain source URLs and inscription IDs in that manifest, so marketplace refreshes cannot replace them with gallery covers. Forty-two derive from CDN images and seven from previews of the same inscription where the CDN image is absent. The palette is neutral white/grey.

At phone/tablet widths, collection and offer table rows become labelled cards. Every marketplace count, floor, offer field, coverage marker and details link remains available without horizontal table scrolling. Cross-listed marketplace observations stack vertically. Desktop tables retain their original layout. Table roles and column headers remain available to assistive technology.

Mobile collection headers wrap metadata and keep the external-site control separate from the description toggle. Story and diary body text uses a readable 16px size; form controls use 16px to avoid focus zoom on iOS. The redundant mobile header Artworks link is hidden while the story’s return-to-works link remains. Games displays only “Three works become one” on its collection story; original artwork notes remain with each inscription.
