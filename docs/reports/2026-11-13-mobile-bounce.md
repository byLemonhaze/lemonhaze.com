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

- Application source: [`ee07810`](https://github.com/byLemonhaze/lemonhaze.com/commit/ee07810b19d8d440afa7d1056f778c54bfdffe51).
- Complete Node 22 `npm run verify`: **1,704 prerendered routes; 257 tests passed, zero failures**.
- Production: [lemonhaze.com](https://lemonhaze.com/?view=explore).
- Immutable Cloudflare deployment: [d3b2e225.lemonhaze.pages.dev](https://d3b2e225.lemonhaze.pages.dev).
- Published experience bundle matched the verified local build byte for byte (SHA-256 `3751081e764fb5da3f4c372cb453caa3592929bd3ce0c12d61b744ed862a9cda`).
- The mobile browser regression passed against production, including actual browser touch-event sequences, pressure/release containment and mode navigation.
- [PR #68](https://github.com/byLemonhaze/lemonhaze.com/pull/68) records protected-main integration and required GitHub verification. Cloudflare's production branch label is separate from Git integration.

