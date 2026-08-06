-- 0010_opendating_moderation.sql
-- Private reports, moderation cases, actions, and RBAC.

CREATE TABLE IF NOT EXISTS od_reports (
  report_id TEXT PRIMARY KEY,
  reporter_member_id TEXT NOT NULL,
  subject_member_id TEXT NOT NULL,
  report_type TEXT NOT NULL,              -- harassment | scam | catfish | underage | other
  description_encrypted TEXT,             -- Encrypted description
  evidence_event_ids TEXT,                -- JSON array of event IDs (NIP-56-compatible)
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  state TEXT NOT NULL DEFAULT 'pending',  -- pending | investigating | resolved | dismissed
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_od_reports_subject ON od_reports(subject_member_id);
CREATE INDEX IF NOT EXISTS idx_od_reports_state ON od_reports(state);

-- Moderation actions (immutable — append-only)
CREATE TABLE IF NOT EXISTS od_moderation_actions (
  action_id TEXT PRIMARY KEY,
  report_id TEXT REFERENCES od_reports(report_id),
  moderator_pubkey TEXT NOT NULL,         -- Which moderator took action
  action_type TEXT NOT NULL,              -- warn | quarantine | suspend | ban | dismiss
  target_member_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  duration_seconds INTEGER,               -- NULL = permanent
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_od_mod_actions_target ON od_moderation_actions(target_member_id);
CREATE INDEX IF NOT EXISTS idx_od_mod_actions_moderator ON od_moderation_actions(moderator_pubkey);

-- Moderator roles
CREATE TABLE IF NOT EXISTS od_moderators (
  pubkey TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'moderator', -- moderator | admin
  added_by TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Suspension/bans
CREATE TABLE IF NOT EXISTS od_sanctions (
  target_member_id TEXT PRIMARY KEY,
  sanction_type TEXT NOT NULL,            -- suspended | banned
  reason TEXT NOT NULL,
  expires_at INTEGER,                     -- NULL = permanent
  created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL
);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '10');
