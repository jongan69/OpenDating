-- 0002_tag_indexes.sql
-- Multi-value tag cache table for efficient tag queries.

CREATE TABLE IF NOT EXISTS event_tags_cache_multi (
  event_id TEXT NOT NULL,
  pubkey TEXT NOT NULL,
  kind INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  tag_type TEXT NOT NULL CHECK(tag_type IN ('p', 'e', 'a', 't', 'd', 'r', 'L', 's', 'u')),
  tag_value TEXT NOT NULL,
  PRIMARY KEY (event_id, tag_type, tag_value)
);

CREATE INDEX IF NOT EXISTS idx_cache_multi_type_value_time ON event_tags_cache_multi(tag_type, tag_value, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_multi_type_value_event ON event_tags_cache_multi(tag_type, tag_value, event_id);
CREATE INDEX IF NOT EXISTS idx_cache_multi_kind_type_value ON event_tags_cache_multi(kind, tag_type, tag_value, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cache_multi_event_id ON event_tags_cache_multi(event_id);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '2');
