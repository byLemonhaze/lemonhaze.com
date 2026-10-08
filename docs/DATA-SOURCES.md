# lemonhaze.com Data Sources

## Canonical Sources

| Source | Location | Used For |
|---|---|---|
| Provenance JSON (primary) | `https://cdn.lemonhaze.com/assets/assets/provenance.json` | Primary artwork metadata feed |
| Provenance JSON (local fallback) | `/data/provenance.json` | Local/offline fallback served from this repo |
| Featured collection manifests | `/data/collections/*.json` | Ordered inscription rosters and curated metadata for Satoshi, Deprivation prints, Mirage prints, the prints trilogy, Griffintown, Liminality, and Eclosion |
| BEST BEFORE collection feed | `https://bestbefore.space/magic_eden_collection.json` | Live BEST BEFORE roster and high-resolution image URLs |
| BEST BEFORE live state | `https://bestbefore.space/best-before.json` | Status, phase, lifespan, and palette data per inscription |
| Ordinals inscription JSON | `https://ordinals.com/r/inscription/<id>` | Live owner/address, inscription number, timestamp and charms for modal metadata |
| Ordinals content | `https://ordinals.com/content/<id>` | Direct rendering of HTML and on-chain media |
| BTC/USD spot | `https://api.coinbase.com/v2/prices/BTC-USD/spot` | Approximate fiat conversion for displayed sale prices |
| Ord.net collection pages and insights | `https://ord.net/collection/<slug>` and `https://ord.net/api/collections/<slug>/insights?activityFilter=sale` | Public collection volume, recent sale transaction, indexer-reported BTC price, sale-time USD, and transaction ID |
| Satflow collection charts | `https://memflow.satflow.com/api/v1/charts?...` | Marketplace, inscription ID, timestamp, and settlement amount cross-check |
| Lemonhaze GIGA thread | `https://x.com/Ordinals10K/status/1774602439666078205?s=20` | Artist-authored collection medium and creation-tool notes |
| Gamma print pages | `https://gamma.io/ordinals/prints/<id>/details` | Print launch and collection references |
| Historical sales sheet | `/data/sales-master/historical-sales-sheet.json` | Canonical browser-facing sales ledger with explicit primary/secondary classification |
| Historical sales sheet CSV | `/data/sales-master/historical-sales-sheet.csv` | Human-readable export of the same canonical ledger |
| Generated sales index (legacy bootstrap input) | `/data/sales-master/by-inscription.json` | Legacy inscription-level rebuild input for historical-sheet bootstrapping |
| Generated bundle sales index (legacy bootstrap input) | `/data/sales-master/original-bundle-sales.json` | Legacy bundle-sale rebuild input for historical-sheet bootstrapping |

## Repo-Managed Data

### Curated Content

`src/data.js` and `src/data/*` hold:

- chronology by year
- collection descriptions
- collection creation methods, cited sources, and documented primary prices
- career highlights
- supply tables
- market links
- media items
- blog post content

These files are editorial source code, not mirrored external data.

`src/data/featured-collections.js` normalizes the repo-managed collection manifests into the same artwork shape as provenance data. Their array order is intentional: it preserves official inscription-number order. Satoshi includes its WebP original followed by 110 recursive SVG editions; the three print manifests contain editions only. Griffintown renders its interactive HTML directly from the chain; Liminality and Eclosion include curated metadata and local grid previews while their HTML remains live on-chain. Lineage links connect recursive editions back to their source inscription.

### Sales Working Data

`data/sales-master/` is the script-side workspace for market-history generation:

- `collections/*.json` stores per-collection sale events
- `master-of-sales.json` stores merged aggregate data
- `original-bundle-sales.json` stores bundle-level sale mapping

`public/data/sales-master/historical-sales-sheet.json` is the current canonical static ledger that the browser reads.

Manual updates should be made to the historical sheet directly until automated marketplace ingestion returns.

`npm run sales:ordnet:reconcile` reads every live Lemonhaze Ord.net collection, records the current collection-volume coverage, and appends only sale events not already represented by a documented primary or existing resale. It does not infer primary sales. The script may be run with `--from path/to/audit.json` to replay a saved audit deterministically.

## Sales Data Pipeline

The intended refresh flow is:

1. `npm run scrape:bis:sales`
2. `npm run sales:merge:manual`
3. `npm run sales:index`
4. `npm run sales:history:bootstrap`

### What Each Step Does

- `scrape:bis:sales` uses Playwright to extract sale rows from Best in Slot collection pages into `data/sales-master/collections/`.
- `sales:merge:manual` overlays known OTC/private/manual sales using provenance-aware rules.
- `sales:index` converts collection-level sales into a legacy inscription-keyed index used only as a bootstrap input.
- `sales:history:bootstrap` condenses the legacy inscription and bundle data into the canonical historical sales sheet.

