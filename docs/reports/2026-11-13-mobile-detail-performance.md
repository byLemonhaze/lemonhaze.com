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

Publication evidence is added after release verification.
