# lemonhaze.com Deployment

## Production Target

- Platform: Cloudflare Pages
- Config: `wrangler.toml`
- Build output: `dist`
- Compatibility date: `2024-09-23`

## Local Development

Use the pinned Node version from `.nvmrc`:

```bash
nvm use
npm ci
npm run dev
```

Useful local commands:

```bash
npm run build
npm run preview
npm run verify
```

## Required Production Secrets

These values should be configured in Cloudflare Pages project settings, not committed to the repo:

- `PRESS_ENGINE_PASSWORD`
- `CLAUDE_API_KEY`

They are required only for the private Press Engine function. The rest of the public site remains static-plus-edge.

## CI

GitHub Actions verifies the repo on pushes and pull requests by:

1. installing dependencies with `npm ci`
2. building the site
3. running repo standards tests

CI uses the same Node major version pinned in `.nvmrc`.

## Production Deploy

Authenticate first:

```bash
npx wrangler whoami
```

Then deploy:

```bash
npm run verify
npx wrangler pages deploy dist --project-name lemonhaze
```

## Caching

`public/_headers` defines the current cache policy:

- HTML routes: `no-cache`
- root path: `no-cache`
- built assets under `/assets/*`: long-lived immutable cache

## Operational Notes

- Cloudflare Pages Functions under `functions/` are deployed automatically with the site bundle.
- `functions/[[path]].ts` is required for SPA deep links so direct visits to `/about`, `/best-before`, and `/<inscription-id>` resolve to the app shell instead of a 404.
- `MARKET_WATCH_DB` stores public Market Watch snapshots and refresh leases. Apply `db/market-watch-migrations/` with `npx wrangler d1 migrations apply MARKET_WATCH_DB --remote` before the first deployment. The separate legacy `db/migrations/` sales schema remains inactive.
- If data scripts are used to refresh sales indices, regenerate the browser-facing outputs before deploy so `public/data/sales-master/` stays in sync.

## Market Watch

`/market-watch/` is a separate Vite entry linked from Supply & Marketplace. It uses the same public site origin and requires no login, wallet connection, or marketplace API key.

The Pages endpoints `GET /api/market-watch/snapshot` and `POST /api/market-watch/scan` persist shared snapshots in the dedicated D1 binding. Scan targets must be catalogued; client input cannot choose arbitrary external URLs. Atomic five-minute leases prevent visitors from duplicating the same source check. Satflow connections are paced, and HTTP 429 pauses its checks for five minutes. Failed refreshes preserve the previous result with a stale label.

The initial bundled snapshot is a dated fallback. Coverage is incomplete when public feeds omit auctions, lots, private offers, or exact inscription IDs. Do not treat unavailable sources as zero. Source adapters are in `src/market-watch/lib/scanner.ts`; recheck them if a marketplace changes its public interfaces.
