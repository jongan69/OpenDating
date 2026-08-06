# Nosflare Baseline Analysis

> Generated: 2026-08-06 | Nosflare v7.9.45 | MIT License

## 1. Current Architecture

### 1.1 Deployment Model

```
Cloudflare Worker (main entry point)
├── D1 Database (RELAY_DATABASE binding)
│   └── SQLite with read replication (Session API)
├── Durable Objects (RELAY_WEBSOCKET binding)
│   ├── relay-WNAM-primary (Western North America)
│   ├── relay-ENAM-primary (Eastern North America)
│   ├── relay-WEUR-primary (Western Europe)
│   ├── relay-EEUR-primary (Eastern Europe)
│   ├── relay-APAC-primary (Asia-Pacific)
│   ├── relay-OC-primary (Oceania)
│   ├── relay-SAM-primary (South America → ENAM)
│   ├── relay-AFR-primary (Africa → WEUR)
│   └── relay-ME-primary (Middle East → EEUR)
├── Cron: daily at 00:00 UTC (maintenance)
└── Cache API (global query caching)
```

### 1.2 Source File Layout (current)

```
OpenDating/
├── src/
│   ├── index.ts          (18 lines)  - re-exports DO + worker
│   ├── config.ts         (219 lines) - all configuration
│   ├── types.ts          (210 lines) - all TypeScript types
│   ├── relay-worker.ts   (2574 lines) - HTTP handler, DB init, event processing, queries, payment, pruning
│   └── durable-object.ts (1347 lines) - WebSocket DO, sessions, auth, broadcasting, caching
├── worker.js             - bundled output (209KB)
├── nostr-zap.js          - payment button script
├── send-it.js            - blast relay
├── package.json
├── tsconfig.json
├── wrangler.toml
└── images/
```

### 1.3 HTTP Flow

```
Request → Worker fetch()
├── WebSocket upgrade? → Route to optimal DO (geo-routing)
├── Accept: nostr+json? → NIP-11 relay info JSON
├── GET /?notify-zap POST → Payment notification
├── GET /api/check-payment → Payment status
├── GET /.well-known/nostr.json?name=X → NIP-05
├── GET /favicon.ico → Relay icon
└── GET / → Landing page HTML + DB init
```

### 1.4 WebSocket Flow (Durable Object)

```
WebSocket connect
├── Geo-route to nearest DO by continent/country/region
├── Create session with NIP-42 challenge (if AUTH_REQUIRED)
├── Send AUTH challenge immediately
├── Accept WebSocket with hibernation
└── Messages handled via webSocketMessage()

Message types:
├── EVENT → Validate, auth, rate-limit, verify sig, policy, store, broadcast
├── REQ   → Auth, rate-limit, validate filters, query (with cache), send results, EOSE
├── CLOSE → Remove subscription, send CLOSED
└── AUTH  → Validate kind 22242, verify sig, check challenge, check relay, auth pubkey
```

### 1.5 Event Pipeline

```
EVENT received
├── Validate event object shape
├── Check required fields (id, pubkey, sig, created_at, kind, tags, content)
├── Reject kind 22242 (auth-only)
├── NIP-42 auth check (if required)
│   ├── Must have at least one authenticated pubkey
│   └── Event pubkey must match authenticated pubkey (except kind 1059)
├── Rate limit check (skip for excludedRateLimitKinds: [1059])
├── Signature verification (schnorr via @noble/curves)
├── Pay-to-relay check (skip for kind 1059)
├── Pubkey allow/block check (skip for kind 1059)
├── Event kind allow/block check
├── Content block check
├── Tag allow/block check
├── processEvent() (relay-worker.ts)
│   ├── NIP-05 validation (if enabled, skip for kind 1059 and 0)
│   ├── Deletion event (kind 5) → verify ownership, batch delete
│   ├── Ephemeral event (kind 20000-29999) → broadcast only, no store
│   └── saveEventToDatabase()
│       ├── Worker cache duplicate check
│       ├── D1 duplicate check
│       ├── Replaceable event handling (kind 0,3,10000-19999)
│       ├── Parameterized replaceable (kind 30000-39999)
│       ├── Anti-spam content hash check (if enabled)
│       ├── INSERT event + tags + cache_multi + content_hash
│       └── Worker cache put
├── OK response to sender
├── Invalidate query caches (local only)
└── Broadcast (local DO + all other DOs)
```

### 1.6 Query Pipeline

