# lemonhaze.com API

This repo currently exposes two Cloudflare Pages Function endpoints under `functions/api/`.

## `GET /api/inscription-metadata`

### Purpose

Returns a normalized metadata payload for a single inscription id.

### Query Params

- `inscription_id` (required): Ordinals inscription id, including the trailing `iN`

### Response Shape

```json
{
  "address": "bc1...",
  "number": 123456,
  "genesis_timestamp": "2025-01-01T00:00:00.000Z",
  "sat_rarity": "uncommon",
  "source": "hiro",
  "warning": ""
}
```

### Notes

- Returns `400` when `inscription_id` is missing or malformed.
- Uses Hiro as the primary upstream source.
- Returns warning flags instead of hard-failing when owner data is unavailable.

## `POST /api/press-engine`

### Purpose

Private content-generation endpoint used by the on-site Press Engine.

### Auth

Requires the request header:

```text
x-press-password: <PRESS_ENGINE_PASSWORD>
```

### Request Body

```json
{
  "type": "statement",
  "collection": "BEST BEFORE",
  "context": "Optional extra direction"
}
```

### Supported Modes

- Auth ping:

```json
{
  "action": "auth"
}
```

- Content generation:
  - `type`: one of `statement`, `collection`, `press`, `blog`, `caption`, `interview`, `bio`
  - `collection`: optional collection focus
  - `context`: optional extra direction or constraints

### Response Behavior

- Auth ping returns JSON: `{ "ok": true }`
- Content generation returns a streamed `text/plain` response

### Required Environment Variables

- `PRESS_ENGINE_PASSWORD`
- `CLAUDE_API_KEY`

### Failure Modes

- `401` for missing/incorrect password
- `500` when `CLAUDE_API_KEY` is not configured
- `502` when the upstream generation request fails
