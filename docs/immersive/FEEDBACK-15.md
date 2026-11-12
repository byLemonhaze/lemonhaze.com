# Collection covers, media and gesture refinement — 11 November 2026

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

Production deployment authorized by the artist after the local review. No catalogue.gallery files changed.

## All Works

Collection-first browsing remains intact. Every collection sorts newest to oldest using its documented collection date, including ordering within each year. Covers now use the artist's explicit selection, in order:

| Collection | Cover works |
| --- | --- |
| Gentlemen | Nº1, Nº3, Nº5 |
| Miscellaneous | Saint-Tropez, C mon ❤️, Kahnawake |
| Manufactured | Nº77, Nº7, Nº107 |
| 1 of 1s (2025) | Gentleman SE25, Chanchanok's Temple, Minute, papillon! |
| 1 of 1s (2026) | Gentleman: Special Edition 2026, Paint Engine v1.07 [Passe-Partout], Wilderness |
| La Tentation | Nº1, Nº8, Nº0 |
| Tin Box of Solitude | Fisherman, Tea Pot, Bacon & Butcher |
| Trilogy (Prints) | One each of Off-Kilter, Glass Breaker, Mending Out |
| Satoshi (Original & Editions) | One original; no empty companion slots |

Five Ethereum releases from the site's existing supply list were matched to token transfers involving `lemonhaze.eth` (`0x024EC3830dC59f85535BD1833d7B3786e2D03997`): Boulogne Editions, Rich Bean Editions, Bell Street Style, Murky by John D'Oeufs, and Marilyn Monero. All Works includes local static previews, title search and direct OpenSea token links. They do not alter the approved Explore composition or the inscription catalogue. `src/data/ethereum-works.json` records contract, token, source and date evidence. Four August 2020 mint dates were verified from Blockscout transfer records; Marilyn uses the existing site's 2021 year, without inventing an exact date. Its expired image URL was replaced with the current image on its verified OpenSea token page.

## Image loading

All 16 Old-Fashioned works use local JPEGs generated from the artist CDN, in the Website grid, immersive modes, legacy viewer and visualizer. Chain media and render-service fallbacks are disabled for those works. Their existing external inscription links remain available. See `old-fashioned-images.json` for source URLs and dimensions.

All 422 Manufactured works have 1600-pixel maximum display derivatives generated from the CDN originals. Native aspect ratios are preserved. Combined payload falls from 6.77 GB of source images to 267 MB of display images (96.1% smaller); Nº77 falls from 14,757,423 to 554,080 bytes. These are image payload comparisons, not claimed real-world page timing measurements. Gallery still decodes only two sharp previews concurrently, prioritizing the current work and its neighbours. Tiny Explore overview thumbnails remain separate. Rebuild using `scripts/build_manufactured_previews.mjs`; `manufactured-images.json` records every source and output.

## Navigation and motion

Explore from any split view closes detail and centres the field on that work (or its single original for editions), matching Gallery → Explore. Gallery from detail retains the work and its collection. Fixed camera surfaces use clipping rather than native scroll containers, preventing implicit browser scrolling from displacing their CSS camera coordinates. Collection title and counter update together when a carousel is restored.

Removed the Motion on/off control. System reduced-motion support remains. Gallery dragging follows the pointer directly, locks its movement axis, and uses a short velocity projection on release before a critically damped centre snap. Trackpad motion is continuous, with a snap after the gesture ends. Cancelled drags settle safely and releasing a drag does not open an artwork. The room remains stationary; artworks retain their proportions.

Split selection swaps the decoded poster atomically, cancels departing live media, and guards late image loads against changing the next work's frame. The sharp still resolves before live content starts, and remains visible until the live artwork has actually painted. Opening flights capture their source position before the background changes.

Review screenshots: `output/playwright/feedback-15/index.html`. Live-frame sizing is tested with deterministic painted-canvas fixtures; external chain failures retain the static fallback.

Final composition adjustment: Hosoi is centred between Gentleman Nº6 and Hillside Desolate at its native 16:9 ratio; Gentleman Nº6 moved slightly left and Hosoi was enlarged to 380 × 213.75 field units. Other fixed works retain their positions.

Griffintown's four missing CDN stills now have sharp local fallbacks rendered from complete original HTML sources already in the artist's archive. Their source IDs and output dimensions are recorded in `griffintown-images.json`. Live playback remains available where the chain request succeeds.

On mobile Website artwork details, Close has its own space between the wordmark and Menu, so neither control intercepts the other.

Studio Notes now opens with an existing workspace photograph and uses each note’s own photograph or film still as an inline preview. Collecting includes Chanchanok’s Temple, the existing BEST BEFORE lifecycle image, and print photographs. All existing prose and the 86 Studio Notes remain intact; image proportions are preserved and no videos autoplay. Desktop and mobile screenshots are included in the review folder.
