# Feedback pass 5 — local review

November 11, 2026. No deployment. Builds on pass 4.

## Presentation and interaction

- The still and live artwork share one fitted native-ratio rectangle inside a consistent external mat. The live document bridge uniformly fits its visible drawing surface to this rectangle, avoiding a second layer of inscription-internal padding. Square Porcelain Sunset, landscape Ganser and portrait Wernicke were checked live. Frames and artwork ratios remain intact.
- Removed the per-artwork Pause button. The existing shared reduced-motion preference remains available.
- Explore uses existing sharp local display previews for visible landing works; Impossible Folds — 01 loads its 900 × 1600 image. Tiny overview thumbnails remain lightweight. No landing placement changed.
- Gallery uses stable display previews where available, gentler camera movement, dominant-axis wheel gestures and a frame-rate-independent damped glide into each work. One collection trigger shows the current collection name. Collection search, midpoint entry and remembered positions remain.
- A persistent wordmark uses the approved Explore/Gallery font and identical coordinates across all three modes. The mobile Website menu button sits to the right; its panel opens below the identity and mode controls.
- Website page text and pages are preserved. The temporary introduction rewrite was removed. The home entry retains its previous words and eight works, except “Lemonhaze · 2023–2026”, explicitly removed at the artist’s request. Its tighter title/navigation layout differs from Selected Work’s full editorial opening. The phrase “A continuous practice.” is retained on both pages under the latest copy-preservation instruction.
- The zoomed-out field bounces as one group, with up to 20% squash, stronger rebound (86% retained velocity), longer overview inertia and a settling spring wobble. Slow deliberate pressure against a wall also creates a visible dent; only active dragging supplies this pressure, so it cannot keep adding energy after release. Expansion yields to available viewport space. Close-up drag damping and composition stay unchanged; reduced motion suppresses deformation and bounce.

- Public Lemonhaze HTML now explicitly allows framing by `https://catalogue.gallery` and `https://www.catalogue.gallery` (plus same-origin). The conflicting `X-Frame-Options: DENY` header is removed on those public pages. Other cross-origin parents remain blocked; existing direct shop/policy and standalone-artwork behavior is retained. Only lemonhaze.com server configuration changed. This production fix awaits deployment after review.

## Review

Open `output/playwright/feedback-5/index.html` for the screenshot contact sheet. Images include Website home and Practice, the sharp Explore landing, square/portrait/landscape live views, Gallery, the single collection chooser, mobile Website/navigation and a whole-field wall impact.

Automated checks cover native aspect ratios and equal mat edges, live inner-canvas fitting at desktop/mobile sizes, fixed wordmark position across modes, mobile menu clearance, sharp landing source selection, frame-rate-independent Gallery settling, strong bounce/rebound and containment under ±20% deformation. A browser interaction check verifies visible whole-field squash during a wall drag. A real-browser header test allows Catalogue apex/www parents, rejects an unrelated parent, and retains direct shop framing restrictions.

Final Node 22 `npm run verify` passed: production build, all 1,704 prerendered routes and 223 tests, with zero failures, before the additional Catalogue embedding test. `git diff --check` also passed. Log: `/tmp/lemonhaze-feedback5-final.log`. After the server-only embedding fix, the complete `npm test` suite passed all 224 tests with zero failures; log: `/tmp/lemonhaze-feedback5-embedding.log`. The existing large-bundle advisory remains. No external deployment, commit or push is part of this pass. catalogue.gallery is untouched.

## Remaining review limits

The exact feel of a physical trackpad remains an artist review item. Unknown location-dependent inscriptions or failed external assets retain the static fallback. Live artwork fitting is uniform and does not crop the artwork or alter its on-chain source; documents that already transform their body retain their own transform.
