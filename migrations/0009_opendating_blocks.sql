-- 0009_opendating_blocks.sql
-- Private blocking, unmatching, and portable block lists.

CREATE TABLE IF NOT EXISTS od_blocks (
  blocker_member_id TEXT NOT NULL REFERENCES od_members(member_id),
  blocked_member_id TEXT NOT NULL,
  block_type TEXT NOT NULL DEFAULT 'block', -- block
  reason TEXT,                              -- Encrypted reason (optional)
  created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_member_id, blocked_member_id)
);

CREATE INDEX IF NOT EXISTS idx_od_blocks_blocker ON od_blocks(blocker_member_id);
CREATE INDEX IF NOT EXISTS idx_od_blocks_blocked ON od_blocks(blocked_member_id);

-- Unmatch records
CREATE TABLE IF NOT EXISTS od_unmatches (
  unmatch_id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES od_matches(match_id),
  initiator_member_id TEXT NOT NULL,
  target_member_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(match_id, initiator_member_id)
);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '9');
