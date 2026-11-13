# Release verification

## Interaction and presentation release — November 12, 2026

See the [session report](../reports/2026-11-12-interaction-polish.md) for the accepted changes, visual evidence and publication record. Published source [243103e](https://github.com/byLemonhaze/lemonhaze.com/commit/243103e249b90f6f040190e935536538ee939af0) is available at [6a9e2562.lemonhaze.pages.dev](https://6a9e2562.lemonhaze.pages.dev) and lemonhaze.com. [PR #67](https://github.com/byLemonhaze/lemonhaze.com/pull/67) records verification and protected-main integration. The previous release remains recorded separately.

- Central Explore / Gallery / Menu bar, no duplicate corner Menu, far-right appearance control. Original squarer mode bar, reduced height, spring indicator; stronger bounded lemon throws; theme-matched animated solo room.
- Desktop Gallery controls at opposite lower corners, with its collection picker anchored beside its control. Gallery scrolling physics are unchanged in this pass.
- Exact artist-selected workbench image on Website home; secondary links below Exhibitions; Studio Notes signing image; Practice year alignment; intentional edition cover triptychs.
- Embedded notes inside the existing Inscription details group: lazy text-only HTML retrieval, preserved comment wording, original-source disclosure, cancellation on work changes and retry after failures. Old Fashioned remains static-only.
- Ethereum title results and direct links open on site, including reloads; Candidly Yours retains a stable drawing viewport through split/solo and browser resizing.
- Production build and complete tests on Node 22 passed: **1,704 prerendered routes, 254 tests, zero failures**. Earlier local checks passed 11 physics/zoom tests and 5 browser navigation/mobile/refinement checks.

## Previous application release — November 12, 2026

Merged to `main` as [f73ae62](https://github.com/byLemonhaze/lemonhaze.com/commit/f73ae62b7a65be97fd63c0b91625f3af7b04154a), with verification and publication recorded in [PR #65](https://github.com/byLemonhaze/lemonhaze.com/pull/65).

- Full production build: **1,704 prerendered routes; 250 tests passed**. Both required GitHub verification runs and CodeFactor passed.
- Production: [lemonhaze.com](https://lemonhaze.com). Immutable deployment: [ff70bf7f.lemonhaze.pages.dev](https://ff70bf7f.lemonhaze.pages.dev).
- The live experience bundle matched the checked build. Live browser checks observed the 360ms static focus animation, zero temporary layers after completion, and Gallery navigation settling within one CSS pixel of center.
- Alfred Café’s visible live canvas stayed at 493 CSS pixels across 24 sampled frames, with a constant 862-pixel render buffer. Local checks also covered the other Griffintown works, pixel-art and reduced-motion paths, cancellation and fractional sizing.
- Resize and Gallery regression checks wait for the new rendered geometry and actual center position, rather than accepting an old frame or relying on a fixed delay.
- [Visual portfolio tour](../presentation/README.md): current production screenshots and an optional motion preview. These illustrate the interface; they do not replace the automated checks.

## Historical baseline — November 11, 2026

Application baseline: [041ea75](https://github.com/byLemonhaze/lemonhaze.com/commit/041ea75), November 11, 2026. [Work report](../reports/2026-11-11.md) · [Feedback pass 18](FEEDBACK-18.md).

### Baseline application checks

- `npm run verify` on Node 22: **1,704 prerendered routes; 246 tests passed**.
- Separate final-build WebKit mobile regression passed; desktop solo entry/return was checked in Chromium and WebKit.
- Native pixel dimensions, theme first paint with fresh/saved/unavailable storage, mobile pinch → detail isolation, mobile close/appearance spacing, wall pressure stability, corner continuity and rebound containment were checked.
- Earlier coverage retained by the full suite includes original aspect ratios, edition deduplication, exact covers, media fallbacks, cross-mode focus, circular carousel/centre snapping, Website navigation, bounded menu chronology and Catalogue embedding.
- Screenshot evidence: [review folder](../../output/playwright/feedback-18/) and [local HTML index](../../output/playwright/feedback-18/index.html). GitHub displays HTML source; open individual images there or use the index locally.

### Baseline deployment evidence

- Production: [lemonhaze.com](https://lemonhaze.com).
- Immutable release: [3d9290e8.lemonhaze.pages.dev](https://3d9290e8.lemonhaze.pages.dev).
- Live checks confirmed the corresponding bundle, native 24px PNG, public Provenance redirect, Catalogue framing policy, paper default and desktop solo return.
- The application was originally published from `feat/immersive-experience` to Cloudflare's `main` production target. Git integration and deployment are separate operations.

## Limits and subsequent documentation

Browser emulation and deterministic live-media fixtures do not replace physical iPhone/Android testing or an exhaustive review of every chain document. No measured low-end-device performance guarantee is claimed. External originals can fail; static fallbacks remain necessary. The supplied DuckDuckGo screenshot is a crash-report opt-in prompt, not proof that the site crashed.

The documentation consolidation changes no application behavior. Its local checks validate repository standards, relative documentation links and whitespace. GitHub's required verification runs again on the merge candidate. Do not confuse those checks with a new production deployment.

See [Tracking](../TRACKING.md) for remaining checks. Older results remain in the [initial review](INITIAL-REVIEW.md) and [feedback passes](README.md); their counts and “not deployed” notes describe their own point in time.
