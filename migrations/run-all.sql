-- run-all.sql — every migration in order.
-- Referenced by `npm run db:migrate:local` / `db:migrate:remote`, which
-- were broken because this file did not exist. Regenerate after adding a
-- migration with: npm run db:migrate:build

-- ============================================================
-- 0001_base.sql
-- ============================================================
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

-- ============================================================
-- 0002_tag_indexes.sql
-- ============================================================
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

-- ============================================================
-- 0003_auth_metadata.sql
-- ============================================================
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

-- ============================================================
-- 0004_rate_limits.sql
-- ============================================================
-- 0004_rate_limits.sql
-- Schema version bump for rate limiting infrastructure.
-- No new tables needed — rate limiting is in-memory with Durable Objects.
-- This migration reserves the version for future rate-limit persistence if needed.

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '4');

-- ============================================================
-- 0005_opendating_core.sql
-- ============================================================
-- 0005_opendating_core.sql
-- OpenDating protocol core tables.
-- Only creates what V0.1 needs: idempotency tracking.

CREATE TABLE IF NOT EXISTS od_idempotency (
  service_pubkey TEXT NOT NULL,
  sender_pubkey TEXT NOT NULL,
  request_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (service_pubkey, sender_pubkey, request_id)
);

CREATE INDEX IF NOT EXISTS idx_od_idempotency_expires
  ON od_idempotency(expires_at);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '5');

-- ============================================================
-- 0006_opendating_membership.sql
-- ============================================================
-- 0006_opendating_membership.sql
-- OpenDating membership and private profiles.

