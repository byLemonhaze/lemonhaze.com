# lemonhaze.com

Lemonhaze’s artist website, artwork archive and connected Explore / Gallery / Website experience.

**Current production release:** [041ea75](https://github.com/byLemonhaze/lemonhaze.com/commit/041ea75), published November 11, 2026. [Live site](https://lemonhaze.com) · [Immutable deployment](https://3d9290e8.lemonhaze.pages.dev) · [Today’s work report](docs/reports/2026-11-11.md) · [Changelog](CHANGELOG.md).

`main` is the integration branch. The November 11 application was originally published from `feat/immersive-experience`; the accompanying documentation and [pull request #62](https://github.com/byLemonhaze/lemonhaze.com/pull/62) preserve that release history. Cloudflare’s `main` deployment label is separate from Git source integration.

## Site experience

- **Explore:** 1,414 original works in a draggable, zoomable lemon-shaped field. Desktop retains the approved close-up composition; phones start with the full lemon. Wall pressure and rebound move the whole field as one group.
- **Gallery:** an infinite carousel with native artwork proportions, drag/swipe, trackpad movement and centre snapping. One collection chooser includes the selected eight works and complete collection groups.
- **Website:** an editorial landing and a right-hand Menu. Selected Work, Practice, About, Exhibitions, All Works, Studio Notes, Collecting, Print Shop and Lab retain their destination pages. The former homepage carousel is retired.
- **Artwork details:** one artwork beside metadata, a collection rail and expandable full details/sales. Desktop artwork clicks open a near-full-screen solo view; × or Escape restores the same split. Mobile detail fits the viewport independently of Explore zoom.
- **Shared presentation:** one stable wordmark, mode switch and persistent Day/Night control. Artwork colors and aspect ratios are preserved. System reduced-motion preferences remain supported.

All Works stays collection-first, with title search returning actual matching artworks and artist-selected covers. It includes five verified Ethereum releases. “Provenance” is not a public collection; parent inscriptions and lineage records remain available. Gentleman Nº1 is identified as the master parent of the on-chain tree.

## Documentation

Start with the [documentation index](docs/README.md). Current guides:

| Guide | Purpose |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Application, routing, services and source map |
| [Immersive architecture](docs/immersive/ARCHITECTURE.md) | Navigation contracts, composition, media and motion |
| [Data sources](docs/DATA-SOURCES.md) | Catalogue, curation, image derivatives and sales data |
| [API](docs/API.md) | Public, private and shop endpoints |
| [Deployment](docs/DEPLOYMENT.md) | Verification, preview/production targets and live checks |
| [Verification](docs/immersive/VERIFICATION.md) | Latest test evidence and limits |
| [Print Shop](docs/SHOP.md) | Closed storefront, payment readiness and operations |
| [Follow-up tracker](docs/TRACKING.md) | Outstanding checks and maintenance rules |

[Feedback passes](docs/immersive/README.md) and earlier audits are dated history, not competing current specifications.

## Development

Node 22 is pinned in `.nvmrc`. The main site uses modular vanilla JavaScript, Vite 6 and Tailwind CSS 3. Market Watch is a lazily loaded React module. Cloudflare Pages serves static/prerendered routes and Functions.

```bash
nvm use
npm ci
npx playwright install chromium
npm run dev
```

```bash
npm run build       # data/title generation, Vite, then route prerendering
npm run preview     # preview dist; does not emulate Pages Functions
npm run verify      # production build and the complete test suite
```

The November 11 application release passed **246 tests** and generated **1,704 routes**. Separate Chromium/WebKit checks and live-domain verification are recorded in [Verification](docs/immersive/VERIFICATION.md). These are dated results, not permanent expected counts.

## Routes

| Address | Behavior |
| --- | --- |
| `/` or `/?view=explore` | Explore landing |
| `/?view=explore&at=<id>` | Explore field focused on a work, without detail |
| `/?view=explore&work=<id>` | Explore artwork detail |
| `/?view=gallery&series=<name>&at=<id>` | Gallery collection centred on a work |
| `/?view=website` | Website home, with no inherited artwork modal |
| `/<collection-slug>` / `/<inscription-id>` | Existing collection / artwork deep links |
| `/selected`, `/practice`, `/archive`, `/collecting`, `/all-works` | Editorial and catalogue destinations |
| `/visualizer/` | Full visual chronology; distinct from Explore’s original-only field |

Legacy query aliases remain supported. `/explore` is the historical editorial alias for `/practice`, **not** the immersive Explore route. `/provenance` redirects to `/all-works`.

## Publishing

Only publish when authorized; see the [deployment runbook](docs/DEPLOYMENT.md).

```bash
npx wrangler whoami
npm run verify
npx wrangler pages deploy dist --project-name lemonhaze --branch main
```

Use `--branch immersive-review` for a preview. Always specify the target explicitly.

## Shop and privacy

The public shop is **browsing-only: Price on request / Coming soon**. Its Stripe and inventory backend exists, but this site release does not authorize or enable purchases. Follow [SHOP.md](docs/SHOP.md) before changing launch gates. Public contact remains `collect@lemonhaze.com`, Montréal, Canada. Never commit private contact details, credentials or customer data.

Maintainer: [@byLemonhaze](https://github.com/byLemonhaze).
