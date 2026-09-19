CREATE TABLE IF NOT EXISTS market_watch_snapshots (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS market_watch_leases (
  name TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
