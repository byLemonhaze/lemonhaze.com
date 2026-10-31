# Print Shop

The `/shop` route presents signed Symbiosis prints and physical marker-on-textile works in separate sections. The first public release is a browsing-only catalogue: **Price on request**, disabled **Coming Soon** buttons, and no new checkout sessions.

## Catalogue

- Nine signed paper prints, USD 500 including tax and shipping, limited to three per artwork. Certificate included; on-chain offers unavailable.
- Nine textile works, USD 800 each plus applicable tax, one available per work, with certificate. Dimensions are width × height in centimetres; the group dates to 2023–2025.
- Prints: unframed, approximately 13 × 23.11 inches / 33.02 × 58.70 cm, 9:16, Palo Duro Etching 315 gsm cotton rag. Proof the supplied 2250 × 4000 originals at the intended size before fulfilment.
- Preparation and dispatch within five business days, Monday–Friday. Textile shipping: Canada free, USA USD 15, other supported destinations USD 30. Mixed baskets use textile shipping. These are fixed rates, not carrier quotes.
- Framed and room images are illustrative mockups; frames are not included.

`shared/shop-artworks.js` and `shared/shop-textiles.js` hold product identities. Server-owned prices and limits live in `server/shop/catalog.js`. Stable IDs must never be reused for different compositions. Unsigned offers and withdrawn IDs are rejected, including stale saved baskets. Assets live in `public/shop/`; galleries are mapped in `src/shop/mockups.js`.

## Launch controls

Keep both controls false for the first production release:

1. `VITE_SHOP_STOREFRONT_OPEN` is a **build-time** variable. Omitted or false hides prices, basket and purchase controls.
2. `SHOP_STOREFRONT_OPEN` is an **API runtime** variable. Omitted or false rejects new checkout before stock reservation or Stripe calls, in test and live modes.

Webhooks and authorized existing-order status/cancellation continue operating while closed. Closing does not revoke previously issued Stripe Checkout links: expire outstanding sessions separately if sales were previously enabled. Opening requires explicit merchant authorization, both controls, and all readiness checks below.

## Local development and validation

Run `npm run dev` and `npm run dev:shop` in separate terminals. Copy `.env.example` to ignored `.dev.vars`, restrict its permissions to the owner, and add test credentials privately. Never put secrets in `VITE_*` variables, examples, chat, screenshots or source control. Hosted Checkout does not require a browser publishable key.

The local API listens on loopback, refuses live Stripe keys and uses an in-memory test database. Restarting loses local orders. Do not use real customer data in tests. Forward test webhook events with Stripe's official testing tools and the matching signing secret.

- `npm run test:shop`: catalogue, authorization, origin protection, prices, inventory contention, transaction rollback, webhook signatures/replays, cancellation races and recovery.
- `npm run verify`: full site build and tests.
- `npx wrangler pages functions build functions --outdir /tmp/lemonhaze-shop-functions`: compile the edge backend.

Automated tests use mocked Stripe responses and real SQLite transactions. On 2026-10-31, a real Stripe sandbox Checkout accepted the official test card at USD 500 and its signed completed webhook returned HTTP 200, producing a paid order with no review flag. A second real session was expired through Stripe; its signed webhook returned HTTP 200 and the local order became expired. These used fictional customer data, a loopback backend and the official Stripe CLI forwarding service. Automatic tax was disabled in this sandbox exercise: this does not verify live tax, receipt delivery or production account permissions. Checkout pins API 2026-09-30.endive and uses allowed_payment_method_types, as required by that version.

## Production readiness

Before accepting orders:

