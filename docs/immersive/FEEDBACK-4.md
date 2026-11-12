# Feedback pass 4 — local review

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

November 11, 2026. No deployment. This supersedes the live-preview behavior recorded in pass 3.

## Changes

- Explore and Gallery browsing keep stable local previews. High-resolution/live content loads in the solo artwork-and-metadata split only, as requested. Full stills decode before replacement; HTML waits for actual artwork paint. Only one rendition is visible, and the original is explicitly centred in the same fitted mount.
- Full details and sales are expandable inside the split. The existing inscription, ownership, provenance, sales and artist-note renderer is reused, including its original data sources and formatting. Per-selection guards prevent late records from updating another work.
- Each work's reflection takes priority over a generic collection description. Ganser, Bonnet and Wernicke were checked while switching within Confabulation.
- Mobile close has a 28 px visible square, a 44 px tap target and 12 px clearance between the target and the artwork stage at 390 × 844.
- Confirmed interpretation: the entire zoomed-out field behaves as one group. Its velocity reflects at viewport boundaries, with restrained temporary deformation. Normal landing/close-up dragging remains unchanged. Reduced motion disables bounce/deformation.
- Mobile minimum zoom follows the overview size so the minus button and pinch can continue outward after fitting the whole field.
- Gallery arrows use stronger simple strokes without circles; Explore's diagonal arrow becomes a fit-corners symbol. Social link arrows are removed. Existing collection search and midpoint entry remain.

## Preserved

The approved central composition and bottom through Minute, papillon!, native aspect ratios, palette/type/nav toggle, 1,414-work original-only roster, all 25 Gentlemen in the inner half, separated Wu Wei/Ikigai/Lagom, sparse large-collection core entries and excluded collaboration punch card. Website opens home with the same mode-switch placement. All Website sections remain available. catalogue.gallery was not modified.

## Review evidence

Screenshots are in `output/playwright/feedback-4/`; open `index.html` for a labelled contact sheet and individual images.

- Desktop and 390 × 844 mobile inspection of Gallery, artwork split and mobile close.
- Confabulation one-liners switch correctly; expanded sales remains reachable. Chamber of Reflection displayed its recorded primary sale, and its artist-note link opened the corresponding Studio Notes destination.
- Off-Kilter played from the older Trilogy original selection; Wernicke and Chamber of Reflection confirmed the live first-paint handoff.
- All 1,414 Explore thumbnails loaded in the full overview; zero failed images.
- Mobile field drag against the lower/right boundaries stayed inside the reserved bounds; minus zoom continued outward from the overview.
- Website from open Gallery artwork returned to home, with About, Practice, Exhibitions and all sidebar sections available.
- Final Node 22 `npm run verify`: production build passed, all 1,704 routes prerendered, 218 tests passed, zero failures. Log: `/tmp/lemonhaze-feedback4-final.log`.
- `git diff --check` passed. The build retains the existing large-bundle advisory; no build or test failure.

## Limits to review

Live HTML that depends on an unrecognized original-location protocol, or whose external dependencies fail, retains its static fallback. Its original inscription remains accessible. First-paint detection avoids replacing a good poster with an unpainted document, but does not certify every later frame of third-party artwork scripts. Physical laptop/Safari pinch feel still deserves an artist check; automated checks cover both gesture directions and browser event paths.