After bootstrapping, ongoing edits should happen in `public/data/sales-master/historical-sales-sheet.json` instead of the legacy inputs. Re-running the bootstrap step will overwrite the current static ledger with a rebuild from the legacy files.

### Marketplace Reconciliation Rules

- Match the same trade by transaction ID when both feeds provide one.
- Otherwise match by inscription ID and timestamp within a 36-hour window, which accommodates legacy date-only ledger rows. Do not deduplicate using the displayed calendar date.
- Store timestamps as UTC and render sale dates in UTC. This prevents a late-evening Montreal trade from appearing as a different event when an indexer reports the following UTC date.
- Prefer a documented gross marketplace price when it is available. Keep a separate Satflow post-fee amount as `settlementPriceBTC`. Ord.net's public amount is stored as `priceBasis: "marketplace-indexed"` unless a gross source independently confirms it.
- Never infer a primary sale from inscription or transfer order. Primary totals include only manually documented sales and launch bundles.
- Primary launch bundles are counted once in recorded primary volume. Secondary aggregate roll-ups are excluded when their inscription-level trades are present.
- Print marketplace trades are secondary sales; their fixed launch price belongs to the separate primary bundle record and collection metadata.
- A saved Ord.net collection total is a secondary-volume coverage floor after documented primary volume is subtracted. This fills older indexer coverage without inventing individual trade records or lowering a higher documented resale total.

## Special Rules

- BEST BEFORE is intentionally live and overrides its corresponding provenance rows at runtime.
- The artwork modal no longer calls the retired Hiro Ordinals API. The legacy `/api/inscription-metadata` endpoint is not used by the modal and remains outside this change.
- Prerendered artwork pages describe unavailable live lookups neutrally; build-time network failures are not saved as permanent ownership facts.
- Some collections are rendered directly from on-chain HTML/media instead of static CDN imagery.
- Featured manifests render from their official on-chain content and remain available even when the primary CDN provenance feed has not yet been refreshed.
- Sales data is a curated static ledger for UI context; it should not be treated as a complete chain-indexing backend.

## Future State

`db/migrations/0001_sales_index.sql` defines a D1/SQLite schema for a future structured sales backend. It is documentation/scaffolding at the moment, not an active production dependency.


### Chrysalis (September 2026)

`public/data/collections/chrysalis.json` contains the parent and all seven children, in inscription order. Titles, reflections, collection description, technical facts, and 2304 × 3456 PNG dimensions were checked against the public inscription records and HTML backcards on 2026-09-30. Source: [parent and child roster](https://ordinals.com/inscription/fad67cc80b7b3560c0cc2c783d914ded158fcbda10ebba4fdee89b85ab4e290ci0). Each `grid_preview` uses the verified `https://cdn.lemonhaze.com/assets/assets/<inscriptionID>.png`; opening the artwork loads its original on-chain HTML, including the backcard and print export controls.

The burned parent remains in Provenance and leads the Chrysalis gallery. Supply counts it once: eight inscriptions, seven circulating works. The parent timestamp controls collection chronology. Original “A Day in The Life” text stays in the on-chain HTML, accessible through the HTML/source controls; it is not repeated in the modal. About and Reflection remain separate modal fields. The collection is also included in the Visualizer (four columns, two rows), static artwork pages, and sitemap. The artist supplied `https://ord.net/collection/chrysalis-by-lemonhaze` and requested that it appear in Supply & Marketplace ahead of the marketplace launch. Listing availability is not implied.

### Confabulation (October 2026)

`public/data/collections/confabulation.json` contains the parent and all six children in inscription order: Wernicke, Bonnet, Ganser, Capgras, Fregoli, and Korsakoff. Titles, definitions/reflections, technical facts, and parent links were checked against the [original parent](https://ordinals.com/inscription/788df6ca0f6fc0ddf32b363c4571dd77c42cdf1367365575815452dd050d2b86i0), its child roster, and each inscription's HTML on 2026-10-05. The collection description is the parent's own definition, without added editorial copy. Original diary writing remains in the inscription HTML.

Every preview uses the artist's `https://cdn.lemonhaze.com/assets/assets/<inscriptionID>.png`; PNG headers were checked for availability and dimensions. Ganser's preview is 3840 × 2160 and replaces the Untitled placeholder at position 02 in both landing and Selected Work. Artwork modals open the original HTML with its backcard and export controls.

The parent descends from Gentleman Nº1, stays in Provenance, and leads the Confabulation gallery. At verification, none of the seven inscriptions were burned; supply is seven inscribed and seven circulating. All Works, chronology, Visualizer, artwork routes, sitemap, and Market Watch titles include the collection. The Ord.net submission uses the requested slug `confabulation-by-lemonhaze`: [issue #1002](https://github.com/TheWizardsOfOrd/ordinals-collections/issues/1002). The submission contains only the collection name, type, parent, and slug; the marketplace link does not imply acceptance or listing availability.
