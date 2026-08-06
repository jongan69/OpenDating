/**
 * Safe default configuration values.
 *
 * These are the base defaults. Runtime environment variables or
 * operator policy in config.ts can override them.
 */

// Infrastructure profile
// "free" = optimized for Cloudflare free tier (5GB D1, 10ms CPU)
// "paid" = optimized for paid Workers plan
export const RELAY_INFRA_PROFILE: 'free' | 'paid' = 'free';

// ---------------------------------------------------------------------------
// Auth (NIP-42)
// ---------------------------------------------------------------------------
export const AUTH_REQUIRED = true;
export const AUTH_CHALLENGE_TIMEOUT_MS = 60_000; // 60 seconds

// ---------------------------------------------------------------------------
// Pay-to-relay
// ---------------------------------------------------------------------------
export const PAY_TO_RELAY_ENABLED = false; // Disabled by default for free relay access

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
export const RATE_LIMITS = {
  AUTH:        { rate: 10  / 60_000, capacity: 10  },  // 10 auth attempts/min/socket
  EVENT_PUBLIC:{ rate: 30  / 60_000, capacity: 30  },  // 30 events/min/pubkey
  EVENT_GIFTWRAP: { rate: 60 / 60_000, capacity: 60 }, // 60 gift wraps/min/auth-pubkey
  REQ:         { rate: 60  / 60_000, capacity: 60  },  // 60 req/min/auth-pubkey
  REQ_EXPENSIVE:{ rate: 10 / 60_000, capacity: 10  },  // 10 expensive req/min
  CONNECTION:  { rate: 5   / 60_000, capacity: 5   },  // 5 connections/min/IP
} as const;

// Backward-compatible exports for existing code
export const PUBKEY_RATE_LIMIT = RATE_LIMITS.EVENT_PUBLIC;
export const REQ_RATE_LIMIT = RATE_LIMITS.REQ;

// Event kinds excluded from rate limiting (empty by default - no blanket bypass)
export const excludedRateLimitKinds = new Set<number>([]);

// ---------------------------------------------------------------------------
// Query limits
// ---------------------------------------------------------------------------
export const DEFAULT_QUERY_LIMIT = 100;
export const HARD_QUERY_LIMIT = 500;
export const MAX_QUERY_COMPLEXITY = 1000;
export const MAX_FILTER_IDS = 5000;
export const MAX_SUBSCRIPTION_ID_LENGTH = 64;
export const CHUNK_SIZE = 500;

// ---------------------------------------------------------------------------
// Event size limits
// ---------------------------------------------------------------------------
export const MAX_EVENT_SIZE_BYTES = 70_000;
export const MAX_CONTENT_LENGTH = 65_000;
export const MAX_TAG_COUNT = 2000;
export const MAX_TAG_VALUE_LENGTH = 1024;
export const MAX_WEBSOCKET_MESSAGE_BYTES = 524_288;

// ---------------------------------------------------------------------------
// Event timestamp policy
// ---------------------------------------------------------------------------
export const MAX_FUTURE_DRIFT_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Database pruning
// ---------------------------------------------------------------------------
export const DB_PRUNING_ENABLED = true;

// Free-tier defaults (5GB D1 limit)
const FREE_PRUNE_THRESHOLD_GB = 4.0;
const FREE_PRUNE_TARGET_GB = 3.5;

// Paid-tier defaults (10GB D1 limit)
const PAID_PRUNE_THRESHOLD_GB = 9.0;
const PAID_PRUNE_TARGET_GB = 8.0;

export const DB_SIZE_THRESHOLD_GB =
  RELAY_INFRA_PROFILE === 'free' ? FREE_PRUNE_THRESHOLD_GB : PAID_PRUNE_THRESHOLD_GB;

export const DB_PRUNE_TARGET_GB =
  RELAY_INFRA_PROFILE === 'free' ? FREE_PRUNE_TARGET_GB : PAID_PRUNE_TARGET_GB;

export const DB_PRUNE_BATCH_SIZE = 1000;
export const DB_PRUNE_MAX_PER_RUN = 100_000;

// Event kinds protected from pruning (identity/configuration)
export const pruneProtectedKinds = new Set<number>([
  0,      // Profile metadata
  3,      // Contact list / follows
  10002,  // Relay list metadata
]);

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------
export const QUERY_CACHE_TTL_MS = 60_000;  // 60 seconds
export const MAX_LOCAL_CACHE_ENTRIES = 100;
export const GLOBAL_CACHE_TTL_SECONDS = 300; // 5 minutes

// ---------------------------------------------------------------------------
// WebSocket / Durable Object
// ---------------------------------------------------------------------------
export const DO_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const DO_BROADCAST_TIMEOUT_MS = 3_000; // 3 seconds
export const EVENT_DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Gift wrap (NIP-59, kind 1059)
// ---------------------------------------------------------------------------
// Gift wraps MUST use authenticated pubkey for rate limiting
export const GIFTWRAP_USE_AUTH_IDENTITY_FOR_RATE_LIMIT = true;
// Gift wrap queries are PRIVATE_NO_CACHE by default
export const GIFTWRAP_CACHE_SCOPE = 'PRIVATE_NO_CACHE' as const;
