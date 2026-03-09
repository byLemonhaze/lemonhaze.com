# lemonhaze.com Data Sources

## Canonical Sources

| Source | Location | Used For |
|---|---|---|
| Provenance JSON (primary) | `https://cdn.lemonhaze.com/assets/assets/provenance.json` | Primary artwork metadata feed |
| Provenance JSON (secondary) | `https://cdn.lemonhaze.com/assets/provenance.json` | Fallback artwork metadata feed |
| Provenance JSON (local fallback) | `/data/provenance.json` | Local/offline fallback served from this repo |
| BEST BEFORE collection feed | `https://bestbefore.space/magic_eden_collection.json` | Live BEST BEFORE roster and high-resolution image URLs |
| BEST BEFORE live state | `https://bestbefore.space/best-before.json` | Status, phase, lifespan, and palette data per inscription |
| Hiro inscriptions API | `https://api.hiro.so/ordinals/v1/inscriptions/<id>` | Inscription number, timestamp, sat rarity, owner fallback |
| Ordinals inscription JSON | `https://ordinals.com/r/inscription/<id>` | Owner/address enrichment for modal metadata |
| Ordinals content | `https://ordinals.com/content/<id>` | Direct rendering of HTML and on-chain media |
| BTC/USD spot | `https://api.coinbase.com/v2/prices/BTC-USD/spot` | Approximate fiat conversion for displayed sale prices |
| Historical sales sheet | `/data/sales-master/historical-sales-sheet.json` | Canonical browser-facing sales ledger with explicit primary/secondary classification |
| Historical sales sheet CSV | `/data/sales-master/historical-sales-sheet.csv` | Human-readable export of the same canonical ledger |
| Generated sales index (legacy bootstrap input) | `/data/sales-master/by-inscription.json` | Legacy inscription-level rebuild input for historical-sheet bootstrapping |
| Generated bundle sales index (legacy bootstrap input) | `/data/sales-master/original-bundle-sales.json` | Legacy bundle-sale rebuild input for historical-sheet bootstrapping |

## Repo-Managed Data

### Curated Content

`src/data.js` and `src/data/*` hold:

- chronology by year
- collection descriptions
- career highlights
- supply tables
- market links
- media items
- blog post content

These files are editorial source code, not mirrored external data.

### Sales Working Data

`data/sales-master/` is the script-side workspace for market-history generation:

- `collections/*.json` stores per-collection sale events
- `master-of-sales.json` stores merged aggregate data
- `original-bundle-sales.json` stores bundle-level sale mapping

`public/data/sales-master/historical-sales-sheet.json` is the current canonical static ledger that the browser reads.

Manual updates should be made to the historical sheet directly until automated marketplace ingestion returns.

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

## Special Rules

- BEST BEFORE is intentionally live and overrides its corresponding provenance rows at runtime.
- Some collections are rendered directly from on-chain HTML/media instead of static CDN imagery.
- Sales data is a curated static ledger for UI context; it should not be treated as a complete chain-indexing backend.

## Future State

`db/migrations/0001_sales_index.sql` defines a D1/SQLite schema for a future structured sales backend. It is documentation/scaffolding at the moment, not an active production dependency.
