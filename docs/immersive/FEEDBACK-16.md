# Mobile landing, Gallery spacing and night mode

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

The phone landing opens on the full lemon overview. Desktop retains the approved close-up landing, and explicit artwork destinations still focus that work. Bounce, wall pressure and touch dragging use the same field physics.

The distant field now uses one transparent 2000 × 1990 texture containing all 1,414 works in their existing positions. Its transfer is about 636 KiB and decoded RGBA footprint is 15.9 MB, replacing simultaneous decoding of hundreds of separate 360-pixel thumbnails. Individual hit targets remain available, and closer views resume individual thumbnails and sharp upgrades. The geometry fingerprint test requires rebuilding the overview after composition edits (`node scripts/build_explore_overview.mjs`). This reduces mobile resource pressure. The supplied warning screenshot is DuckDuckGo’s opt-in prompt for automatic crash reporting; it does not identify a site crash or its cause. The site does not suppress or control that browser prompt.

The prerendered root no longer includes a desktop camera and eighteen eager sharp-image sources. A responsive image supplies the same lemon overview on mobile before the catalogue initializes, without starting those desktop image requests.

Mobile Gallery reserves independent space for shared navigation, artwork, and captions/controls. The phone background avoids the oversized desktop 3D room surfaces. Collection selection is a native modal dialog with its own scrolling, a close button, and visual-viewport sizing. Opening it does not focus search or summon the keyboard; tapping search remains available. The dialog sits above the shared navigation and follows the visible viewport when the keyboard appears.

A persistent Day/Night control uses the existing paper/black presentation system across Explore, Gallery, Website and detail pages. Preference survives reloads, including the first paint. Artwork pixels are never recolored.

All Works → Games covers are Game Nº8, Game Nº9 and Game Nº26, in that order.

Regression coverage includes mobile resource count, complete lemon bounds, Gallery spacing at 568/650/844-pixel heights, a 360-pixel keyboard-sized viewport, collection selection, centre snapping, cross-mode focus, theme persistence and the exact cover selection. Browser-engine checks run in Chromium and WebKit; these are not physical-device certification.

Final verification: `npm run verify` passes with 1,705 prerendered routes and 241 passing tests. The mobile regression also passes separately in WebKit. Screenshots: `output/playwright/feedback-16/index.html`.