-- Pseudonymous member IDs (sha256 hash of pubkey + relay salt)
-- This allows referencing members without exposing raw pubkeys in every query.
CREATE TABLE IF NOT EXISTS od_members (
  member_id TEXT PRIMARY KEY,          -- SHA-256(pubkey || salt)
  pubkey TEXT NOT NULL UNIQUE,         -- Nostr hex pubkey
  state TEXT NOT NULL DEFAULT 'active', -- active | paused | deleted
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_od_members_pubkey ON od_members(pubkey);
CREATE INDEX IF NOT EXISTS idx_od_members_state ON od_members(state);

-- Private dating profiles.
-- Profile content is encrypted (stored as kind 30078 events in the relay).
-- This table holds membership metadata and visibility controls.
CREATE TABLE IF NOT EXISTS od_profiles (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  profile_event_id TEXT,               -- Latest profile kind 30078 event ID
  display_name_hash TEXT,              -- Hash for duplicate display name detection
  age_range_encrypted TEXT,            -- Encrypted age/DOB verification data
  visibility TEXT NOT NULL DEFAULT 'discoverable', -- discoverable | hidden | paused
  gender_interest TEXT,                -- Encrypted gender/interest preferences
  paused_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_od_profiles_visibility ON od_profiles(visibility);
CREATE INDEX IF NOT EXISTS idx_od_profiles_updated ON od_profiles(updated_at);

-- Profile media references (R2 keys, not the media itself).
CREATE TABLE IF NOT EXISTS od_profile_media (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES od_members(member_id),
  r2_key TEXT NOT NULL,                -- R2 object key
  media_type TEXT NOT NULL DEFAULT 'photo', -- photo
  position INTEGER NOT NULL DEFAULT 0, -- Display order
  content_hash TEXT,                   -- SHA-256 for dedup/abuse detection
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(member_id, position)
);

CREATE INDEX IF NOT EXISTS idx_od_profile_media_member ON od_profile_media(member_id);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '6');

-- ============================================================
-- 0007_opendating_discovery.sql
-- ============================================================
-- 0007_opendating_discovery.sql
-- Private location + discovery infrastructure.
-- Stores coarse geohash buckets (NOT exact GPS), discovery preferences, and candidate grants.

CREATE TABLE IF NOT EXISTS od_locations (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  geohash_prefix TEXT NOT NULL,         -- Coarse geohash only (e.g., 3-4 chars, ~100km-20km precision)
  geohash_prefix_short TEXT NOT NULL,   -- Even coarser (2 chars, ~1000km)
  country_code TEXT,                     -- ISO country code
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_od_locations_prefix ON od_locations(geohash_prefix);
CREATE INDEX IF NOT EXISTS idx_od_locations_prefix_short ON od_locations(geohash_prefix_short);

-- Discovery preferences (encrypted age range, gender interest, max distance)
CREATE TABLE IF NOT EXISTS od_discovery_prefs (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  max_distance_km INTEGER NOT NULL DEFAULT 100,   -- Coarse distance buckets
  min_age INTEGER NOT NULL DEFAULT 18,
  max_age INTEGER NOT NULL DEFAULT 99,
  intent TEXT NOT NULL DEFAULT 'dating',           -- dating | friendship | all
  updated_at INTEGER NOT NULL
);

-- Candidate grants (anti-enumeration: users only see candidates they've been granted)
CREATE TABLE IF NOT EXISTS od_candidate_grants (
  viewer_id TEXT NOT NULL,               -- Who can see
  candidate_id TEXT NOT NULL,            -- Who they can see
  grant_type TEXT NOT NULL DEFAULT 'discovery', -- discovery | like_received | match
  distance_bucket TEXT NOT NULL,         -- Coarse: near | medium | far | very_far
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,                    -- Grants expire and must be refreshed
  PRIMARY KEY (viewer_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_od_candidate_grants_viewer ON od_candidate_grants(viewer_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_od_candidate_grants_candidate ON od_candidate_grants(candidate_id);

-- Discovery quotas (anti-scraping)
CREATE TABLE IF NOT EXISTS od_discovery_quotas (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  daily_candidates_served INTEGER NOT NULL DEFAULT 0,
  daily_reset_at INTEGER NOT NULL,
  total_candidates_served INTEGER NOT NULL DEFAULT 0
);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '7');

-- ============================================================
-- 0008_opendating_intents.sql
-- ============================================================
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

-- ============================================================
-- 0009_opendating_blocks.sql
-- ============================================================
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

-- ============================================================
-- 0010_opendating_moderation.sql
-- ============================================================
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

-- ============================================================
-- 0011_prd_schema_alignment.sql
-- ============================================================
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

-- ============================================================
-- 0012_discovery_runtime.sql
-- ============================================================
-- 0012_discovery_runtime.sql
-- Restores the runtime tables discovery needs.
--
-- 0011 replaced od_locations + od_discovery_prefs with the denormalised
-- od_discovery_index, and dropped od_discovery_quotas along with them. The
-- quota table has no replacement in 0011 but is still required for daily
-- rate limiting, and the discovery service was left querying three tables
-- that no longer exist. Nobody noticed because no service identity was ever
-- loaded for discovery, so the code path never ran.

-- Daily discovery quota per member.
CREATE TABLE IF NOT EXISTS od_discovery_quotas (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  daily_candidates_served INTEGER NOT NULL DEFAULT 0,
  daily_likes_sent INTEGER NOT NULL DEFAULT 0,
  daily_reset_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Candidate grants: who a viewer is currently allowed to see.
-- Recreated with the columns the runtime actually needs — 0007's version had
-- no grant token and no source cell, so a grant could not be verified when it
-- came back on a like, nor explained when debugging a bad match radius.
DROP TABLE IF EXISTS od_candidate_grants;
CREATE TABLE od_candidate_grants (
  viewer_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  grant_token TEXT NOT NULL,             -- Opaque token echoed back on intent.like
  grant_type TEXT NOT NULL DEFAULT 'discovery', -- discovery | like_received | match
  distance_bucket TEXT NOT NULL,         -- nearby | within 5 mi | 5-10 mi | 10-25 mi | 25+ mi
  geo_precision INTEGER,                 -- Geohash precision the match came from (5|4|3)
  granted_at INTEGER NOT NULL,
  expires_at INTEGER,
  PRIMARY KEY (viewer_id, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_od_candidate_grants_viewer ON od_candidate_grants(viewer_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_od_candidate_grants_candidate ON od_candidate_grants(candidate_id);
CREATE INDEX IF NOT EXISTS idx_od_candidate_grants_token ON od_candidate_grants(grant_token);

-- Discovery preferences: what the viewer wants to see.
-- od_visibility_prefs (0011) holds who may see *me*; this holds who *I* want
-- shown. They are different directions and cannot share a row.
CREATE TABLE IF NOT EXISTS od_discovery_prefs (
  member_id TEXT PRIMARY KEY REFERENCES od_members(member_id),
  age_min INTEGER NOT NULL DEFAULT 18,
  age_max INTEGER NOT NULL DEFAULT 99,
  max_distance_km INTEGER NOT NULL DEFAULT 100,
  genders TEXT,                          -- JSON array of gender categories
  intent TEXT,                           -- long_term|short_term|friendship|figuring_out
  updated_at INTEGER NOT NULL
);

-- Seen ledger: a pass must not resurface the same person on the next page.
-- Grants are deleted as they are consumed, so this is what makes a pass stick.
CREATE TABLE IF NOT EXISTS od_seen_candidates (
  viewer_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  seen_at INTEGER NOT NULL,
  PRIMARY KEY (viewer_id, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_od_seen_viewer ON od_seen_candidates(viewer_id, seen_at);

-- Supports the p3 (widest radius) fallback scan.
CREATE INDEX IF NOT EXISTS idx_od_di_geo_p3_visible ON od_discovery_index(geo_cell_p3, visible);

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '12');

