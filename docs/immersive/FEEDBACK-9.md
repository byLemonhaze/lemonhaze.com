# Explore spacing and return navigation — 11 November 2026

- Reduced Gentleman Nº1 from 520 to 440 pixels square and raised it above Impossible Folds 01, leaving 175 pixels between their placement boxes. Its original proportions remain intact. It is above the initial desktop viewport and comes into view on zoom-out.
- Moved Hillside Desolate and Low Cognition Requirements inward from the lower right to fill the former Gentleman slot. Relocated the archive work immediately above Gentleman into the vacated right-hand position, opening breathing room above the portrait. These four placements are artist-requested exceptions to the preserved core; the remaining fixed placements are unchanged.
- Clicking the active Explore tab while its split view is open now closes the artwork and returns to the existing field position and zoom. Gallery still carries the selected artwork into its own collection; returning from Gallery still opens that artwork in Explore. Browser Back can reopen the dismissed detail.

Validation: five model tests passed, including roster, preserved placements and non-overlap checks. The browser navigation regression passed against the local preview, including closing the split with Explore, preserved camera state, same-artwork Gallery handoffs and browser history. Visual review screenshots are in `output/playwright/feedback-9/`. No deployment.
