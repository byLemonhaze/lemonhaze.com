# Website navigation and All Works — 11 November 2026

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

Implemented the approved Website strategy locally:

- Replaced the permanent sidebar with one Menu drawer on desktop and mobile. The shared Lemonhaze wordmark and viewing-mode control retain their positions. Menu remains accessible from Website artwork details.
- Kept the studio photograph and five primary destinations on the landing page: Selected Work, All Works, Practice, About and Exhibitions. Studio Notes, Collecting, Print Shop and Lab remain below. The repeated selected-artwork introduction and grid stay on their existing destination page.
- Added `/all-works`, a directory of 53 public collections grouped by year. Search accepts artwork titles, collection names and years; matching works open the shared detail view. Collection links retain their existing URLs. The visual chronology remains accessible.
- Preserved destination pages and their existing copy. Thumbnail covers retain native artwork proportions. No catalogue.gallery changes or deployment.
- Added drawer keyboard focus, Escape dismissal, focus restoration, current-page indication and closure after navigation. Browser coverage exercises desktop/mobile navigation, title search, empty results and opening the menu from an artwork detail.

Review screenshots: `output/playwright/feedback-12/index.html` includes desktop and mobile home, menu, All Works and title-search views.

Validation: the production build and prerender of 1,705 routes completed. All 230 tests pass against that build, including desktop/mobile Website navigation and Gallery-to-Explore handoff. Browser checks now wait for hydration before interacting with prerendered pages. Desktop and mobile screenshots were reviewed; `git diff --check` passed. No deployment.