1. Bind the dedicated `SHOP_DB` and apply all tracked migrations in `db/shop-migrations`. Never reset allocations or use `MARKET_WATCH_DB`. Confirm test/live inventories, backup and restore procedures.
2. Install `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHOP_RATE_SECRET` and `TURNSTILE_SECRET_KEY` as encrypted Cloudflare secrets. Keep test/live modes separate. Use least privilege and MFA on service accounts.
3. Register `/api/shop/webhook` over HTTPS for `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`. Verify delivery and signature handling.
4. Configure the canonical HTTPS `SHOP_ORIGIN`, permitted destinations, shipping, contact and returns settings. Automatic tax needs the merchant's actual GST/HST and QST registrations in Stripe; account verification alone does not complete this. Do not bypass tax setup to open orders.
5. Verify Turnstile in the deployed browser, including hostname and action validation.
6. Configure and deploy the scheduled reconciliation worker using `wrangler.shop-maintenance.toml` and a random `SHOP_MAINTENANCE_TOKEN` shared with Pages. The worker triggers the authenticated Pages endpoint; it holds no Stripe credential or database binding. Monitor failures and review-required orders. Pages deployment does not deploy this worker.
7. Complete a Stripe test-mode checkout, receipt delivery, shipping/tax checks, cancellation, expiry, retry and last-copy contention checks. Inspect delivery details in Stripe. Fulfil only verified paid orders.
8. Confirm support mailbox send/receive delivery, policies, packaging and print proof. Packaging must accommodate the full print plus protective backing.
9. Live credentials may be installed privately while the storefront stays closed. Only on explicit launch instruction set `SHOP_MODE=live`, `SHOP_LIVE_ENABLED=true`, `SHOP_POLICIES_CONFIRMED=true`, enable both storefront controls, rebuild and deploy. Do not execute paid purchases automatically.

On 2026-10-31 the live webhook endpoint was registered for the four Checkout events above and its signing secret installed privately in Pages. The merchant subsequently installed `STRIPE_SECRET_KEY` privately. Sandbox payment and expiry have now passed. Pages and the ten-minute maintenance worker were deployed, migration 0006 was applied, and the private authenticated maintenance endpoint and monitoring snapshot were verified. An hourly Codex heartbeat monitor is active; its local availability dependency is described below. Tax registration, production permission checks, mailbox and receipt delivery still require verification. The public shop stays closed. See `docs/SHOP-AUDIT.md` for the report resolution and remaining operational work.

## Security and personal data

Stripe-hosted Checkout collects name, email and shipping address. Phone collection is required for international delivery and optional for domestic delivery unless the carrier requires it. Payment card and delivery details are not stored by the shop database or browser basket. Fulfil orders through the access-controlled Stripe Dashboard.

The backend enforces server prices, same-origin requests, bounded bodies, Turnstile, HMAC rate limits, signed webhooks, owner authorization and secure HttpOnly SameSite cookies. Separate test/live inventory and transactional reservations prevent overselling. A browser return is never proof of payment. Refunds do not replenish edition numbers.

Order references, hashed owner tokens and Stripe identifiers remain access-controlled data even without direct delivery details. Do not log raw payloads or export customer address lists. D1 provides encryption at rest and in transit; Stripe and authorized fulfilment staff can still access necessary delivery data. This is not end-to-end encryption. Follow the published privacy notice and applicable retention requirements, including shipping-label disposal and backup handling.

Ambiguous Stripe creation failures retain reservations. Retries use stable idempotency keys; requests older than the safe retry window require review. Locate the exact order in Stripe using `shop_order_id` metadata and reconcile it. Never manually release a potentially paid edition. Webhook retries and scheduled reconciliation must remain operational after sales open.

## Crypto

BTC, USDC and on-chain editions remain unavailable. A receiving wallet alone does not provide checkout verification. Any future provider must integrate with the same inventory reservations, validate network/token and payment state, and define invoice expiry and exchange rules before becoming available.

## Public policies

Standalone `/privacy.html` and `/terms.html` pages are linked from the site sidebar, shop and checkout. They include merchant contact details, data handling and browser storage, privacy requests, delivery timing, and final-sale terms subject to mandatory consumer rights. No specific packaging format is promised publicly.

