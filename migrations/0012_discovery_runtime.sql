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
