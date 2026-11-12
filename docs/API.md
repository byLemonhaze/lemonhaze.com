# API inventory

Reviewed against the November 11, 2026 application release. Cloudflare Pages Functions are under `functions/api/`; most of the catalogue and editorial content is static data, not an API. [Architecture](ARCHITECTURE.md) · [Shop details](SHOP.md).

## Endpoint map

| Endpoint | Method | Purpose / access |
| --- | --- | --- |
| `/api/inscription-metadata?inscription_id=<id>` | GET | Legacy metadata compatibility endpoint |
| `/api/market-watch/snapshot` | GET | Public saved market observations |
| `/api/market-watch/scan` | POST | Bounded refresh of known market sources |
| `/api/press-engine` | POST | Private password-protected content generation |
| `/api/shop/config` | GET | Storefront availability and public checkout configuration |
| `/api/shop/checkout` | POST | Owner-bound reservation/Stripe session; currently gated closed |
| `/api/shop/order` | GET | Authorized visitor’s order status |
| `/api/shop/cancel` | POST | Authorized existing-order cancellation/reconciliation |
| `/api/shop/webhook` | POST | Stripe-signed payment notifications |
| `/api/shop/maintenance` | POST | Private bearer-authorized reconciliation job |

## Legacy inscription metadata

`inscription_id` must be a valid inscription ID with its trailing `iN`; malformed requests return 400. The endpoint retains its Hiro upstream and normalized `address`, `number`, `genesis_timestamp`, `sat_rarity`, `source` and `warning` fields. It is a compatibility endpoint, **not** the current artwork viewer’s live source. The viewer uses the Ordinals-backed client module. Do not infer an owner or burn status from unavailable upstream data.

## Market Watch

`GET /api/market-watch/snapshot` returns known collections and saved per-market observations. Refresh examples:

```json
{ "discover": true }
```

```json
{ "key": "manufactured-by-lemonhaze", "market": "ord" }
```

Supported market identifiers are `ord`, `gamma`, `satflow` and `ow`. Sources are resolved server-side from the catalogue; visitors cannot submit arbitrary upstream URLs. Cross-origin browser scan requests are rejected. `MARKET_WATCH_DB` stores shared snapshots and five-minute refresh leases. Failed scans retain older data with stale/error context; Satflow throttling returns a cooldown. These endpoints do not connect wallets, place orders or execute purchases.

## Private Press Engine

Supply `x-press-password` and a JSON body. `{ "action": "auth" }` is an authentication check; generation accepts `type`, optional `collection` and optional `context`. Supported types include statement, collection, press, blog, caption, interview and bio. Generation streams `text/plain`; auth returns `{ "ok": true }`.

Required private settings: `PRESS_ENGINE_PASSWORD` (at least 32 characters), `CLAUDE_API_KEY`, `SHOP_RATE_SECRET` and the `SHOP_DB` binding. Origin, bounded-body, authentication, network-rate and global generation budgets are enforced by `server/press-security.js`. Missing protection/provider configuration fails closed (503); unauthorized/rate-limited input is rejected, and provider failure returns 502. Request budgets are not a substitute for a provider spending cap. Never expose these values in `VITE_*`, documentation, screenshots or examples.

## Shop backend

`functions/api/shop/[[path]].ts` delegates to `server/shop/handler.js`. Public configuration currently reports `available: false` / `comingSoon: true`. New checkout is rejected before reservations or Stripe calls while `SHOP_STOREFRONT_OPEN` is false. The independent build-time storefront gate also remains closed.

The implemented backend validates server-owned product IDs/prices, destination, visitor ownership, same-origin requests, Turnstile, rate limits and transactional inventory. Status/cancel access is restricted to the visitor’s order. Stripe webhooks require signature verification; a browser redirect does not prove payment. Webhooks, authorized existing-order operations and maintenance remain available while new sales are closed.

Maintenance requires a private bearer token; invalid/missing authorization is concealed with 404. Production configuration, readiness, migrations, recovery and monitoring are documented in [SHOP.md](SHOP.md). This inventory is not permission to submit test purchases to production or open sales.