Before opening orders, verify these notices against the actual provider configuration and fulfilment process; establish retention/deletion and privacy incident procedures, review transfers outside Québec, confirm delivery estimates, and ensure the customer receives a durable copy of the complete order contract within the applicable deadline (Québec distance contracts: 15 days). A Stripe payment receipt alone may not contain all required contract information. Public policy text does not establish that these operational steps are complete.

### Public contact privacy

Public studio contact is `collect@lemonhaze.com` and Montréal, Canada only. Never publish personal phone numbers, residential street addresses or residential postal codes in site content, bundled code, documentation, Git commits or deployment metadata. Any necessary private billing or registration data stays in the relevant provider’s private settings.

## Reservation abuse and payment review

Checkout holds expire after 30 minutes. Atomic database triggers cap a network at two active orders, six active units across baskets, and ten created orders in a rolling 24 hours, independently of browser cookies. The network identifier is an HMAC of the edge-provided IP using `SHOP_RATE_SECRET`; raw IP addresses are not stored. The maintenance job removes terminal-order network hashes after 30 days. Shared networks share these caps; distributed abuse still requires monitoring and potentially edge rules.

Payment verification failures latch `needs_review=1` and create a durable `shop_review_alerts` outbox record. The maintenance worker sends pending alerts to `SHOP_ALERT_URL` with `SHOP_ALERT_TOKEN` as a bearer credential, using HTTPS without redirects. Install both as Pages secrets. An external alert receiver is optional and is not currently configured; do not claim email alerts are active. Payloads contain only an order reference and reason, which remain private operational data. The receiver must deduplicate by order ID. Delivery is retried until an HTTP success response; this requires an actually deployed worker and monitored receiver.

Review orders in the private Stripe Dashboard, reconcile the exact order and payment, and resolve the issue before clearing the review flag. A delivered alert is not a resolved case. Never release a possibly paid allocation or fulfil an unverified payment. Monitor worker errors separately from individual review alerts.

## Other security controls

The shop and policy routes enforce anti-framing, base, object and form restrictions. A stricter script/resource policy is initially report-only for compatibility monitoring; do not describe it as fully enforced XSS protection. App entry pages also prevent framing to cover client-side navigation into the shop. Standalone lab, visualizer and third-party artwork routes remain embeddable. HTTPS responses add HSTS without enabling subdomain or preload commitments.

The content lab requires a private password of at least 32 characters, HMAC verification, ten requests per network per hour, and global limits of 20 generation attempts per day and 200 per fixed 30-day window. These are request budgets, not monetary provider spending limits. Set a separate provider spending limit. Missing protection settings fail closed. Never publish the password or put it in client source.

## Order monitoring

The maintenance worker runs every ten minutes, including while sales are closed. Its authenticated endpoint checks up to ten outstanding sessions per run against Stripe, retains uncertain inventory, retries a configured review-alert receiver, and records a private `shop_monitor` heartbeat. A database lease prevents overlapping invocations. Failed calls and stale heartbeats require investigation. Review flags remain latched until a human resolves them.

`node scripts/shop-monitor.mjs` reads a minimal production snapshot through authenticated Cloudflare access: paid/review order references, unresolved count and heartbeat only. It never fetches customer names, addresses, emails or card data. The Codex hourly follow-up checks for newly paid orders, new review cases and a failed/stale heartbeat (30-minute threshold). It relies on the local Codex application, computer availability and Cloudflare login; it is not an always-on email delivery service. The cloud reconciliation job runs independently.

For a new paid order, open Stripe privately, locate its `shop_order_id`, confirm payment and review status, then prepare the correct edition and certificate. Delivery information stays in Stripe. Record fulfilment and tracking through the chosen private workflow; this monitor does not buy labels, send shipping emails or mark orders shipped. Never fulfil a review-required order until resolved.

Display hardening follow-up: IPv6 reservation limits use a /64 network bucket before HMAC hashing. See `SHOP-AUDIT.md` for local report fixes and remaining retained-history cleanup.