```
REQ received
├── Validate subscription ID (non-empty, ≤64 chars)
├── NIP-42 auth check (if required)
├── Rate limit check (REQ rate)
├── Validate each filter:
│   ├── Must be non-null object
│   ├── ID format: 64-char hex
│   ├── Author format: 64-char hex
│   ├── Blocked kinds check
│   ├── Max 5000 IDs
│   └── Cap limit at 500 (default 500)
├── Store subscription
├── getCachedOrQuery(filters, bookmark)
│   ├── In-flight deduplication check
│   ├── Global Cache API check (shared across all users!)
│   ├── Local DO cache check
│   └── queryEvents(filters, bookmark, env)
│       ├── Complexity check per filter (max 1000)
│       ├── Chunked queries for large arrays (>500 items)
│       ├── COUNT precheck for tag queries (>10000 rows → skip)
│       ├── Batch query execution via D1
│       └── Deduplicate + sort results (max 500 global)
├── Send events + EOSE
└── Cache results (both local DO cache AND global Cache API!)
```

### 1.7 Auth Flow (NIP-42)

```
Connection established
├── Generate 32-byte random challenge (crypto.getRandomValues)
├── Store in session.challenge
├── Send ["AUTH", challenge_hex]
└── Wait for client AUTH response

Client sends AUTH event:
├── Validate event object + required fields
├── Verify kind == 22242
├── Verify signature (schnorr)
├── Verify created_at within AUTH_TIMEOUT_MS (600000ms = 10 minutes!)
├── Extract "challenge" tag → must match session.challenge
├── Extract "relay" tag → must match session host (domain only)
├── Add pubkey to session.authenticatedPubkeys (Set)
├── Check payment status (if pay-to-relay enabled)
└── Send OK

ISSUES:
- Challenge is NOT single-use (not cleared after successful auth)
- 10-minute challenge timeout is very long
- Challenge survives reconnection (persisted in attachment)
- No challenge expiration tracking independent of AUTH_TIMEOUT_MS
```

### 1.8 Rate Limiting (current)

```
Configuration:
├── PUBKEY_RATE_LIMIT: 10 events/min (per socket)
├── REQ_RATE_LIMIT: 50 req/min (per socket)
└── excludedRateLimitKinds: [1059] ← GIFT WRAPS EXCLUDED

Implementation:
├── Token bucket algorithm (RateLimiter class)
├── Per-socket, NOT per-authenticated-pubkey
├── Single bucket for all event kinds
├── Single bucket for all REQ types
└── No distinction between public/private events

ISSUES:
- Kind 1059 excluded from rate limiting (major spam vector)
- Rate limits are per-socket, not per-identity
- No separate buckets for different event types
- No query-complexity-based rate limiting
- No connection rate limiting
```

### 1.9 Caching (current)

```
Query caching:
├── Local DO cache (Map<string, CacheEntry>)
│   ├── TTL: 60 seconds
│   ├── Max size: 100 entries
│   ├── LFU eviction
│   └── Indexed by kind, author, tags
├── Global Cache API (caches.default)
│   ├── TTL: 5 minutes (Cache-Control header)
│   ├── Key: SHA-256 of JSON.stringify({filters, bookmark})
│   └── Stored as Response with JSON body
└── Active query deduplication (in-flight only)

Cache invalidation:
├── On new event: invalidate by kind, author, tags
└── On DO broadcast from peer: invalidate by kind, author, tags

Worker cache (event dedup):
├── Cache API keyed by event ID
└── TTL: 1 hour

ISSUES:
- NO cache classification (public vs private vs auth-scoped)
- Global Cache API used for ALL queries including potentially private ones
- Cache keys do NOT include authentication scope
- Gift-wrap queries can enter shared cache
- No cache scope concept (PUBLIC, AUTH_SCOPED, PRIVATE_NO_CACHE)
```

### 1.10 Broadcasting

```
Event accepted:
├── Mark as processed (in-memory Map, 5-min TTL)
├── Invalidate local caches
├── Broadcast to local DO sessions:
│   └── For each session, check subscription filters match → send EVENT
└── Broadcast to all other DOs:
    ├── Send POST /do-broadcast to each endpoint (parallel, 3s timeout)
    └── Receiving DO: check dedup, invalidate caches, broadcast locally
```

### 1.11 Maintenance (Cron)

```
Daily at 00:00 UTC:
├── Check database size
├── If > DB_SIZE_THRESHOLD_GB (9GB) → prune to DB_PRUNE_TARGET_GB (8GB)
│   ├── Find oldest events (excluding pruneProtectedKinds: [0,3,10002])
│   ├── Batch delete (1000 per batch)
│   └── Max 100,000 per run
├── PRAGMA optimize
└── ANALYZE on all tables
```

### 1.12 Database Schema

