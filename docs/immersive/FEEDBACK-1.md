# Feedback pass 1 — 11 November 2026

> Historical pass record. For current behavior and deployment status, see [Architecture](ARCHITECTURE.md) and [Verification](VERIFICATION.md).

Status: local review only. Neither the Cloudflare review deployment nor production was updated. No changes were made to catalogue.gallery.

## Changes

- **Split duplication:** the left panel contains the selected work. The right panel now contains the next distinct work from the same collection. If the collection has no alternate, an existing related work is used. Stable IDs and preview URLs are checked so an alias cannot repeat the same image. The original canvas is hidden during detail and its camera is retained for closing. Clicking the companion advances the detail and companion together.
- **Website navigation:** the Website tab always opens `/?view=website` with the conventional home carousel and site navigation. It no longer inherits an artwork, collection or shop scroll context. This also works when Website is already selected. The separate Full artwork details link still opens the specific work.
- **Frames and original proportions:** a hairline frame and narrow mount follow the actual image edge, not a square container. Intrinsic image dimensions determine the displayed shape, contained within the available area without cropping. The same rule covers Explore, Gallery, companion works and detail. The frame layout was changed from grid to flex so tall images obey their available height as well as width.
- **Explore expansion:** 22 works, comprising the original eight plus two further works from each of the seven represented collections. Additions are sampled from existing collection order and omit collection parents. The authored field expands outward, leaving the original central composition intact; the overview and pan bounds include the additions. Additional previews lazy-load. Gallery still starts with the original eight; the existing one-work contextual carry-over remains available when explicitly switching from another artwork.
- **Texture comparison:** a static paper-grain variant was compared with the flat ground. The flat version remains the default because it keeps the artwork's own texture dominant. The very subtle variant remains available at `/?view=explore&surface=paper` for comparison. It adds no navigation control and changes neither typography nor palette.

## Local browser verification

- Impossible Folds 01 opens beside 02. Selecting 02, through either the rail or companion, changes the right pane to 03. The background field is hidden while detail is open, preventing another copy behind the companion.
- Website from Chanchanok's Temple in Gallery opens the home carousel. About, Practice and Exhibitions & Press are visible in the desktop navigation. No artwork dialog remains open.
- Full artwork details still opens the corresponding print card. Pressing Website again from the shop resets to home.
- The expanded Explore overview contains 22 unique works. All 22 loaded images were checked against their natural aspect ratios, including wide landscape works.
- Gallery image sizes were measured at a 1280 × 720 viewport: Impossible Folds 01 (900 × 1600) renders at 263.25 × 468; Hózhó (1067 × 1600) at approximately 312.094 × 467.992; square Porcelain Sunset at 468 × 468; Dark Horse (3200 × 1800) at approximately 614.398 × 345.594. Subpixel rounding is the only difference in ratios. No square normalization is applied.
- Portrait mobile checks at 390 × 844 cover the framed detail and Gallery. The companion is omitted at the existing full-width mobile breakpoint; the artwork remains uncropped, and the rail and close controls remain available.
- No console errors were reported in the inspected local flows.
- Final `npm run verify` passed with Node 22: all 1,704 routes prerendered; 208 tests passed, with no failures or skipped tests. The regression checks cover distinct companion images, the 22-work expansion, the unchanged curated selection, and separate home/detail destinations.

## Evidence

Files are under `output/playwright/feedback-1/`:

- [Distinct split artworks](../../output/playwright/feedback-1/split-distinct-works.jpg)
- [Website home](../../output/playwright/feedback-1/website-home.jpg)
- [Gallery portrait](../../output/playwright/feedback-1/gallery-portrait.jpg)
- [Gallery landscape](../../output/playwright/feedback-1/gallery-landscape.jpg)
- [Measured Gallery proportions](../../output/playwright/feedback-1/gallery-aspect-ratios.json)
- [Mobile detail](../../output/playwright/feedback-1/mobile-native-proportions.jpg)
- [Mobile Gallery](../../output/playwright/feedback-1/mobile-gallery-portrait.jpg)
- [Expanded Explore overview](../../output/playwright/feedback-1/explore-22-works.jpg)
- [Flat ground](../../output/playwright/feedback-1/explore-flat.jpg) / [paper variant](../../output/playwright/feedback-1/explore-paper.jpg)

These are browser viewport checks, not physical-phone testing. The earlier walkthrough and deployed screenshots document the prior version and intentionally remain unchanged.
