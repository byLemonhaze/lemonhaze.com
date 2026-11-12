# Circular Gallery and collection-first All Works — 11 November 2026

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

- Impossible Folds prints are pinned immediately below Gentlemen in the Gallery chooser, followed by Montreal and BEST BEFORE. Existing print records remain intact.
- Gallery uses circular slots, preserving neighbouring artwork mounts across both boundaries. Buttons, keyboard arrows, wheel and drag continue past the last and first work. Keyboard navigation works while footer controls are focused and yields to the collection search and artwork detail.
- The room background stays stationary while artworks travel. Removed the old end wall and oversized travelling surfaces that produced the vertical seams shown beside Gentleman Nº6 and Family Portrait.
- All Works moved from the large Website landing links to the bottom row beside Studio Notes.
- All Works remains collection-first. Covers sample up to three artworks instead of selecting the parent by default. Title searches show matching artwork images, names and direct detail links, grouped under their collection. Larger result groups reveal twelve additional works at a time.
- Removed Explore's bottom-left motion button and Works to explore text. The system reduced-motion preference remains supported.

No deployment. Review images are in `output/playwright/feedback-14/`.

Artist-selected cover override for 1 of 1s (2026): its parent Gentleman: Special Edition 2026, Paint Engine v1.07 [Passe-Partout], then Wilderness. This replaces the automatic Gentlemon cover choice.

Validation: full build/prerender completed for 1,705 routes and all 233 tests passed. After the final cover selection, the catalogue unit test and desktop/mobile browser check also passed against the local preview, including the exact three cover IDs. Browser regression covers arrow and wheel wrap, collection changes, Gallery/Explore context, and removal of the Explore label/control. Reviewed Gallery seam screenshots and desktop/mobile catalogue/search views. `git diff --check` passed. The final cover override was made after the full build started; rebuild before any approved deployment.
