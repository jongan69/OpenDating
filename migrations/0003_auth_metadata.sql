-- 0003_auth_metadata.sql
-- Payment tracking and content hash tables for anti-spam.

CREATE TABLE IF NOT EXISTS paid_pubkeys (
  pubkey TEXT PRIMARY KEY,
  paid_at INTEGER NOT NULL,
  amount_sats INTEGER,
  created_timestamp INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS content_hashes (
  hash TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  pubkey TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_hashes_pubkey ON content_hashes(pubkey);
CREATE INDEX IF NOT EXISTS idx_content_hashes_created_at ON content_hashes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_hashes_pubkey_created ON content_hashes(pubkey, created_at DESC);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '3');