```sql
-- Main events table
events (
  id TEXT PRIMARY KEY,
  pubkey TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  kind INTEGER NOT NULL,
  tags TEXT NOT NULL,          -- JSON string
  content TEXT NOT NULL,
  sig TEXT NOT NULL,
  created_timestamp INTEGER,
  tag_p TEXT, tag_e TEXT, tag_a TEXT, tag_t TEXT,
  tag_d TEXT, tag_r TEXT, tag_L TEXT, tag_s TEXT, tag_u TEXT,
  reply_to_event_id TEXT,
  root_event_id TEXT,
  content_preview TEXT
)

-- Indexes on events:
idx_events_created_at              (created_at DESC)
idx_events_kind_created_at         (kind, created_at DESC)
idx_events_pubkey_created_at       (pubkey, created_at DESC)
idx_events_pubkey_kind_created_at  (pubkey, kind, created_at DESC)
idx_events_kind_pubkey_created_at  (kind, pubkey, created_at DESC)

-- Tags table (normalized)
tags (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_value TEXT NOT NULL
)
idx_tags_name_value_event  (tag_name, tag_value, event_id)
idx_tags_event_id          (event_id)

-- Denormalized tag cache (for query performance)
event_tags_cache_multi (
  event_id TEXT NOT NULL,
  pubkey TEXT NOT NULL,
  kind INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  tag_type TEXT NOT NULL CHECK(tag_type IN ('p','e','a','t','d','r','L','s','u')),
  tag_value TEXT NOT NULL,
  PRIMARY KEY (event_id, tag_type, tag_value)
)
idx_cache_multi_type_value_time     (tag_type, tag_value, created_at DESC)
idx_cache_multi_type_value_event    (tag_type, tag_value, event_id)
idx_cache_multi_kind_type_value     (kind, tag_type, tag_value, created_at DESC)
idx_cache_multi_event_id            (event_id)

-- Payment tracking
paid_pubkeys (
  pubkey TEXT PRIMARY KEY,
  paid_at INTEGER NOT NULL,
  amount_sats INTEGER,
  created_timestamp INTEGER
)

-- Anti-spam content hashes
content_hashes (
  hash TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  pubkey TEXT NOT NULL,
  created_at INTEGER NOT NULL
)
idx_content_hashes_pubkey           (pubkey)
idx_content_hashes_created_at       (created_at DESC)
idx_content_hashes_pubkey_created   (pubkey, created_at DESC)

-- System configuration
system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER
)
```

---

## 2. Existing NIP Support

### Implemented ✓

