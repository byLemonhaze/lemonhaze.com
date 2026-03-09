# lemonhaze.com

Personal website and on-chain art catalogue for Lemonhaze.

This project is a vanilla JS + Vite + Tailwind app focused on:

- Collection browsing by year
- Artwork modal deep links
- Section views (About, Highlights, Supply, Media, Lab)
- Ordinals-native context (inscriptions, provenance, on-chain fallback)

## Stack

- Vite 6
- Tailwind CSS 3
- Vanilla JavaScript (modular architecture, no framework runtime)
- Cloudflare Pages (production hosting/deploy)

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/API.md`](docs/API.md)
- [`docs/DATA-SOURCES.md`](docs/DATA-SOURCES.md)
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Project Structure

```text
src/
  main.js                     # bootstrap
  app/
    runtime.js                # app orchestration + init
    section-flow.js           # section/artwork route flow
    collection-flow.js        # collection loading + active state
  router/
    index.js                  # URL state parser/sync/apply
    path-state.js             # canonical path helpers + legacy query parsing
    constants.js              # accepted legacy query aliases
  state/
    store.js                  # shared app state
  renderers/
    home.js
    gallery.js
    sidebar.js
    modal/
      artwork.js
      section.js
    sections/
      index.js
      view.js
      about/highlights/supply/media/lab renderers
  ui/
    elements.js
    header.js
    loading.js
    menu.js
  events/
    index.js
  data.js                     # content, chronology, supply tables, links
```

## URL State and Deep Links

The app now uses canonical path-based routes:

- `/<collection-slug>`
- `/<section-name>`
- `/<inscription-id>`

Examples:

- `/best-before`
- `/about`
- `/0c57ce6325d8da6242488d453c13bac0e1e1eaca6a5b3bf4078a6bdd6768d49di0`

Legacy query links are still accepted and normalized into path slugs. Supported aliases include `c`, `collection`, `name`, `s`, `section`, `a`, and `id`.

## Data Sources

| Source | URL | Used For |
|--------|-----|----------|
| Provenance JSON | `https://cdn.lemonhaze.com/assets/assets/provenance.json` | All collection/artwork metadata |
| On-chain content | `https://ordinals.com/content/<id>` | Artwork rendering in modal (image + HTML) |
| Hiro API | `https://api.hiro.so/ordinals/v1/inscriptions/<id>` | Live inscription data: number, owner, sat rarity, genesis timestamp |
| BB Collection | `https://bestbefore.space/magic_eden_collection.json` | Replaces provenance.json entries for BEST BEFORE — provides live roster + high-res images |
| BB Live | `https://bestbefore.space/best-before.json` | BEST BEFORE phase, palette, block countdown, lifespan per inscription |

One inscription is intentionally forced to on-chain content instead of CDN:

- `0c57ce6325d8da6242488d453c13bac0e1e1eaca6a5b3bf4078a6bdd6768d49di0`

The BEST BEFORE collection is treated as a special case throughout: its entries in `provenance.json` are replaced at runtime by `magic_eden_collection.json` data (which carries live high-res images), and the artwork modal fetches `best-before.json` to display phase status, palette swatches, and block-time lifespan for each piece.

## Local Development

```bash
nvm use
npm ci
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview local production build:

```bash
npm run preview
```

Run the standard verification gate:

```bash
npm run verify
```

## Deploy (Cloudflare Pages)

Authenticate first:

```bash
npx wrangler whoami
```

Deploy to production project:

```bash
npm run verify
npx wrangler pages deploy dist --project-name lemonhaze
```

## Notes

- Main site entry is `index.html` (bootstraps `src/main.js`).
- `supply.html` is a separate Vite input with its own script (`src/supply.js`) and legacy UI treatment.
- `src/data.js` is the canonical source for supply rows, marketplace links, and supply-page link overrides.
- `src/renderers/sections/supply.js` is the shared supply renderer used by both the in-app Supply section and the standalone `/supply.html` page.
- `public/_redirects` carries the legacy `/supplyCAP.html` -> `/supply.html` redirect.
- `functions/[[path]].ts` serves the SPA shell for clean direct-path visits and old app entry pages like `/modal.html`.
- Some older files remain for historical/backup context (for example `src/main.js.bak`).
- `public/_headers` controls the current cache policy for HTML and built assets.

## Maintainer

- GitHub: [@byLemonhaze](https://github.com/byLemonhaze)
- Website: [lemonhaze.com](https://lemonhaze.com)
