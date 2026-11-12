# Initial preview verification — historical

> This records the first November 11 preview, not current deployment status. See [current verification](VERIFICATION.md) and the [feedback index](README.md).

The observations and limitations below describe the initial preview deployment. Later feedback passes replace its navigation, media presentation, motion controls, gallery movement and Website layout.

Review date: 2026-11-11. Branch: `feat/immersive-experience`.

## Review destinations

- Local preview: http://127.0.0.1:5173/
- Cloudflare preview: https://immersive-review.lemonhaze.pages.dev/
- Immutable deployment: https://9c44e7ae.lemonhaze.pages.dev/
- Production `lemonhaze.com` is unchanged. The review uses the existing `lemonhaze` Pages project and a separate `immersive-review` branch.

## Automated checks

The final `npm run verify` passed with Node 22 after the last accessibility correction: 1,704 prerendered routes and 207 tests passing, with no failures or skipped tests.

The existing tests cover routing, conventional collection/artwork rendering, SEO, mobile artwork close controls, catalogue integrity and the site's other existing features. New model tests cover explicit mode precedence, the exact eight selected works, complete collection membership/order and parent-artwork rail continuity. The new animated interactions were inspected manually in Chrome, not covered by a new end-to-end automation suite.

## Browser checks performed

- Root arrival opens Explore with the exact live selection; existing collection and artwork paths retain Website behavior.
- Desktop canvas dragging, wheel movement, settling, overview and zoom; click versus drag; keyboard opening and Escape closing.
- Opening Impossible Folds displays its twelve ordered works. Selecting 02/03 changes title, image, URL and selected thumbnail. Closing restores the prior canvas transform (measured within 0.02 px after settling).
- Liminality includes its parent and seven works. Selecting its parent retains the same collection rail.
- Gallery navigation by buttons, arrows, wheel and drag. Art and room move in the same perspective space and settle without perpetual animation.
- All three view switches retain an active artwork, including a non-featured Impossible Folds work. Website scrolls to the corresponding shop card; returning to immersive retains the work as one temporary contextual addition.
- Back/Forward restore artwork selection. Refreshing explicit view/detail links preserves intent.
- Detail keyboard focus is placed on Close; closing returns focus to the current mode's artwork, including after switching modes with a detail open.
- Reduced-motion control removes artwork flights and automatic original-media playback. Porcelain Sunset had zero live originals while reduced, one after Play original, and zero after Pause/close.
- Animated Porcelain Sunset's actual on-chain artwork was inspected. Hidden immersive views release live originals; repeated mode switches leave one experience root and no settled transition ghosts.
- Mobile portrait at 390 × 844 and landscape at 844 × 390: reachable mode/close controls, independently scrolling rail, proportionate artwork and layout adaptation. Gallery dragging at portrait size changes artwork without opening detail. Conventional mobile artwork close was tested after moving its header beneath the mode switch.
- Website's Light/Dark appearance control was exercised; Explore retained the selected dark appearance with readable controls, then light appearance was restored.
- No application-origin console errors were observed in the inspected flows. Browser-extension warnings were excluded.
- The deployed preview was checked for root arrival, the twelve-work Impossible Folds rail, Gallery movement, Website context continuity and refresh of the Hózhó artwork deep link. Hózhó's original loaded from Ordinals after refresh. Porcelain Sunset's live original was also verified at 390 × 844 on the deployed preview. The deployed browser console contained no errors in these checks.

## Evidence

All paths below are relative to this document.

| Evidence | File |
| --- | --- |
| Desktop Explore | [desktop-explore.jpg](../../output/playwright/desktop-explore.jpg) |
| Dark Explore | [desktop-dark-explore.jpg](../../output/playwright/desktop-dark-explore.jpg) |
| Desktop split detail | [desktop-split.jpg](../../output/playwright/desktop-split.jpg) |
| Desktop Gallery | [desktop-gallery.jpg](../../output/playwright/desktop-gallery.jpg) |
| Desktop Website | [desktop-website.jpg](../../output/playwright/desktop-website.jpg) |
| Mobile Explore | [mobile-explore.jpg](../../output/playwright/mobile-explore.jpg) |
| Mobile collection detail | [mobile-detail.jpg](../../output/playwright/mobile-detail.jpg) |
| Landscape detail | [landscape-detail.jpg](../../output/playwright/landscape-detail.jpg) |
| Mobile Gallery | [mobile-gallery.jpg](../../output/playwright/mobile-gallery.jpg) |
| Mobile Website | [mobile-website.jpg](../../output/playwright/mobile-website.jpg) |
| Deployed split detail | [deployed-split.jpg](../../output/playwright/deployed-split.jpg) |
| Deployed mobile original | [mobile-animated-detail.jpg](../../output/playwright/mobile-animated-detail.jpg) |
| Motion walkthrough | [immersive-walkthrough.mp4](../../output/playwright/immersive-walkthrough.mp4) |

The short walkthrough contains actual sequential browser captures of Explore navigation, opening, collection changes, closing, Gallery motion and switching through Website and back to Explore. Idle gaps between tool actions were condensed. It is a visual interaction record, not a frame-rate benchmark. It was captured before the final motion-toggle and cross-mode focus polish; the core animations are unchanged. Intermediate frames are local-only and ignored by Git.

Reference screenshots and direct observations are listed in [REFERENCE-OBSERVATIONS.md](REFERENCE-OBSERVATIONS.md). The exact selected IDs and complete rails are in [verified-selection.json](verified-selection.json). Architecture and lifecycle details are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Known limitations and refinements

- Mobile evidence is Chrome viewport testing on the Mac, including pointer drags at mobile sizes. Physical iPhone/Android touch, mobile browser chrome/safe-area changes, Safari and Firefox have not been verified. These remain pre-production checks.
- Explore closely follows Palmer's spacious canvas and desktop split structure, but it is an original implementation rather than a pixel-identical clone. On narrow screens, the detail intentionally uses the full width with a persistent rail; Palmer's observed mobile treatment retained a narrower split and omitted that rail.
- Gallery uses CSS 3D architecture, perspective and restrained velocity shear. It does not implement Unseen's WebGL fluid shader deformation. Review the actual movement in the preview before judging reference parity.
- Reduced-motion behavior was exercised through the in-page control using the same reduction helper. An operating-system preference change was not manually tested. Rendering/import fallback and unavailable-image paths are implemented but were not deliberately fault-injected in the browser.
- Collection/order coverage is verified for every featured work. The entire archive's interactive originals were not individually opened; external CDN and Ordinals availability still affects those originals.
- No low-end-device GPU/memory profile or quantitative frame-rate benchmark was performed. On-demand rendering and media disposal were inspected structurally and through DOM lifecycle checks.
- The existing conventional print purchase dialog retains its native modal behavior; close it to return to the persistent mode switch. No checkout or payment was submitted during verification.
