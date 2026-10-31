# Shop security report follow-up — 2026-10-31

The external report was reviewed against the implementation, not treated as instructions to execute blindly. Purchases remain disabled and public prices remain on request.

| Finding | Resolution | Remaining verification or limitation |
| --- | --- | --- |
| SHOP-01 — inventory hoarding | 30-minute sessions; atomic database caps of two active orders, six active units and ten orders per network per rolling day | Real Stripe sandbox expiry passed; shared networks share limits; distributed attacks remain possible |
| SHOP-02 — headers | Enforced anti-framing, base, object and form controls on shop/policy routes; HSTS and permissions headers; stricter resource policy in report-only | Monitor real browser compatibility before enforcing the full resource policy |
| SHOP-03 — press tool | Minimum 32-character secret, HMAC comparison, network/global request caps, bounded body and upstream timeout | Strong private credential and provider monetary spending cap must be verified; Cloudflare Access is not configured |
| SHOP-04 — HTML interpolation | Escape catalogue text and attributes; permit only HTTPS asset URLs without embedded credentials | Tests cover hostile markup and URL schemes |
| SHOP-05 — payment mismatch | Durable review flag and retryable notification outbox; worker delivery implementation | Scheduled reconciliation and private heartbeat added; local Codex monitoring supplements it. External email alert receiver is not configured |
| SHOP-06 — owner cookie | Extended to 30 days; privacy copy updated | Different browsers/devices still require studio support |
| SHOP-07 — crypto | Remains unavailable | Separate verified payment integration required before offering it |
| SHOP-08 — restricted key | Existing restricted-key compatibility retained | Merchant installed the private Pages key; worker uses only a narrow trigger token. Production Stripe permission verification remains separate from sandbox tests |
| SHOP-09 — currency | Adaptive Pricing disabled explicitly on created Checkout Sessions | Real sandbox Checkout completed at USD 500; live tax and receipt delivery remain unverified |
| SHOP-10 — scanner findings | Report's inscription-ID false positives do not justify credential rotation | Do not claim an exhaustive guarantee based on a pattern scan |

## Corrections to the report

- A count followed by an insert is race-prone. Reservation limits belong in the same database transaction as allocation; triggers enforce them here.
- `encodeURI` alone does not escape HTML attributes or reject unsafe URL schemes. Both URL validation and HTML escaping are required.
- A report-only policy does not prevent framing. Anti-framing controls are separately enforced, without preventing intentional artwork embedding.
- HSTS protects subsequent HTTPS-aware visits; without preloading it cannot guarantee protection for the first HTTP visit.
- Order identifiers and hashed identifiers are pseudonymous personal data. Absence of names or addresses in the database does not mean absence of personal data.
- Passing code tests and having a verified Stripe account do not establish production readiness. Missing secrets, webhook delivery, scheduled reconciliation, notifications, tax configuration and a real test-mode journey are separate checks.

## Production connection check

On 2026-10-31, the webhook signing secret was configured and the merchant installed the API key privately. A real sandbox paid checkout and an explicitly expired session both delivered signed webhooks with HTTP 200; resulting local states were paid and expired, without review flags. The scheduled maintenance worker, authenticated endpoint and heartbeat storage are deployed. The authenticated production endpoint returned HTTP 200; unauthorized requests returned HTTP 404. An hourly Codex monitor is active. All 196 automated tests, the production build and edge compilation passed; public purchases remained blocked in deployed checks. Pattern scans of working files, built output and reachable history passed without claiming an exhaustive guarantee. Do not enable sales until the readiness checklist in `SHOP.md` is completed. Do not store service credentials, residential contact information or tax registration values in this document.


## SITE-REPORT follow-up — 2026-10-31

- Isolated fetched HTML artwork in an opaque-origin sandbox. Image saving uses a source/origin/token-checked message bridge; parent DOM and storage are inaccessible. BEST BEFORE keeps its existing isolated renderer.
- Added strict inscription-ID validation, an eight-second upstream timeout, redirect rejection and a five-minute successful-response cache to inscription metadata. Failed responses are not cached.
- Network reservation caps now group IPv6 addresses by /64. CI has explicit read-only repository permissions.
- Broader HTML routes enforce object, base and form restrictions and observe a resource CSP. Full script restriction enforcement remains pending artwork compatibility work: blob/srcdoc art inherits the parent's CSP and uses inline scripts. Report-only does not block scripts.
- Shop metadata and structured data match the public preview: no price offers or availability claims. Added linked artist/site/page JSON-LD and llms.txt; llms.txt is optional guidance, not a search-ranking guarantee.
- Added content-hashed, uncropped WebP display previews, lazy loading around the active carousel slide and immutable caching only for these previews. Original artwork/download files are unchanged. Creature #7 and Fax use verified local visualizer previews.
- Clarified the nine prints/nine textiles count, trimmed duplicate on-chain wording and removed a misleading historical BTC conversion fallback label. Final border/trim remains an artist decision before launch.
- Verified that the report's historical commit and PR refs still contain removed private contact information. Current-source cleanup does not purge GitHub's retained objects. GitHub Support sensitive-data removal and verification of old hosting previews remain outstanding; no personal values are reproduced here.

Validation: 200 automated tests passed, including iframe isolation/save messaging, metadata validation/cache behavior, IPv6 limits and prelaunch schema. Production build and local browser review performed. The artist approved release after local review; purchases remain disabled and public prices remain on request. Previous production checks above describe their original point in time.
