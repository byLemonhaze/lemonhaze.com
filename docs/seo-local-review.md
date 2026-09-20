# Local SEO review — 20 September 2026

Prepared and reviewed in an isolated local preview before the requested release. The original black visual design and editorial content are preserved.

## Archive coverage

The initial 1,307 inscription pages were incomplete. Adding the official BEST BEFORE manifest supplies 302 additional unique IDs; 12 more records from the artist's local COMBU provenance archive are also present in the public CDN provenance file. The local build now includes 1,621 distinct inscription pages, plus 62 collection/reading/section pages (1,683 total).

The saved BEST BEFORE manifest contains all 420 distinct IDs, including works that may no longer circulate. Known burned records and parents are retained even if a live manifest omits them. `SEALED` is a viewer placeholder, not an inscription ID; it never becomes a sitemap URL.

**1,621 archive pages is not a replacement for the stated supply of 1,646.** Parent records must be assigned to their supporting collections for comparison. After applying existing collection aliases and parent assignments, 1,620 archive records map to the supply table. The other archive record is the ORDINALLY collaboration punch card, which the supply table explicitly excludes from Lemonhaze's own supply.

| Supply category | Stated inscribed | Matched records | Difference |
| --- | ---: | ---: | ---: |
| 1 of 1s (2025) | 35 | 32 | 3 unpaired |
| Text & Unclassified | 11 | 0 | 11 unpaired |
| Split collectible | 9 | 0 | 9 unpaired |
| Cypherville Comics | 3 | 0 | 3 unpaired |
| Skull 506 [Remix] 1/1 - Skullx | 1 | 0 | 1 unpaired |
| 1 of 1s (2026) | 14 | 15 | 1 extra record |

All other supply categories reconcile after mapping Orphelinat / L'Orphelinat, Le Bar a Tapas / Le Bar à Tapas, and the existing Tin Box, Griffintown, Liminality, Stuntman, and BEST BEFORE parent IDs. The net difference is 25, but it is **not evidence of exactly 25 missing burned works**: 27 supply entries remain unpaired, offset by the additional 2026 record and collaboration page.

Existing sales records contain five candidate Split collectible IDs, and the site's links contain a Text & Unclassified inscription ID. These still need their individual archive metadata reconciled; no titles, burn statuses, or extra pages were invented to force the totals to match. The supply table remains unchanged pending review.

Sources used:
- Existing `public/data/provenance.json` and featured collection manifests.
- Artist's local `/Users/lemonhaze/Desktop/claude/COMBU/provenance.json` (only absent valid records copied).
- https://cdn.lemonhaze.com/assets/assets/provenance.json (read-only confirmation; no uncovered IDs remain in this feed).
- https://bestbefore.space/magic_eden_collection.json (saved official 420-entry fallback).
- Existing supply data and historical sales records.

## SEO implementation

- Generate full initial HTML using the site's existing renderers and design.
- Give each known route its own title, description, canonical URL, and sharing metadata.
- Generate robots.txt and sitemap.xml from the same catalogue used by the browser.
- Use ordinary links for section and artwork navigation while preserving interactive clicks.
- Keep a saved official BEST BEFORE manifest as an offline fallback.
- Preserve genuine 404 responses instead of returning the landing page for unknown addresses.
- Retain live browser data fetching; prices and market snapshots are refreshed by the existing app.

The static export requires a rebuild when new catalogue records are added. It uses checked-in manifests, not live marketplace scans. It does not execute remote inscription scripts while building.

## Verification and review

`npm run verify` builds the complete export and runs the repository tests. Browser review covers metadata changes after navigation, artwork open/close, mobile Market Watch width, and content without JavaScript. The local server marks responses noindex and disables live scan writes.

Review `/`, `/explore`, `/best-before#diary`, `/gentlemen`, `/highlights`, and `/supply#market-watch`. Deployment was authorized with the subsequent Visualizer update. Search Console submission and index monitoring remain separate follow-up work.

## Visualizer update

The Visualizer merges the local provenance snapshot and current same-origin collection manifests with its CDN source. Tin Box of Solitude appears as one parent above 12 works in three rows of four. Griffintown includes its parent in a centered 2×2 group. All 15 known 2026 1/1 records are included; repeated IDs are deduplicated. The 2026 column accommodates all five collections, and the poster date range derives its ending month from the artwork timestamps.
