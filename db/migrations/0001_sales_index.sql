-- Phase 1 Sales Index schema (D1 / SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sales_events (
    event_id TEXT PRIMARY KEY,
    inscription_id TEXT NOT NULL,
    collection_slug TEXT,
    ts_utc TEXT NOT NULL,
    tx_id TEXT,
    block_height INTEGER,
    price_sats INTEGER NOT NULL,
    price_btc REAL,
    marketplace TEXT,
    from_wallet TEXT,
    to_wallet TEXT,
    source_kind TEXT NOT NULL DEFAULT 'satflow',
    raw_json TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sales_events_inscription ON sales_events(inscription_id);
CREATE INDEX IF NOT EXISTS idx_sales_events_collection_ts ON sales_events(collection_slug, ts_utc DESC);
CREATE INDEX IF NOT EXISTS idx_sales_events_tx ON sales_events(tx_id);

CREATE TABLE IF NOT EXISTS manual_sales (
    manual_id TEXT PRIMARY KEY,
    inscription_id TEXT NOT NULL,
    ts_utc TEXT NOT NULL,
    tx_id TEXT,
    block_height INTEGER,
    price_sats INTEGER NOT NULL,
    price_btc REAL,
    from_wallet TEXT,
    to_wallet TEXT,
    source_label TEXT NOT NULL DEFAULT 'private_manual',
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_manual_sales_inscription ON manual_sales(inscription_id);
CREATE INDEX IF NOT EXISTS idx_manual_sales_ts ON manual_sales(ts_utc DESC);

CREATE TABLE IF NOT EXISTS sync_state (
    collection_slug TEXT PRIMARY KEY,
    last_cursor_ts TEXT,
    last_cursor_tx TEXT,
    last_success_at TEXT,
    status TEXT,
    last_error TEXT,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sync_runs (
    run_id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    request_count INTEGER NOT NULL DEFAULT 0,
    insert_count INTEGER NOT NULL DEFAULT 0,
    update_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    note TEXT
);
