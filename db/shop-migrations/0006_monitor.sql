-- Operational timestamps and counts only; never customer or payment details.
CREATE TABLE shop_monitor (
 mode TEXT PRIMARY KEY CHECK(mode IN ('test','live')),
 started_at INTEGER NOT NULL,
 finished_at INTEGER,
 status TEXT NOT NULL,
 checked INTEGER NOT NULL DEFAULT 0,
 needs_review INTEGER NOT NULL DEFAULT 0,
 delivered INTEGER NOT NULL DEFAULT 0,
 alerts_configured INTEGER NOT NULL DEFAULT 0
);
