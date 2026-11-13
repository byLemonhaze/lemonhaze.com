# Mobile lemon bounce — November 13, 2026

## Behavior

A finger drag starting on an artwork previously ended when implicit touch capture moved from the artwork button to the Explore viewport. The field now ignores that child capture-loss event and continues the same drag.

On phone-sized screens, wall pressure responds to a shorter movement, throws scale to the available distance, and rebounds have visible compression without rapid ricochets. Releasing a held squeeze retains the visible wall contact as it relaxes. Browser-toolbar height changes keep the field position unless the overview must be refitted to remain visible. The opening composition, original artwork proportions and desktop physics remain unchanged.

## Review evidence

- [Recorded mobile wall squeeze and rebound](../../output/playwright/mobile-lemon-bounce.webm).
- [Before](../../output/playwright/mobile-lemon-before.png), [pressed against the wall](../../output/playwright/mobile-lemon-pressed.png), [rebound](../../output/playwright/mobile-lemon-rebound.png).
- Physics simulations cover 320, 375, 390 and 430px phone widths at 30 and 120fps.
- Chromium touch checks start directly on artwork, verify sustained dragging, wall pressure, release continuity, containment and browser-height changes at 320 and 390px.
- WebKit mobile layout/navigation checks pass. These checks emulate mobile browsers; they are not a physical iPhone test.

## Publication

Release verification and deployment identifiers will be recorded here after publishing.