| NIP | Description | Status |
|-----|-------------|--------|
| NIP-01 | Basic protocol flow (EVENT, REQ, CLOSE, EOSE, OK, NOTICE) | **Implemented** |
| NIP-02 | Contact list (kind 3 as replaceable) | **Implemented** |
| NIP-05 | DNS-based identity verification | **Implemented** |
| NIP-09 | Event deletion (kind 5) | **Implemented** |
| NIP-11 | Relay info document | **Implemented** |
| NIP-12 | Generic tag queries (#e, #p, #t, etc.) | **Implemented** |
| NIP-15 | End of stored events (EOSE) | **Implemented** |
| NIP-16 | Replaceable events (kinds 0, 3, 10000-19999) | **Implemented** |
| NIP-20 | Command results (OK messages) | **Implemented** |
| NIP-33 | Parameterized replaceable events (kinds 30000-39999, d-tag) | **Implemented** |
| NIP-42 | Authentication of clients to relays (kind 22242) | **Implemented** |

### Advertised But Unverified ✗

| NIP | Description | Status |
|-----|-------------|--------|
| NIP-04 | Encrypted DMs | **Advertised only** - No special handling observed |
| NIP-13 | Proof of Work | **Advertised only** - No POW validation found |
| NIP-17 | Direct messaging | **Advertised only** - No NIP-17 specific logic |
| NIP-22 | Event created_at limits | **Advertised only** - No timestamp validation found |
| NIP-25 | Reactions | **Advertised only** - No reaction-specific handling |
| NIP-28 | Public chat | **Advertised only** - No chat-specific handling |
| NIP-40 | Expiration | **Advertised only** - No expiration handling found |
| NIP-57 | Lightning zaps | **Advertised only** - Listed but no zap verification |

### Notable: NIP-59 (Gift Wrap)

NIP-59 (kind 1059 gift wraps) is partially supported:
- Kind 1059 events can be published (with bypasses for rate limits, pay-to-relay, pubkey checks)
- But: no recipient-only query enforcement
- But: cache classification doesn't protect gift-wrap privacy

---

## 3. Current Security Concerns

### 3.1 Critical

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| 1 | **Shared query caching** | HIGH | All query results cached in global Cache API without auth scope. Private results could be served to wrong users. |
| 2 | **Kind 1059 rate limit bypass** | HIGH | Gift wraps excluded from rate limiting (excludedRateLimitKinds). Major spam surface. |
| 3 | **Gift-wrap query isolation missing** | HIGH | No enforcement that REQ for kind 1059 must match authenticated recipient's pubkey. Anyone could query gift wraps. |
| 4 | **Challenge not single-use** | MEDIUM | NIP-42 challenge persists after successful auth. Can be replayed within timeout window. |
| 5 | **10-minute auth timeout** | MEDIUM | AUTH_TIMEOUT_MS = 600000ms. Per NIP-42 best practice, should be ~60 seconds. |
| 6 | **Challenge survives hibernation** | MEDIUM | Old challenge restored from attachment after hibernation, even if expired. |

### 3.2 Moderate

| # | Issue | Detail |
|---|-------|--------|
| 7 | Rate limits are per-socket, not per-identity | No distinction between authenticated/unauthenticated users |
| 8 | No query complexity enforcement | MAX_QUERY_COMPLEXITY = 1000 but only skips; no rejection |
| 9 | DB init on HTTP request path | Heavy schema migration work triggered on landing page visits |
| 10 | Kind 1059 pay-to-relay bypass | Gift wrap pubkey is throwaway, so pay-to-relay is skipped entirely |
| 11 | No connection-level rate limiting | Only per-socket EVENT/REQ limiting, no per-IP connection limiting |

### 3.3 Minor

| # | Issue | Detail |
|---|-------|--------|
| 12 | No structured logging | console.log/error only, no request correlation IDs |
| 13 | No secret architecture | No documentation for secrets management |
| 14 | No startup config validation | Invalid config values silently used with defaults |
| 15 | Pruning threshold too high | 9GB threshold with 8GB target; D1 free tier is 5GB |

---

## 4. Current Cloudflare Assumptions

### In use

| Feature | Usage | Dependency Level |
|---------|-------|-----------------|
| Workers | Single worker, main entry + cron | **Core** |
| Durable Objects | 9-region mesh for WebSockets | **Core** |
| D1 Database | Primary event storage (SQLite) | **Core** |
| D1 Session API | Read replication for queries | **Important** |
| WebSocket Hibernation | Cost optimization for idle clients | **Important** |
| Cache API | Event dedup + query result caching | **Important** |
| Cron Triggers | Daily maintenance (pruning, optimize, analyze) | **Nice-to-have** |
| Wrangler | Deployment and local dev | **Dev tooling** |

### Assumed but not verified

- Workers Paid plan (CPU limit 300000ms in wrangler.toml)
- D1 10GB limit (pruning targets 8-9GB)
- Read replication availability
- Multi-region DO placement

---

## 5. Baseline Build Status

```
npm install     ✓ (64 packages)
npm run build   ✓ (209.3KB worker.js)
npm run typecheck ✓ (no errors with moduleResolution: "bundler")
npm test        ✗ (no test infrastructure exists)
```

### Missing infrastructure

- No test framework configured
- No test files exist
- No linting/formatting configuration
- No CI/CD (GitHub Actions)
- No .env.example
- No migration scripts (migrations embedded in code)
- No development documentation
- No architecture documentation
- No security documentation

---

## 6. Key Architectural Observations

### Strengths

1. **Multi-region DO mesh** — Well-designed geographic routing with location hints
2. **WebSocket Hibernation** — Proper cost optimization
3. **D1 read replication** — Good use of Session API for read scaling
4. **Efficient query building** — Index-aware SQL with index hints
5. **Tag cache table** — Smart denormalization for tag queries
6. **Chunked queries** — Handles large filter arrays without hitting D1 limits
7. **Count precheck** — Avoids expensive queries via COUNT estimation
8. **TypeScript strict mode** — Already enabled, types are accurate

### Weaknesses

1. **Monolithic files** — relay-worker.ts (2574 lines) and durable-object.ts (1347 lines) are too large
2. **No modular boundaries** — Business logic, storage, auth, broadcasting all interleaved
3. **Config mixed with logic** — Configuration, policy, and business logic share files
4. **No cache classification** — All caches are shared regardless of data sensitivity
5. **Pay-to-relay enabled by default** — Should default to false for free relay
6. **Kind 1059 treated as special everywhere** — Rather than having a general "use auth identity for rate limiting" system
7. **No extension mechanism** — Adding new protocol features requires modifying core files
8. **Database initialization in request path** — Schema migrations should be deployment-time only
