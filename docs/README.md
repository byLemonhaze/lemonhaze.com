# Documentation index

Reviewed against the November 11 immersive release `041ea75`, with the November 12 Miami editorial addition recorded in the changelog. This index separates the current operating guides from point-in-time implementation records.

## Current guides

| Document | Contents |
| --- | --- |
| [Project overview](../README.md) | Experience, local development, routes and release pointer |
| [Architecture](ARCHITECTURE.md) | Runtime, routing, editorial, service and build boundaries |
| [Immersive architecture](immersive/ARCHITECTURE.md) | Explore, Gallery, detail/solo, media and state handoffs |
| [Data sources](DATA-SOURCES.md) | Authoritative records, cover choices, media assets, sales ledger |
| [API](API.md) | Endpoint inventory, authentication and launch gates |
| [Deployment](DEPLOYMENT.md) | Explicit production/preview targets and verification workflow |
| [Verification](immersive/VERIFICATION.md) | Current release evidence and testing limits |
| [Shop](SHOP.md) | Browsing-only storefront and separate commerce readiness |
| [Social previews](social-previews.md) | Sharing image generation and metadata |
| [Tracking](TRACKING.md) | Remaining checks and recurring maintenance |
| [Contributing](../CONTRIBUTING.md) | Change and documentation requirements |
| [Security](../SECURITY.md) | Reporting and implemented security boundaries |

## Release history and review evidence

- [Changelog](../CHANGELOG.md): concise release-facing changes.
- [November 11 work report](reports/2026-11-11.md): today’s scope, commit milestones, final release and limits.
- [Immersive feedback index](immersive/README.md): the original passes in order, with their screenshots and test records.
- [Latest screenshot review](../output/playwright/feedback-18/index.html). GitHub displays the HTML source; open the individual PNGs in that folder, or open the index locally to browse the gallery.
- [Archive review](archive-local-review.md), [SEO review](seo-local-review.md), [Shop audit](SHOP-AUDIT.md), and [reference observations](immersive/REFERENCE-OBSERVATIONS.md) preserve their original point-in-time findings. Counts and release statements there may have been superseded.
- [Editorial source credits](../public/editorial/sources.md) retain source attribution for existing writing and media.

## Keeping this useful

Update the relevant current guide when behavior changes. Add a dated report or changelog entry for a meaningful release, including the source commit, verification actually run, deployment URL and remaining limits. Do not turn a historical “not deployed” review into a claim about the current site. Keep production deployment status separate from Git branch/merge status.
