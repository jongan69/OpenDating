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
