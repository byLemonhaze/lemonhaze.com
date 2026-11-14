# Static artwork previews — November 14, 2026

## Change

Paint Engine works were opening their original HTML automatically in split view. Their embedded layouts and engine controls could replace a correctly fitted still with an oversized or cropped rendering. The artist requested the static images used on the collection pages before November.

All 13 catalogued Paint Engine inscriptions now keep their historical stills in Explore/Gallery detail and desktop solo. The same policy covers On Paper, Mostly Art, Smooth Sailor, Debt Sentence and Smoke Break. Existing video, 3D and evolving works retain their live presentation, including Dark Horse, the motion works and BEST BEFORE. This is an explicit presentation policy, not a blanket conversion of HTML inscriptions to images.

The source remains the collection-grid image resolver from the pre-November implementation (`0c2a4bc`). No artwork was regenerated or recolored. Seventeen sources respond with HTTP 200 and `image/png`. Bam's CDN PNG returns 404; its existing local encrypted-work preview is retained instead. Historical preview resolutions vary: the checked Passe-Partout PNG is 1200 × 1800, while Faux-Chat is 324 × 648.

HTML metadata, embedded notes and the explicit View inscription link remain intact. Automatic live startup is blocked both on initial open and on returning to the browser tab. Desktop solo reuses the still in place. The separate legacy HTML/engine tools remain available.

## Verification

- Browser inspection with actual CDN images: complete Passe-Partout in desktop detail; complete Faux-Chat in a 390 × 844 phone viewport; neither mounted a live iframe.
- Regression coverage: all 13 Paint Engines and the five related stills; HTML identity remains available to notes; motion/3D/evolving works remain live.
- Browser regression: Passe-Partout, Faux-Chat and encrypted Bam at desktop and phone sizes, visibility restart, desktop solo, no automatic chain request, and existing live-canvas fitting checks.
- Final `npm run verify`: passed; 1,704 prerendered routes and 259 passing tests. Vite reports the existing large-chunk advisory. The first run built before the Bam fallback was added and failed its new preview check; the final rebuild and complete suite passed.

## Publication

Local change based on `64507ecf1b8890a629f4ea66e62a1ff765104a48`. This report does not claim a production deployment. Physical-device testing and a complete audit of every other HTML inscription remain outside this fix.
