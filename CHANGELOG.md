# Changelog

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
