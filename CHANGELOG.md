# Changelog

## 2026-11-12 — Interaction and Website presentation polish

Slimmer squared mode bar with a spring indicator, stronger contained lemon throws, and animated paper/charcoal solo viewing. Desktop Gallery controls occupy opposite lower corners, with a discreet anchored collection picker. Website home uses the artist-selected framed Gentleman Nº1 study and vertical secondary navigation; Studio Notes and Practice imagery/year placement are refined. Satoshi and Deprivation print covers intentionally repeat their originals three times without duplicating the artwork roster. Embedded inscription notes are accessible inside Inscription details, loaded on demand as inert text. [Session and release report](docs/reports/2026-11-12-interaction-polish.md).

## 2026-11-12 — Artwork focus transitions and Gallery refinement

Application changes: [`986055e`](https://github.com/byLemonhaze/lemonhaze.com/commit/986055e) and [`a23552a`](https://github.com/byLemonhaze/lemonhaze.com/commit/a23552a). Verification: 250 tests and 1,704 generated pages. [Review evidence](output/playwright/focus-brief/index.html). Deployment identity and live checks are recorded in the integration pull request.

Gallery and split-view still upgrades resolve through a 360ms focus pull (mild blur and contrast recovery), with a temporary decoded layer over an opaque preview. Pixel originals and reduced motion swap directly; HTML/video playback skips the effect. Stale reveals are cancelled on navigation and fractional layer sizing avoids alignment seams. Live artwork fitting scales the artwork wrapper rather than its viewport, fixing Griffintown's continuous resize oscillation; embedded surfaces have an explicit transparent background and neutral color scheme.

Gallery settling is slightly slower and critically damped, with centre-weighted soft shadows and a restrained 220ms collection reveal. Cancelled drags suppress delayed clicks without blocking fresh pointer or keyboard activation. The room layout, native proportions, mats, mode navigation, Explore physics and shop gates remain unchanged.

## 2026-11-12 — Visual chronology

Added all twelve Impossible Folds prints to the 2026 chronology with an explicit uninscribed label and no invented lineage. Updated its wordmark, mode navigation, responsive controls and paper/charcoal presentation. Theme changes redraw the interface without recoloring artwork or reloading thumbnails; 8K PNG export remains available.

## 2026-11-12 — Miami Paint Engine studio note

Content commit: [`06424d3`](https://github.com/byLemonhaze/lemonhaze.com/commit/06424d3) · [Integration PR #63](https://github.com/byLemonhaze/lemonhaze.com/pull/63).

Added two artist-supplied, uncropped photographs of the Coral print for a Miami hotel project, with the November 4 source post and factual dimensions. The new Studio Note appears near the top of the selected notes and is linked from Paint Engine’s Prints and commissions section. Existing writing and artwork listings remain intact.

## 2026-11-11 — Immersive site revamp

Released application: [`041ea75`](https://github.com/byLemonhaze/lemonhaze.com/commit/041ea75). [Work report](docs/reports/2026-11-11.md) · [Verification](docs/immersive/VERIFICATION.md).

### Added

- Connected Explore, Gallery and Website modes with shared navigation and persistent appearance.
- Full original-only Explore field, asymmetric lemon silhouette, contained wall squeeze and rebound, and mobile overview landing.
- Collection-aware split detail with full metadata/sales, live artwork fallback and desktop solo viewing.
- Searchable collection chooser, infinite Gallery navigation, collection-first All Works with artwork title results, and five verified Ethereum releases.
- Artist-selected collection covers, Gentleman Nº1 master-parent context, native pixel-image cache, and sharp static display derivatives.

### Improved

- Gesture direction, centre snapping, mode-switch race handling, artwork-focused handoffs and mobile control spacing.
- Image decode/upgrade cancellation, native proportions and consistent mats across static/live presentation.
- Mobile startup resource use, theme first paint, neutral night Gallery and fixed-height year navigation.
- Website landing hierarchy and visual continuity, Studio Notes/Collecting imagery, note-preview deduplication and the Hosoi signing segment.

### Removed or retired

- Duplicate split artwork, obsolete homepage carousel, redundant motion/pause controls and duplicated collection menus.
- Edition copies and the collaboration punch card from Explore; “Provenance” as a public collection.

The public site can be embedded by catalogue.gallery and www.catalogue.gallery. No catalogue.gallery files were changed. Shop purchases remain disabled. The final application build passed 246 tests and generated 1,704 prerendered routes; physical-device and exhaustive live-chain checks remain follow-up work.

## Earlier changes

Git history and the dated reviews under [docs](docs/README.md) retain earlier work. This changelog starts with the November 11 consolidation rather than inventing a complete retrospective release log.
