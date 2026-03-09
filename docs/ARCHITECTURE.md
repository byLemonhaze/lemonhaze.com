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
| Secondary entry | `supply.html` + `src/supply.js` | Separate supply-oriented page shell that reuses the shared supply renderer |
| Legacy alias | `public/_redirects` | Redirect rule preserving `/supplyCAP.html` as an alias to `/supply.html` |
| Static data | `src/data.js`, `src/data/*`, `public/data/*` | Curated copy, chronology, supply tables, blog posts, fallback provenance, generated sales indices |
| Edge runtime | Cloudflare Pages Functions (`functions/`) | SPA shell fallback, inscription metadata proxying, and password-protected Press Engine generation |
| Sales pipeline | `scripts/` + `data/sales-master/` | Marketplace scraping, manual private-sale merge, inscription-level sales index generation |
| Hosting | Cloudflare Pages (`wrangler.toml`) | Production build/deploy target for static assets and Functions |

## Public App Flow

### 1. Boot

1. The browser loads `index.html`, which bootstraps `src/main.js`.
2. `startApp()` in `src/app/runtime.js` fetches provenance data and the live BEST BEFORE collection.
3. BEST BEFORE rows from provenance are replaced at runtime with the live collection payload when available.
4. Sidebar navigation, section definitions, and collection slug maps are built from the resolved artwork set.

### 2. Routing

The router in `src/router/index.js` owns canonical path-based state:

- `/<collection-slug>` for collection browsing
- `/<section-name>` for internal sections (`about`, `highlights`, `supply`, `media`, `lab`)
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
4. Sales history is loaded from generated local indices in `public/data/sales-master/`.
5. BTC/USD spot is fetched client-side to add approximate fiat context to BTC sale prices.

The artwork modal is therefore the main integration point between curated repo data, live Ordinals metadata, and generated market history.

## Edge Services

### `functions/[[path]].ts`

- Serves `index.html` for clean direct-path visits like `/about`, `/best-before`, and `/<inscription-id>`
- Rewrites legacy app entry pages such as `/collection.html` and `/modal.html` to the SPA shell so old shared links can normalize forward
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
- `src/renderers/sections/supply.js` contains the shared supply UI used by both the main app section and the standalone marketplace page.
- Provenance is expected primarily from Lemonhaze CDN, with `/public/data/provenance.json` as a local fallback.
- BEST BEFORE is intentionally treated as a live external integration rather than static repo data.
- `data/sales-master/` is working data for scripts; `public/data/sales-master/` is the browser-served output.
- `db/migrations/` currently documents a future D1-backed sales schema and is not part of the production runtime path yet.

## Operational Notes

- The public app should fail soft when external data is unavailable: provenance falls back across multiple sources, BEST BEFORE data degrades gracefully, and missing metadata/sales data should not block browsing.
- `public/_headers` controls cache behavior for HTML and immutable built assets.
- Clean path routing depends on the Cloudflare Pages fallback function in `functions/[[path]].ts`; local `vite preview` exercises the built client app but not that edge fallback layer.
