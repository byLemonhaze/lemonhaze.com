# Mobile navigation and presentation refinements

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

Rapid mode switching now discards stale Website continuations, cancels obsolete page fades, and honors the most recent requested mode even while the previous view is still initializing. Gallery callbacks cannot add artwork parameters to a newer Website/Explore route. Existing artwork/collection handoffs remain intact.

Mobile Explore starts with the full lemon. The fit control alternates between the overview and Impossible Folds 01, with the artwork fitted between a 136px header clearance and the bottom toolbar. Other mobile artwork handoffs use the same safe area. Desktop focus keeps its previous center. Wall-pressure release starts from the rendered contact position rather than the overshot pointer target, avoiding a release jump while retaining rebound and squash.

One persistent appearance control uses drawn monochrome SVG icons; its mobile touch target is at the right edge and Website Menu sits immediately to its left. Duplicate appearance dots are removed. Night Gallery uses neutral charcoal. The Website collection header has a transparent background and does not independently animate its theme, eliminating the transient horizontal seam. Blocked conventional collection images try the owned CDN and then an available local still.

All Works in the Website drawer has a bounded scroll area sized from the year count and available space. Expanding a year does not move the utility links below it. Short mobile menus use compact links; the collection region scrolls independently.

Studio Notes previews are visible only while their note is closed. Opening any note shows its full media without repeating the summary thumbnail. Beyond the screen now uses the existing Hosoi signing film from 31s through 54s, with muted inline autoplay, looping, controls and a signing poster. No crop, watermark removal, or alteration of the original Shop video. Only the associated media caption/link changed; surrounding Practice wording is preserved.

All Works covers:
- BEST BEFORE: Sealed (Nº1), Nº133, Expired (Nº21).
- Montreal: De Sève, Five Roses, Rue Cuvillier.
- Liminality: Non-Place, Eerie Night, Terminal 36.
- DeVille: Nº9 replaces the first cover; Nº8 and Nº16 remain.
- Orphelinat: Paris, Hosoi, Deprivation.

Review screenshots: `output/playwright/feedback-17/index.html`. Browser checks cover rapid mode bursts, safe mobile focus, collection-menu link positions, theme persistence, neutral presentation controls, conventional image fallbacks, expanded-note media and signing-video configuration. Physical-device testing is not represented by browser emulation.

Verification completed: `npm run verify` passed with 1,705 prerendered routes and 241 passing tests; the built mobile regression also passed in WebKit. Additional browser checks exercised all four walls and confirmed the full deformed lemon stays contained during rebound.
