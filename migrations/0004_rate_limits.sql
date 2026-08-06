-- 0004_rate_limits.sql
-- Schema version bump for rate limiting infrastructure.
-- No new tables needed — rate limiting is in-memory with Durable Objects.
-- This migration reserves the version for future rate-limit persistence if needed.

INSERT OR REPLACE INTO system_config (key, value) VALUES ('schema_version', '4');
