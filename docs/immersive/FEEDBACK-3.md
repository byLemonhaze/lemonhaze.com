# Feedback passes 2–3 — local review

Date: 2026-11-11. Branch: `feat/immersive-experience`. Local preview: http://127.0.0.1:5173/?view=explore.

These changes are local only. Neither the earlier Cloudflare review nor production has been redeployed. No catalogue.gallery files or deployment were touched.

## Artist constraints retained

- The current Explore landing is preserved. All 158 central placements through Minute, papillon! are fixed, including the original eight artwork positions and presentation sizes.
- The confirmed names are **Wu Wei, Ikigai and Lagom in Chrysalis**. They remain separated.
- All **25 Gentlemen** are in the inner half. Their farthest placement is approximately 2,709 units from the centre against a field radius of approximately 7,260.
- Explore has **1,414 original works**. The catalogue’s 230 edition copies resolve to their originals; Deprivation is represented once. Four unpublished Colors placeholders and the ORDINALLY collaboration punch card are excluded. Distinct numbered generative works are retained.
- Best Before and Manufactured each have two near-core works. The surrounding archive follows recent-to-old radial ordering while preserving the approved core. No special Dark Horse repositioning.
- Type, palette, view-switch styling and dragging interaction remain. Frames follow the artwork’s actual image boundaries and proportions.

## Changes

The split is now artwork plus metadata, with no second artwork. It serves Explore, Gallery and Website detail routes. Mobile metadata follows the artwork, with a persistent close control. Existing descriptions and collection information supply the content; original inscriptions and print details remain linked.

Website always enters home from its mode tab. The old carousel is retired in favour of selected works and editorial navigation. All site sections remain. The mode switch keeps identical desktop/mobile coordinates across modes, and first-paint mode selection prevents a Website flash before Explore.

Gallery has a searchable collection chooser with counts. New collections enter at their midpoint and remember subsequent positions. The camera now tilts around the visible work rather than the distant beginning of a long collection. Room surfaces follow large collections, and Home/End jump without traversing hundreds of intermediate slides. Neighbour media is bounded and released.

Explore pinch input handles both signs of Chromium ctrl-wheel events and both directions of Safari relative-scale gestures through the same camera helper as the zoom buttons. Ordinary scrolling still pans; browser Cmd zoom is left alone.

All Explore works have local, lightweight previews. Every visible image loads; the previous 64-image limit was removed after it produced blank slots when zoomed out. Sharper media loads on engagement. Live chain artwork is limited to the engaged work, keeping a static fallback underneath. The earlier paper-grain comparison remains opt-in with `surface=paper`; flat remains the default.

## Browser checks

- Full Explore overview: **1,414 images ready, zero failed previews**. The affected external Chrome tab at `/?view=explore` was also rechecked: all 148 assigned previews loaded, with zero failures. Root and explicit Explore entry were inspected; source assignment is limited to the visible region until the full overview is requested.
- Original portrait, square and landscape ratios are retained. Low-resolution previews occupy the same authored artwork dimensions.
- Metadata split checked on desktop and 390 × 844 mobile. Hózhó’s live inscription rendered in the split at its portrait ratio; close returns to Website home when opened there.
- Gallery chooser searched and selected Chrysalis, Impossible Folds, Trilogy and Best Before. First entry positions included Impossible Folds 06/12, Trilogy 02/03 and Best Before 211/421. Back returned to the prior collection and work.
- Trilogy’s Off-Kilter ran from its inscription in Gallery. Only one live frame was mounted. Switching to Website left zero live frames and no old carousel.
- Best Before End reached 421/421 immediately, with three neighbouring image sources and intact room geometry.
- Website’s navigation remained at 20 px on desktop, and the shared mobile position is 16 px. Its homepage exposes the retained sections, and opening Hózhó uses the metadata split while the old modal stays closed.
- Mobile collection chooser and artwork detail checked for readable controls, original aspect ratio and accessible metadata.

## Automated verification

**Passed:** `npm run verify` with Node 22 — 1,704 prerendered routes and 212 tests, zero failures or skipped tests. Tests include the new roster/composition, startup routing, midpoint entry and two-direction gesture cases, plus existing repository checks and the updated prerendered Best Before detail test. `git diff --check` also passed.

## Evidence

- [Repaired landing in the affected Chrome window](../../output/playwright/feedback-3/landing-repaired.png)
- [Full Explore field](../../output/playwright/feedback-3/full-field.png)
- [Desktop artwork metadata](../../output/playwright/feedback-3/metadata-split.png)
- [Gallery collection chooser](../../output/playwright/feedback-3/collection-picker.png)
- [Website entry](../../output/playwright/feedback-3/website-entry.png)
- [Mobile metadata](../../output/playwright/feedback-3/mobile-metadata.png)
- [Mobile collection chooser](../../output/playwright/feedback-3/mobile-collections.png)

[Preview audit](preview-audit.json) records complete local-preview coverage. [Architecture](ARCHITECTURE.md) describes the implementation and lifecycle.

## Practical limits

Physical Mac trackpad pinch, Safari and real iOS/Android devices still need hands-on review. Gesture event handling is tested; browser viewport checks are not a substitute for hardware testing. The whole archive’s interactive originals were not individually opened. A network failure/timeout falls back to the poster, but a cross-origin frame can load successfully and later fail internally without exposing that failure to the parent. Pause/reduced motion restores a still view. No low-end-device frame-rate benchmark was performed.

Some Best Before works intentionally show sealed or expired cards; those are artwork states, not failed loads. No edition copies are added to fill the field.
