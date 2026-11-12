# Spacing, thumbnails and navigation — 11 November 2026

- Shifted the two upper diagonal neighbours of Gentleman Nº1 outward. The nearest horizontal clearances are approximately 62 and 78 pixels, while the 175-pixel vertical separation from Impossible Folds 01 stays intact. This avoids both touching corners and a large new hole.
- Rebuilt Paint Engine thumbnails from the existing static images. The small vertical rail now shows the artwork alone, without the on-chain page background or controls. Originals and live solo rendering are unchanged. The preview builder now prefers static images for HTML works and supports targeted refreshes.
- Gallery → Explore lands on the current artwork in the field, centered at a readable scale. It does not open the split. Re-selecting Explore while its split is open still closes the split and retains the field position.
- Removed the repeated headline and selected-artwork grid from the Website entry. Its replacement uses the existing print-table photograph and section links. Selected Work retains its complete introduction, artworks and text; all other pages remain intact.

Review screenshots: `output/playwright/feedback-10/`. No deployment.

Validation: Node 22 `npm run verify` passed, prerendering 1,704 routes and passing all 227 tests. The navigation regression covers same-work field arrival from the carousel and from an open Gallery detail on mobile, active-Explore split dismissal, camera preservation and browser history. All 13 Paint Engine derivatives rebuilt successfully. `git diff --check` passed. The existing bundle-size advisory remains.
