# Explore loading stability — November 14, 2026

## Change

Impossible Folds 01 could briefly show a wider frame during landing or refresh. The image could become available before its load handler applied the natural aspect ratio, leaving the default frame visible for a moment. At the recorded 1512 × 982 viewport, that frame changed from 390 × 510 to 286.875 × 510.

Explore now reveals the initial artwork mount only after its natural ratio is applied and the image is decoded. Stale decode completions cannot reveal a different source. Sharp-preview upgrades leave an identical image URL in place instead of assigning it again. The mobile overview retains transparent artwork interaction targets. Artwork files, final proportions and placement are unchanged.

## Verification

- Node 22 `npm run verify`: **1,704 routes and all 265 tests passed**. Existing large-bundle warnings remain.
- New browser regression checks seven cold/cached loads with deliberately delayed decoding, plus an unavailable-image case.
- Seven local recordings retained the final dimensions on every visible frame. Existing mobile navigation, Gallery and artwork-detail tests passed.
- Seven production refresh recordings after deployment retained the correct dimensions on all 3,476 sampled visible frames of Impossible Folds 01.
- Production Explore returned HTTP 200. Live `experience-CamV7GGz.js` matches the verified build: SHA-256 `fcc55e3fa8a27d6ae3ca7f9e42bf069ae00883c8f0d24a57662327dc06d2a9e2`.

## Publication

- Application source: [`d4bbbc9`](https://github.com/byLemonhaze/lemonhaze.com/commit/d4bbbc99102a9878f982e41b0303bba999daf5e9).
- Production: [lemonhaze.com](https://lemonhaze.com); immutable deployment: [4e57e232.lemonhaze.pages.dev](https://4e57e232.lemonhaze.pages.dev).
- Cloudflare Pages project `lemonhaze`, production branch label `main`. Hosting publication and GitHub source integration are separate steps.

The repeated production recordings used desktop Chromium at DPR 2. Physical-device and every-browser verification were not performed. Documentation-only publication updates do not change the deployed application build.
