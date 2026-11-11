# Immersive viewing modes

The existing vanilla JavaScript/Vite application and Cloudflare Pages deployment remain in place. `/` defaults to Explore; `/?view=explore`, `/?view=gallery`, and `/?view=website` make mode intent explicit. Existing collection, section and inscription paths keep their existing meanings. In particular, the existing `/explore` editorial alias is not repurposed.

## Data and collection membership

`src/curation/selection.js` remains the single landing-selection source. Its print records now expose collection, year and original media from `shared/shop-artworks.js`, which is already the shop's source. `src/immersive/model.js` builds an index over the existing assembled catalogue plus those print records. No separate hard-coded featured list is maintained.

Collection rails use the same catalogue ordering and lead-artwork helper as the conventional site. Collection parents stored under Provenance are assigned their introducing collection in the immersive index, without changing the underlying catalogue. This prevents selecting a parent from replacing the rail with unrelated provenance records. IDs remain unchanged.

The verified initial selection is:

| Work | Collection | Rail entries |
| --- | --- | ---: |
| Impossible Folds — 01 | Impossible Folds | 12 |
| Hózhó | Chrysalis | 8, including parent |
| Chanchanok's Temple | 1 of 1s (2025) | 32 |
| Porcelain Sunset | Liminality | 8, including parent |
| Chamber of Reflection | 1 of 1s (2024) | 50 |
| Gentleman Nº6 | Gentlemen | 25 |
| Family Portrait | Into The Wild | 5 |
| Gentleman Nº1 | Gentlemen | 25 |

See `verified-selection.json` for every stable ID and the complete collection orders.

## Routing and lifecycle

`modes.js` is the integration boundary. The existing runtime offers its conventional URL application, home cleanup and modal-close callbacks. Explicit mode routes and browser history pass through this boundary before the conventional router. Existing Website navigation continues to use the original router.

Open immersive details use `work=<stable-id>`. Gallery browsing uses a replace-only `at=<stable-id>` parameter, while opening, closing and mode changes create history entries. Canvas camera and Gallery positions are kept in the current browsing session's `history.state`; mode preference is never saved permanently. Website routes retain the active inscription or scroll to the matching Impossible Folds card. A non-featured work remains identified and is temporarily added to the immersive context instead of being replaced with a featured work. Each mode retains at most one such contextual addition.

The immersive rendering module and its CSS load dynamically. Website-only visits do not load the scene module. The conventional home is destroyed when entering immersive mode, including its autoplay timer/iframe; inactive conventional gallery DOM is released. Only one immersive view renders at a time. Scene loops run on demand and stop when settled or hidden; observers/listeners are removed when leaving immersive mode. A failed scene import returns to Website with a brief status message.

## Rendering and input

Explore uses an authored two-dimensional field of real image elements, transformed as a single layer. Drag and wheel input feed a damped camera with bounded inertia. Pointer movement must cross a threshold before it is considered a drag. Wheel modifiers used for browser zoom are left untouched. Zoom and overview buttons provide equivalent controls.

Gallery uses actual CSS 3D geometry rather than a room image: walls, ceiling, floor, light and artwork planes share the camera transform. Neighbouring work recedes and tilts as the camera moves; velocity adds a small temporary shear which settles to zero. Both vertical and horizontal swipes navigate the exhibition. Rendering stops at rest. This implementation does not use WebGL shaders or recreate Unseen's fluid distortion exactly.

The detail panel and flying artwork use interruptible Web Animations/CSS transforms. The collection rail scrolls independently and keeps the active thumbnail visible. Original HTML/video media is mounted only for the open artwork; Pause removes it, and visibility changes release it. Still originals replace an already-visible preview after loading. Failed previews retain labelled controls and access to full details.

## Accessibility and verification

Mode controls are normal links, artwork controls are labelled buttons, and the canvas/room have keyboard instructions. Arrow keys navigate; +/- zoom Explore; Escape closes detail. The opened detail makes its background inert while keeping the view switch reachable. Reduced motion removes transitions, inertia and automatic original-media playback. Touch areas, dynamic viewport height, safe-area offsets and portrait/landscape layouts are handled in CSS.

A discreet Motion control also allows reduced motion without changing device settings; a device-level reduced-motion preference always takes priority. The setting lasts only for this page session.

Run `npm run verify` with Node 22. The new model tests protect exact selection, complete collection membership, parent-rail continuity, and route precedence. Browser inspection evidence and its limitations are recorded in `VERIFICATION.md`. The existing build still prerenders conventional collection/artwork pages for search engines.
