# Mobile artwork detail performance — November 13, 2026

## Changes

Opening artwork details now pauses the hidden Explore or Gallery animation loop and clears its sharp-preview queue. Closing details resumes only the active scene, preserving the selected artwork and position. Browser visibility changes cannot restart the hidden scene while details remain open.

Live HTML artworks on phone-sized screens now receive their fitted viewport dimensions without an additional enlargement. Native device pixel density still applies. Removing the former enlargement avoids up to four times the canvas pixel-buffer area for artworks that size their drawing surface from the viewport. Desktop sizing, high-resolution stills, original artwork proportions and the stable live viewport used during solo transitions remain unchanged.

## Evidence and limits

- A controlled 390 × 650, DPR 3 opening sequence recorded **608 hidden Explore style/image mutations before the change and zero after**, over 1.5 seconds. This measures background work, not a physical-device frame-rate improvement.
- Browser regressions cover pausing Explore and Gallery, visibility changes, resuming navigation, retained sharp posters, and live HTML rendering at native DPR 3 without the extra viewport enlargement.
- Complete Node 22 `npm run verify`: **1,704 prerendered routes; 257 tests passed, zero failures**.
- The WebKit mobile layout/navigation regression passed against the local preview.
- These are emulated browser checks. A physical iPhone check remains useful, particularly for complex third-party live artworks whose own animation costs vary.

## Publication

- Application source: [`bc3773f`](https://github.com/byLemonhaze/lemonhaze.com/commit/bc3773f003609182b30b477a38240a0804b50759).
- Production: [lemonhaze.com](https://lemonhaze.com).
- Immutable Cloudflare deployment: [d2bc7f94.lemonhaze.pages.dev](https://d2bc7f94.lemonhaze.pages.dev).
- The published experience bundle matched the verified build byte for byte (SHA-256 `03e5bd82a9acd203825656d6ef1683bce364a5ac25645650c0acfbe3d41c0928`).
- Both affected Chromium browser regressions passed against production: mobile navigation/background suspension and media detail/solo rendering. The live HTML test uses a controlled canvas fixture; it does not benchmark every external artwork.
- [PR #69](https://github.com/byLemonhaze/lemonhaze.com/pull/69) records the required GitHub verification and protected-main integration. Cloudflare's production branch label is separate from Git integration.
