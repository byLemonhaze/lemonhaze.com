# Immersive architecture

Updated November 12, 2026; publication evidence is in [Verification](VERIFICATION.md). This is the current behavior guide. Earlier [feedback passes](README.md) preserve their original decisions and review status.

## Navigation contract

| Action | Result |
| --- | --- |
| Root arrival on desktop | Approved close-up Explore composition |
| Root arrival on mobile | Full lemon overview with all works represented |
| Open an artwork | Selected artwork, its collection rail, metadata and expandable full details/sales |
| Explore from any artwork detail | Close detail and focus that work’s original in the field; do not return to the default landing |
| Explore from Gallery | Focus the current Gallery work in the field, without opening detail |
| Gallery from detail | Centre the selected artwork in its own collection |
| Choose a new Gallery collection | Enter near its midpoint; later visits restore its position |
| Website mode switch | Website home with no inherited artwork modal |
| Desktop artwork click inside detail | Near-full-screen solo view of the same work |
| Close or Escape from solo | Same split view, selection and URL; live media stays mounted |
| Close ordinary detail | Return to its background view; preserve relevant camera/selection state |

`modes.js` owns mode intent and history; `experience.js` coordinates the two background views and detail. Explicit routes use `view`, `work`, `at` and Gallery’s `series`. Generation checks reject obsolete asynchronous mode completions, and inactive views release work. The stable wordmark, mode switch and appearance control are shared across modes. `/explore` remains an editorial redirect to `/practice`; use `/?view=explore` for the field.

## Roster and composition

`src/curation/selection.js` defines eight selected works: Impossible Folds — 01, Hózhó, Chanchanok’s Temple, Porcelain Sunset, Chamber of Reflection, Gentleman Nº6, Family Portrait and Gentleman Nº1. Gallery’s Selected works and the Selected Work page use this order; the Website home does not duplicate it.

The immersive index contains 1,649 records, including print records. `roster.js` resolves editions to originals: 1,414 Explore works remain after 230 edition copies, four Colors placeholders and one collaboration punch card are excluded. Do not filter every title containing “Edition”; distinct 1/1s can legitimately contain that word. The visualizer and full inscription records have a different scope.

`core-placements.json` protects 158 authored positions. `layout.js` interleaves additional collections and expands recent work toward older work at the exterior. All 25 Gentlemen remain in the inner half. Wu Wei, Ikigai and Lagom belong to Chrysalis and are separated. Large BEST BEFORE/Manufactured groups do not overwhelm the core. Dark Horse has no special repositioning rule.

Approved adjustments place Gentleman Nº1 above Impossible Folds 01 with breathing room, fill its former gap, and place the enlarged Hosoi between Gentleman Nº6 and Hillside Desolate. These are recorded positions, not a licence to regenerate the landing composition arbitrarily. `lemon-outline.json` records the asymmetric fruit/leaf outline derived from the emoji silhouette without shipping its font or recoloring artwork.

## Image pipeline

| Presentation | Source and lifetime |
| --- | --- |
| Distant Explore, zoom below 0.075 | One transparent overview texture; individual artwork hit targets remain |
| Closer Explore | Nearby local thumbnails; large visible works qualify for sharp upgrades |
| Gallery | Current work and visible neighbours receive prioritized sharp static previews |
| Split/mobile detail | Decoded sharp still, followed by live media when supported and painted |
| Desktop solo | The existing detail media enlarged in place, preserving aspect and mat |
| Native pixel art | Unchanged small PNG originals with nearest-neighbor rendering |

`media.js` limits upgrades to two concurrent decodes/reveals per active view, checks stale source/selection state, and cancels departed work. A blocked static chain image tries the artist CDN. A decoded still overlay resolves from a mild 1.2px blur and 94% contrast to full clarity in 360ms. It covers the opaque preview early in the animation, so the remaining movement is a focus pull rather than a prolonged dissolve. Fractional CSS dimensions avoid alignment seams; the temporary layer is removed after the original image element can paint the new source. Native pixel originals and reduced motion use a direct decoded swap. The effect applies only to still-to-still upgrades, including posters for live works; HTML/video playback is not blurred or animated by this mechanism. Thumbnails remain static; live frames belong to detail, not the rail.

The live-document bridge scales the artwork's tight wrapper rather than its body or viewport. This avoids a resize feedback loop in works such as Griffintown, which measure their stage every animation frame. Original interactive transforms remain independent of the fitting scale.

`preview-manifest.json` and `public/previews/immersive/` contain lightweight field thumbnails. The 2000 × 1990 overview uses about 636 KiB transfer and 15.9 MB decoded RGBA at the recorded release; it avoids decoding hundreds of individual images at mobile startup. Its geometry fingerprint requires regeneration after relevant layout/preview changes using `node scripts/build_explore_overview.mjs`.

