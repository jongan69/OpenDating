-- 0008_opendating_intents.sql
-- Private likes (intents), matching, and match state.

CREATE TABLE IF NOT EXISTS od_intents (
  id TEXT PRIMARY KEY,                   -- Deterministic: SHA-256(from_pubkey || to_pubkey || type)
  from_member_id TEXT NOT NULL REFERENCES od_members(member_id),
  to_member_id TEXT NOT NULL,            -- Target (may not be a member yet)
  intent_type TEXT NOT NULL DEFAULT 'like', -- like
  state TEXT NOT NULL DEFAULT 'active',  -- active | revoked | expired | matched
  created_at INTEGER NOT NULL,
  expires_at INTEGER,                    -- Intents expire
  revoked_at INTEGER,
  UNIQUE(from_member_id, to_member_id, intent_type)
);

CREATE INDEX IF NOT EXISTS idx_od_intents_to ON od_intents(to_member_id, state);
CREATE INDEX IF NOT EXISTS idx_od_intents_from ON od_intents(from_member_id, state);

-- Matches (mutual likes)
CREATE TABLE IF NOT EXISTS od_matches (
  match_id TEXT PRIMARY KEY,             -- Deterministic: SHA-256(sorted([pubkey_a, pubkey_b]))
  member_a TEXT NOT NULL REFERENCES od_members(member_id),
  member_b TEXT NOT NULL REFERENCES od_members(member_id),
  state TEXT NOT NULL DEFAULT 'active',  -- active | unmatched_a | unmatched_b | blocked_a | blocked_b
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(member_a, member_b)
);

CREATE INDEX IF NOT EXISTS idx_od_matches_a ON od_matches(member_a, state);
CREATE INDEX IF NOT EXISTS idx_od_matches_b ON od_matches(member_b, state);

-- Match notifications (delivered via gift wrap)
CREATE TABLE IF NOT EXISTS od_match_notifications (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES od_matches(match_id),
  recipient_member_id TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'match_created', -- match_created | match_ended
  delivered INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_od_match_notif_recipient ON od_match_notifications(recipient_member_id, delivered);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '8');
