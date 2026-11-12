# Follow-up tracker

Status reviewed November 11, 2026, after application release `041ea75`. Completed implementation belongs in the [work report](reports/2026-11-11.md); this file records remaining checks and ongoing maintenance, not unimplemented copies of superseded feedback.

| Status | Item | Completion evidence needed |
| --- | --- | --- |
| Follow-up | Physical iPhone/DuckDuckGo and Safari, plus Android touch review | Pinch → detail, keyboard-sized picker, browser bars, solo availability on desktop, wall motion and rapid mode switches on real devices |
| Follow-up | Representative older HTML/WebGL work review | Successful live presentation or a working static fallback; do not claim every inscription was tested |
| Follow-up | Low-end-device performance measurement | Device/network profile and measured frame/memory/load data; current asset-size reductions are not page-speed benchmarks |
| Follow-up | Search indexing and social preview refresh | Search Console/index monitoring and platform-specific sharing checks; route generation alone is not indexing proof |
| Separate release | Open shop purchases | Explicit merchant approval and all readiness items in [SHOP.md](SHOP.md); keep current storefront gates closed |
| Separate operational work | Historical private-data removal and old hosting previews | Follow the unresolved items in [SHOP-AUDIT.md](SHOP-AUDIT.md); never repeat private values in reports |

## Maintenance after artwork or layout changes

1. Update authoritative manifests and the relevant curation rules, preserving stable IDs and original wording.
2. Check collection membership, originals/editions, parent links, cover choices and chronological ordering separately.
3. Regenerate affected display previews and the Explore overview after layout/preview changes; preserve native pixel originals.
4. Run the appropriate checks and `npm run verify` before an application release. Record actual counts, not copied historical counts.
5. Add review images and a dated report. Link the source commit and immutable deployment only after they exist.
6. Keep the current guides and changelog synchronized. Historical pass notes remain historical.

For documentation-only changes, verify links, referenced paths, code/config claims and whitespace. No application redeployment is needed unless a public runtime document or site behavior also changes.