All 422 Manufactured records have local display derivatives up to 1600 pixels. All 16 Old-Fashioned records use static artist-CDN-derived local media, with chain/render-service loading disabled. Griffintown has local still fallbacks. Twenty-six native pixel works use `src/data/pixel-originals.json` and `public/images/pixel-originals/`; never run those through a smoothing/lossy enlargement pipeline. [Source records and rebuild scripts](../DATA-SOURCES.md).

`presentation.js` fits the artwork and frame from actual proportions. `live-document.js` uses a sandboxed source document with chain-relative URLs and a token-scoped paint bridge. Selection changes, hidden documents, timeouts and failed requests dispose of live contexts. Location-dependent documents that cannot be safely adapted keep the static fallback. Original inscriptions are not modified on-chain.

## Explore input and physics

Desktop pointer dragging and wheel panning manipulate the field camera. Trackpad pinch and mobile two-touch gestures share zoom constraints. Explore disables native page pinch on its own surface; detail remains independent of the field scale. The mobile fit control alternates the overview with a safely framed Impossible Folds 01 below the header.

When the full field fits, `field-physics.js` contains it inside the available viewport. Pressure comes from the unbounded pointer target beyond a resting wall; holding it sustains squeeze. Collision uses stable bounds, while the deformed outline is constrained separately. Corner pressure blends continuously rather than flipping axes abruptly. Re-grabbing catches the visible camera, smoothed velocity moderates throws, and the spring settles after release. The whole field moves together. Close-up panning remains free; reduced motion suppresses bounce/deformation.

## Gallery input and collection chooser

The room stays stationary while nearby artwork mounts travel through circular slots. Buttons, keyboard arrows, wheel and drag wrap at both ends. Pointer dragging follows the hand, locks its axis, and projects a short release tail before a critically damped centre snap (rate 15). Centre-weighted soft shadows follow the continuous slot distance; collection changes reveal from 94% to full opacity over 220ms, without scaling or moving the room. Reduced motion skips the reveal and settling. Home/End jump rather than travelling through hundreds of items. Finished or cancelled drags suppress delayed clicks until a fresh pointer-down or keyboard activation.

Chooser order: Selected works, Gentlemen, Impossible Folds, Montreal, BEST BEFORE, then other groups newest-first. Provenance and Colors are excluded. This pinning is separate from All Works’ fully chronological order. The native top-layer collection dialog has its own scrolling, visual-viewport sizing and explicit close; opening it does not summon the mobile keyboard automatically.

## Detail, solo and accessibility

The split’s right pane contains the selected work’s own reflection/description, facts, links and full details/sales disclosure. Gentleman Nº1 has a specific master-parent note; changing works removes it from unrelated details. Rail outlines follow artwork proportions, with generous transparent hit areas.

Desktop solo hides the rail and metadata, preserves the existing media instance and URL, and uses an unobtrusive return control. The entry overlay is absent on mobile. Keyboard focus and inert hidden content are managed; Escape exits solo before closing detail. Resizing to a phone layout exits solo. System reduced-motion preferences remain supported, with no visible Motion or Pause artwork buttons.

## Appearance and verification

First-paint HTML and the runtime agree on paper as the default and charcoal when saved/explicit. SVG appearance icons avoid emoji rendering. Shared chrome stays in place and mobile close/appearance controls do not overlap. Artwork pixels are never recolored.

See [Verification](VERIFICATION.md) for the actual release checks, test files, deployment and remaining physical-device/live-chain limits. Public Catalogue embedding is configured on lemonhaze.com only; no catalogue.gallery files were changed.

## November 12 interaction refinements

The mode switch retains its squared silhouette at 40px desktop / 44px mobile height. Its spring indicator moves independently of the stable links; reduced motion bypasses animated movement. Overview release uses recent pointer samples, bounded velocity and 240Hz physics substeps; collision bounds remain independent of the visible squash. Close-up panning and Gallery scrolling retain their existing behavior.

Solo transitions animate the complete media surface and mat together for 760ms. The room follows paper/charcoal presentation, shared controls retreat and become inert, and closing restores those controls. Desktop Gallery metadata and arrows sit in opposite lower corners; the 360px collection picker opens above the left control. Mobile retains its separate dialog layout.

`src/modules/embedded-notes.js` mounts an Embedded notes disclosure inside the split view's existing Inscription details group. It retrieves HTML only on expansion, parses comment nodes without executing the document, and renders both notes and optional original source through textContent. Cleanup aborts retrieval and discards stale responses when selection changes. Unsupported/static-only works do not request chain source.
