-- 0001_base.sql
-- Base schema for the Nostr relay.
-- Creates the core events, tags, and system config tables.

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  pubkey TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  kind INTEGER NOT NULL,
  tags TEXT NOT NULL,
  content TEXT NOT NULL,
  sig TEXT NOT NULL,
  created_timestamp INTEGER DEFAULT (strftime('%s', 'now')),
  tag_p TEXT,
  tag_e TEXT,
  tag_a TEXT,
  tag_t TEXT,
  tag_d TEXT,
  tag_r TEXT,
  tag_L TEXT,
  tag_s TEXT,
  tag_u TEXT,
  reply_to_event_id TEXT,
  root_event_id TEXT,
  content_preview TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_kind_created_at ON events(kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_pubkey_created_at ON events(pubkey, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_pubkey_kind_created_at ON events(pubkey, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_kind_pubkey_created_at ON events(kind, pubkey, created_at DESC);

CREATE TABLE IF NOT EXISTS tags (
  event_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  tag_value TEXT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_name_value_event ON tags(tag_name, tag_value, event_id);
CREATE INDEX IF NOT EXISTS idx_tags_event_id ON tags(event_id);

-- Insert schema version
INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '1');
INSERT OR REPLACE INTO system_config (key, value) VALUES ('db_initialized', '1');

PRAGMA foreign_keys = ON;
