# Restore the in-menu collection chronology — 11 November 2026

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

The right-hand Menu now uses the original All Works + disclosure after Exhibitions & Press. It expands to collapsible year groups, collection links and the Visual chronology link at the end. The searchable All Works landing destination remains available. Collection selection uses the shared Website route transition so an open artwork detail is dismissed correctly.

Validation: app build passed; desktop/mobile Website navigation and menu state tests passed (3 tests). Browser coverage expands All Works and 2026, checks year order and the final visualizer link, selects a collection and confirms the drawer closes. Review screenshots are in `output/playwright/feedback-13/`. No deployment.

Gallery collection choices retain Selected works as the curated option, followed by Gentlemen, Montreal and BEST BEFORE. Other collections sort newest to oldest by authored year and documented collection date, with an alphabetical fallback for ties. Artwork ordering within each collection is unchanged.

Website landing links now use the shared in-page router instead of full document navigation. Page content enters with a 220 ms opacity fade, without moving the persistent wordmark or mode controls; reduced-motion preferences skip it. The older section entrance animation was removed to avoid stacked fades. Existing hash links and browser Back remain supported. Updated verification: all eight targeted model, menu and desktop/mobile navigation tests pass, including same-document Selected Work and All Works arrivals. App build and whitespace checks pass.
