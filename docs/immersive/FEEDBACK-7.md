# Feedback pass 7 — squeeze, emoji outline and round trips

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

November 11, 2026. Local review only; no deployment.

- Wall pressure persists independently of movement. The raw grab position stays beyond the resting wall while the visible field remains contained. Holding keeps the squeeze; pushing farther increases it, up to 30%. The contact edge stays pinned to the wall. Release turns stored pressure into an inward rebound and a settling wobble. Reduced motion disables deformation and rebound.
- The final shape uses the actual local Apple Color Emoji 🍋 alpha outline, including its uneven fruit and leaf, rather than the earlier symmetric lens approximation. Only the outline geometry is stored. Artwork colours, pixels and native proportions remain unchanged. The original artwork roster and approved fixed core/bottom placements remain intact; free archive positions occupy the emoji silhouette with recent-to-old radial ordering.
- Gallery → Explore now opens the exact currently viewed artwork in the split and preserves the saved Explore pan/zoom behind it (also verified after deliberately panning and zooming). The existing Explore split → Gallery flow still enters the corresponding collection at the same work. Choosing a different Gallery work updates the returning Explore context.

- Fixed a production-only live-artwork bridge insertion error caught by the full build. Minified dollar-prefixed variables could be interpreted as replacement-string tokens during head insertion. A replacement callback now preserves the script verbatim, with a regression test for dollar sequences.

## Checks

The focused browser checks passed: hold the pointer still against the wall, verify compression does not fade, push farther and verify greater squeeze, release and verify shape recovery plus rebound. Navigation checks exercise both directions, changed Gallery selections, collection neighbours and Back/Forward history. Layout checks protect all preserved coordinates, the original-only roster, all 25 Gentlemen in the inner half, no overlaps and the emoji leaf indentation.

Final Node 22 `npm run verify` passed: production build, all 1,704 prerendered routes and 227 tests with zero failures. `git diff --check` passed. Log: `/tmp/lemonhaze-feedback7-final.log`. The existing large-bundle advisory remains.

## Screenshots

`output/playwright/feedback-7/index.html` compares the overview, sustained wall squeeze and released field. The silhouette is necessarily resolved by individual artworks rather than a filled outline. No deployment, commit, push or catalogue.gallery modification is included.
