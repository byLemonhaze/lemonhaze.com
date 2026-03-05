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

- Cloudflare Pages Functions under `functions/api/` are deployed automatically with the site bundle.
- `db/migrations/` is not active in production until a D1 binding and runtime integration are added.
- If data scripts are used to refresh sales indices, regenerate the browser-facing outputs before deploy so `public/data/sales-master/` stays in sync.
