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
