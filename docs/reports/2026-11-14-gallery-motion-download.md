# Gallery movement and image downloads — November 14, 2026

## Change

Gallery movement between artworks is calmer: critically damped settling uses rate 11.5 instead of 15, depth varies smoothly up to 90 pixels instead of 330, and turning is bounded at 10 degrees instead of 32. The smooth depth curve removes the abrupt scale-rate change at the center. Circular navigation, pointer tracking, keyboard controls, artwork proportions and reduced-motion behavior remain intact.

Split view has a muted 11px Download image control beneath the existing links in its right-hand information panel. It saves an image without leaving the site. Static works retain their original image source; HTML and video works use their collection still. Downloads validate image responses, use the artist's mirror if a chain image gateway fails, and cancel when the selected artwork changes or the panel closes. Filenames preserve artwork titles with the correct image extension. Failures show a small retry message. This does not export the current state of a live HTML engine.

## Verification

- Node 22 `npm run verify`: 1,704 prerendered routes and **264 tests passed**. Existing large-bundle warnings remain.
- Download tests cover still/live source selection, blocked chain fallback, rejected HTML payloads, cancellation and filenames. Desktop/mobile browser checks save files while retaining split view and the current URL.
- Real CDN download checked locally: Hózhó saved as a 2304 × 3456 PNG. Download placement was inspected on desktop and at 390 × 844.
- Gallery checks cover frame-rate-independent settling without overshoot, circular boundaries, buttons, keyboard, wheel and drag.

## Publication

- Application source: [`a04d079`](https://github.com/byLemonhaze/lemonhaze.com/commit/a04d079245b139c89e455ff240f590553379953e).
- Production: [lemonhaze.com](https://lemonhaze.com); immutable deployment: [8eb3e51c.lemonhaze.pages.dev](https://8eb3e51c.lemonhaze.pages.dev).
- Cloudflare Pages project `lemonhaze`, production branch label `main`. This hosting label is separate from GitHub source integration.
- Live `experience-T-j9m3sF.js` matches the verified build: SHA-256 `3f4881ac0e19b67b6de53271e24e2262483242e2fced6171aa37f1f1cd522552`. Gallery returned HTTP 200.
- Both affected browser regressions passed against production: Gallery navigation and the artwork detail/download suite. The download checks cover desktop and phone layouts, unchanged page URL, suggested filenames and successful saved files.

Physical-device testing and every remote image gateway were not exhaustively checked. The download uses an available collection still for live media rather than generating a new artwork export.
