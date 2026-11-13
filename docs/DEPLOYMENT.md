# Deployment runbook

Latest publication: source `ee07810`, November 13, 2026, [immutable deployment d3b2e225](https://d3b2e225.lemonhaze.pages.dev). See the [mobile bounce report](reports/2026-11-13-mobile-bounce.md) for verification evidence and [PR #68](https://github.com/byLemonhaze/lemonhaze.com/pull/68) for source integration.

Historical November 11 immersive release: `041ea75`, published November 11, 2026 to [lemonhaze.com](https://lemonhaze.com) and [immutable deployment 3d9290e8](https://3d9290e8.lemonhaze.pages.dev). See the [work report](reports/2026-11-11.md) for source history and evidence.

## Targets and local setup

Cloudflare Pages project `lemonhaze` uses `wrangler.toml`, compatibility date `2024-09-23`, and output directory `dist`. Its production deployment branch is `main`. A Cloudflare branch label is a hosting target, not a Git merge: the November 11 application was originally published from `feat/immersive-experience` before source integration.

Use Node 22 from `.nvmrc`:

```bash
nvm use
npm ci
npx playwright install chromium
npm run dev
```

`npm run preview` serves the built application but does not emulate Pages Functions. CI runs `npm run verify` on pushes and pull requests. GitHub main requires the `verify` check; merge through a pull request after it passes.

## Publish an authorized application change

```bash
npx wrangler whoami
npm run verify
```

Choose the target explicitly:

```bash
# Review deployment
npx wrangler pages deploy dist --project-name lemonhaze --branch immersive-review

# Authorized production deployment
npx wrangler pages deploy dist --project-name lemonhaze --branch main
```

Do not omit `--branch`. Record the source commit, actual build/test result, immutable URL and production URL. Check the live bundle, affected routes, redirects, response headers and representative interactions. A successful upload alone does not verify the live UI. Never reuse stale build output after changing application files.

Documentation-only commits need link/path and whitespace checks; they do not need an application redeployment. Keep historical release evidence distinct from checks run for the documentation change.

## Routing, caching and embedding

Known clean routes are prerendered HTML. `functions/[[path]].ts` handles selected legacy redirects and app-entry aliases; it is not an unrestricted SPA fallback. Unknown routes retain real 404s. Pages deploys `functions/` with the site bundle.

`public/_headers` makes HTML and the root `no-cache`; built `/assets/*` revalidate before reuse. Versioned preview assets use immutable caching. Do not serve fallback HTML as cached JavaScript.

Public HTML allows same-origin, `https://catalogue.gallery` and `https://www.catalogue.gallery` parents. Direct shop/privacy/terms responses deny framing. Lab, visualizer and third-party exceptions are separate. See `server/security-headers.js` and [Security](../SECURITY.md); some resource restrictions remain report-only.

## Service configuration

Configure credentials privately in Cloudflare, never in committed files. Private Press Engine generation requires `PRESS_ENGINE_PASSWORD` (at least 32 random characters), `CLAUDE_API_KEY`, `SHOP_RATE_SECRET`, and `SHOP_DB` for budgets. Missing security configuration fails closed. See [API](API.md) and [SHOP.md](SHOP.md) for credentials, gates and payment readiness.

- `MARKET_WATCH_DB` holds public snapshots and refresh leases. Apply `db/market-watch-migrations/` with `npx wrangler d1 migrations apply MARKET_WATCH_DB --remote` before first use.
- `SHOP_DB` has separate migrations under `db/shop-migrations/`; follow the shop runbook before changes.
- The old `db/migrations/` sales schema is inactive scaffolding.
- Regenerate browser-facing sales outputs when their authoritative inputs change; see [Data sources](DATA-SOURCES.md).
- `SHOP_STOREFRONT_OPEN`, `SHOP_LIVE_ENABLED` and `SHOP_POLICIES_CONFIRMED` remain false. This release does not open purchases.

## Market Watch


`/supply#market-watch` embeds Market Watch below the Ordinals supply tables. The old `/market-watch/` route redirects there. Its React bundle loads only when Supply is opened, and navigation cancels in-flight client scans. It uses the same public site origin and requires no login, wallet connection, or marketplace API key.

The Pages endpoints `GET /api/market-watch/snapshot` and `POST /api/market-watch/scan` persist shared snapshots in the dedicated D1 binding. Scan targets must be catalogued; client input cannot choose arbitrary external URLs. Atomic five-minute leases prevent visitors from duplicating the same source check. Satflow connections are paced, and HTTP 429 pauses its checks for five minutes. Failed refreshes preserve the previous result with a stale label.

The initial bundled snapshot is a dated fallback. Coverage is incomplete when public feeds omit auctions, lots, private offers, or exact inscription IDs. Do not treat unavailable sources as zero. Source adapters are in `src/market-watch/lib/scanner.ts`; recheck them if a marketplace changes its public interfaces.

Artwork titles are indexed at build time from the sales history, artist provenance, and collection manifests (in increasing precedence). Exact inscription IDs join these titles to existing and new snapshots. The supplementary title map records names read directly from each inscription’s metadata on ordinals.com. Unknown generic titles are checked against inscription metadata, then content, during scans and cached; the UI never presents a global inscription number as an edition number.

Ord.net defines the Market Watch collection roster. Gamma and Ordinals Wallet discovery only add market mappings to existing Ord.net collections; they cannot create rows. Provenance and Colors are excluded. Gamma’s Glass Breaker, Off-Kilter, and Mending Out print feeds are scanned together as Trilogy, deduplicating inscription IDs within the combined Gamma result. Minute, Papillon! also maps to the existing Ord.net edition collection. Stored legacy rows are reconciled on read and removed from visible totals, offers, and cross-listing comparisons without deleting historical snapshots.
