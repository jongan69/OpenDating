-- 0011_prd_schema_alignment.sql
-- Aligns schema with PRD §70-72: encrypted pubkeys, discovery index, report evidence,
-- appeals, verification claims, vanish tombstones, audit log.

-- Fix od_members: encrypted pubkeys (PRD §70-71), trust tier, last_active_bucket
DROP TABLE IF EXISTS od_members;
CREATE TABLE od_members (
  member_id TEXT PRIMARY KEY,
  encrypted_pubkey TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- onboarding|active|paused|limited|quarantined|suspended|banned|deleted
  trust_tier INTEGER NOT NULL DEFAULT 0, -- 0-3 (PRD §58)
  last_active_bucket TEXT,               -- 'recently'|'this_week' (PRD §96)
  protocol_version TEXT NOT NULL DEFAULT '0.1',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_od_members_status ON od_members(status);

-- Fix od_profiles: align with PRD §72
DROP TABLE IF EXISTS od_profiles;
CREATE TABLE od_profiles (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  profile_version INTEGER NOT NULL DEFAULT 1,
  encrypted_profile_payload TEXT,         -- NIP-44 encrypted profile JSON (PRD §21)
  age INTEGER,                            -- Normalized for filtering
  gender_category TEXT,                   -- Normalized for filtering
  relationship_intent TEXT,               -- long_term|short_term|friendship|all
  visibility_state TEXT NOT NULL DEFAULT 'discoverable',
  completeness INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Discovery index (PRD §72) — replaces old od_locations + od_discovery_prefs
DROP TABLE IF EXISTS od_discovery_index;
CREATE TABLE od_discovery_index (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  geo_cell_p5 TEXT,                       -- Geohash precision 5 (~5km) — max precision for discovery
  geo_cell_p4 TEXT,                       -- Geohash precision 4 (~20km)
  geo_cell_p3 TEXT,                       -- Geohash precision 3 (~100km)
  age INTEGER,
  gender_category TEXT,
  intent_category TEXT,
  visible INTEGER NOT NULL DEFAULT 0,     -- 0=hidden, 1=visible
  trust_tier INTEGER NOT NULL DEFAULT 0,
  activity_bucket TEXT,                   -- recently|this_week|this_month
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_od_di_geo_visible_age ON od_discovery_index(geo_cell_p5, visible, age, activity_bucket);
CREATE INDEX IF NOT EXISTS idx_od_di_geo_p4_visible ON od_discovery_index(geo_cell_p4, visible);

-- Drop old tables replaced by od_discovery_index
DROP TABLE IF EXISTS od_locations;
DROP TABLE IF EXISTS od_discovery_prefs;
DROP TABLE IF EXISTS od_discovery_quotas;

-- Visibility preferences (encrypted, PRD §72)
CREATE TABLE IF NOT EXISTS od_visibility_prefs (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  encrypted_policy TEXT,                  -- AES-GCM encrypted JSON
  verified_only INTEGER NOT NULL DEFAULT 0,
  age_min INTEGER,
  age_max INTEGER,
  distance_max_km INTEGER DEFAULT 100,
  updated_at INTEGER NOT NULL
);

-- Report evidence (PRD §72) — separate table for encrypted evidence blobs
CREATE TABLE IF NOT EXISTS od_report_evidence (
  evidence_id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES od_reports(report_id),
  r2_object_key TEXT,                    -- R2 key for evidence bundle
  key_version TEXT NOT NULL DEFAULT 'v1',
  sha256 TEXT,
  evidence_type TEXT NOT NULL,           -- cryptographic|media_hash|screenshot|user_statement
  created_at INTEGER NOT NULL
);

-- Appeals (PRD §54)
CREATE TABLE IF NOT EXISTS od_appeals (
  appeal_id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES od_moderation_actions(action_id),
  appellant_member_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|reviewed|upheld|modified|reversed
  reason TEXT,
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewer_pubkey TEXT
);

-- Verification claims (PRD §56)
CREATE TABLE IF NOT EXISTS od_verification_claims (
  claim_id TEXT PRIMARY KEY,
  subject_member_id TEXT NOT NULL REFERENCES od_members(member_id),
  issuer_pubkey TEXT NOT NULL,
  claim TEXT NOT NULL,                   -- human_verified|photo_verified|age_over_18|id_verified
  status TEXT NOT NULL DEFAULT 'active', -- active|expired|revoked
  issued_at INTEGER NOT NULL,
  expires_at INTEGER,
  proof_reference TEXT
);
CREATE INDEX IF NOT EXISTS idx_od_vc_subject ON od_verification_claims(subject_member_id, status);

-- Vanish tombstones (PRD §69, NIP-62)
CREATE TABLE IF NOT EXISTS od_vanish_tombstones (
  member_id TEXT PRIMARY KEY,
  cutoff_timestamp INTEGER NOT NULL,     -- Events before this are deleted
  request_hash TEXT,                     -- NIP-62 request hash
  created_at INTEGER NOT NULL
);

-- Audit log for moderation actions (PRD §90)
CREATE TABLE IF NOT EXISTS od_audit_log (
  audit_id TEXT PRIMARY KEY,
  actor_pubkey TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  before_state TEXT,
  after_state TEXT,
  timestamp INTEGER NOT NULL,
  metadata_redacted TEXT                 -- JSON with sensitive fields removed
);
CREATE INDEX IF NOT EXISTS idx_od_audit_actor ON od_audit_log(actor_pubkey, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_od_audit_resource ON od_audit_log(resource_type, resource_id);

-- Fix od_reports: add severity + evidence_strength (PRD §72)
-- These columns may already exist; add if not
-- (SQLite doesn't support ADD COLUMN IF NOT EXISTS, so use try/catch in migration runner)

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '11');
