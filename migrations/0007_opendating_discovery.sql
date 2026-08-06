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
