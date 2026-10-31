# Shop security report follow-up — 2026-10-31

The external report was reviewed against the implementation, not treated as instructions to execute blindly. Purchases remain disabled and public prices remain on request.

| Finding | Resolution | Remaining verification or limitation |
| --- | --- | --- |
| SHOP-01 — inventory hoarding | 30-minute sessions; atomic database caps of two active orders, six active units and ten orders per network per rolling day | Real Stripe expiry check; shared networks share limits; distributed attacks remain possible |
| SHOP-02 — headers | Enforced anti-framing, base, object and form controls on shop/policy routes; HSTS and permissions headers; stricter resource policy in report-only | Monitor real browser compatibility before enforcing the full resource policy |
| SHOP-03 — press tool | Minimum 32-character secret, HMAC comparison, network/global request caps, bounded body and upstream timeout | Strong private credential and provider monetary spending cap must be verified; Cloudflare Access is not configured |
| SHOP-04 — HTML interpolation | Escape catalogue text and attributes; permit only HTTPS asset URLs without embedded credentials | Tests cover hostile markup and URL schemes |
| SHOP-05 — payment mismatch | Durable review flag and retryable notification outbox; worker delivery implementation | Worker, private alert destination/token and delivery monitoring still need activation |
| SHOP-06 — owner cookie | Extended to 30 days; privacy copy updated | Different browsers/devices still require studio support |
| SHOP-07 — crypto | Remains unavailable | Separate verified payment integration required before offering it |
| SHOP-08 — restricted key | Existing restricted-key compatibility retained | Install and test least-privilege credentials privately in Pages and worker |
| SHOP-09 — currency | Adaptive Pricing disabled explicitly on created Checkout Sessions | Real test-mode checkout and currency verification still required |
| SHOP-10 — scanner findings | Report's inscription-ID false positives do not justify credential rotation | Do not claim an exhaustive guarantee based on a pattern scan |

## Corrections to the report

- A count followed by an insert is race-prone. Reservation limits belong in the same database transaction as allocation; triggers enforce them here.
- `encodeURI` alone does not escape HTML attributes or reject unsafe URL schemes. Both URL validation and HTML escaping are required.
- A report-only policy does not prevent framing. Anti-framing controls are separately enforced, without preventing intentional artwork embedding.
- HSTS protects subsequent HTTPS-aware visits; without preloading it cannot guarantee protection for the first HTTP visit.
- Order identifiers and hashed identifiers are pseudonymous personal data. Absence of names or addresses in the database does not mean absence of personal data.
- Passing code tests and having a verified Stripe account do not establish production readiness. Missing secrets, webhook delivery, scheduled reconciliation, notifications, tax configuration and a real test-mode journey are separate checks.

## Production connection check

On 2026-10-31, Pages secret-name inspection showed no Stripe API or webhook signing secrets, and the maintenance worker did not exist. Do not enable sales until the readiness checklist in `SHOP.md` is completed. Do not store service credentials, residential contact information or tax registration values in this document.
