# Security

## Reporting
If you find a security issue, open a private report through GitHub Security Advisories if enabled, or contact project maintainers directly before public disclosure.

## Scope
- Frontend client code
- Cloudflare Pages deployment configuration
- Functions under `functions/`

## Baseline expectations
- No hardcoded secrets in repo.
- Server-side endpoints validate and sanitize external input.
- Dependencies should remain current and patched.

## Current application boundaries

Public site HTML permits embedding by its own origin and the two approved Catalogue origins (`https://catalogue.gallery`, `https://www.catalogue.gallery`). Direct shop/privacy/terms responses deny framing. This policy lives in `server/security-headers.js`; standalone lab, visualizer and third-party exceptions are separate. Script/resource restrictions marked report-only are not enforced XSS protection.

Live artwork documents use sandboxed frames and scoped message validation; preserve source-window checks, opaque origins and lifecycle cleanup when editing bridges. Private generation and payment operations enforce server-side configuration and authorization. The public shop remains browsing-only; client UI visibility is not the purchase authorization boundary.

See [API](docs/API.md), [Deployment](docs/DEPLOYMENT.md) and [Shop](docs/SHOP.md). Historical operational follow-ups are in [Tracking](docs/TRACKING.md); do not copy credentials, personal contact details or customer data into reports, logs or issues. These notes document boundaries, not a claim of a comprehensive security audit.
