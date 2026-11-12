# Thumbnail proportions and progressive quality — 11 November 2026

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

- Refreshed all five Into The Wild thumbnails from the static artwork sources. Lucky Belly is now 360 × 120 rather than a square screenshot containing black bars.
- Rail selection outlines now follow the image's native proportions. The transparent button retains its larger interaction area; landscape works do not receive a square visible selection frame.
- Gallery upgrades visible static images in current-work-first order, with at most two simultaneous decodes. Explore uses the same queue for works displayed larger than 180 pixels, restoring small derivatives for the overview. Leaving the view or removing a work cancels its pending upgrade. A failed load retains the existing preview, and stale decodes cannot replace another source. Live content remains confined to the detail view.
- Website navigation has not been changed in this pass. The proposed direction is a persistent collapsed menu instead of the permanent sidebar, with All Works as a primary catalogue entry and the studio links retained below. This awaits design agreement; existing destination content remains unchanged.

Validation: app build passed, nine model/media tests passed, and the desktop/mobile browser navigation regression passed. The new queue test checks concurrency, priority, repeated frame updates and cancellation. Browser review confirmed Lucky Belly uses its 6480 × 2160 static image in Gallery, and its selected rail outline follows the 3:1 thumbnail. `git diff --check` passed. Screenshot: `output/playwright/feedback-11/sharp-gallery.jpg`. No deployment.
