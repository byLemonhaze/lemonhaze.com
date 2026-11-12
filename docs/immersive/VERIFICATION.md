# Release verification

Application baseline: [041ea75](https://github.com/byLemonhaze/lemonhaze.com/commit/041ea75), November 11, 2026. [Work report](../reports/2026-11-11.md) · [Feedback pass 18](FEEDBACK-18.md).

## Final application checks

- `npm run verify` on Node 22: **1,704 prerendered routes; 246 tests passed**.
- Separate final-build WebKit mobile regression passed; desktop solo entry/return was checked in Chromium and WebKit.
- Native pixel dimensions, theme first paint with fresh/saved/unavailable storage, mobile pinch → detail isolation, mobile close/appearance spacing, wall pressure stability, corner continuity and rebound containment were checked.
- Earlier coverage retained by the full suite includes original aspect ratios, edition deduplication, exact covers, media fallbacks, cross-mode focus, circular carousel/centre snapping, Website navigation, bounded menu chronology and Catalogue embedding.
- Screenshot evidence: [review folder](../../output/playwright/feedback-18/) and [local HTML index](../../output/playwright/feedback-18/index.html). GitHub displays HTML source; open individual images there or use the index locally.

## Deployment evidence

- Production: [lemonhaze.com](https://lemonhaze.com).
- Immutable release: [3d9290e8.lemonhaze.pages.dev](https://3d9290e8.lemonhaze.pages.dev).
- Live checks confirmed the corresponding bundle, native 24px PNG, public Provenance redirect, Catalogue framing policy, paper default and desktop solo return.
- The application was originally published from `feat/immersive-experience` to Cloudflare's `main` production target. Git integration and deployment are separate operations.

## Limits and subsequent documentation

Browser emulation and deterministic live-media fixtures do not replace physical iPhone/Android testing or an exhaustive review of every chain document. No measured low-end-device performance guarantee is claimed. External originals can fail; static fallbacks remain necessary. The supplied DuckDuckGo screenshot is a crash-report opt-in prompt, not proof that the site crashed.

The documentation consolidation changes no application behavior. Its local checks validate repository standards, relative documentation links and whitespace. GitHub's required verification runs again on the merge candidate. Do not confuse those checks with a new production deployment.

See [Tracking](../TRACKING.md) for remaining checks. Older results remain in the [initial review](INITIAL-REVIEW.md) and [feedback passes](README.md); their counts and “not deployed” notes describe their own point in time.
