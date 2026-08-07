/**
 * Cloudflare KV — Caching Layer
 *
 * Reduces D1 reads and improves cold-start latency with three cache tiers:
 *
 *   1. NIP-11 relay info — cached for 1 hour (changes rarely)
 *   2. Rate limit state — persists across worker invocations (in-memory is lost on cold start)
 *   3. Hot profiles — cached for 5 minutes (reduces repeated D1 lookups during swiping)
 *
 * All caches are read-through: on a miss we return null and let the caller
 * populate from D1. The KV namespace is optional — when absent everything
 * degrades to D1-only reads (current behavior).
 *
 * Free tier: 1GB storage, 1000 reads/sec, 1000 writes/sec — more than enough.
 */

// ---------------------------------------------------------------------------
// TTL constants
// ---------------------------------------------------------------------------

const NIP11_CACHE_TTL = 3600;       // 1 hour
const RATE_LIMIT_CACHE_TTL = 60;    // 1 minute
const PROFILE_CACHE_TTL = 300;      // 5 minutes

// ---------------------------------------------------------------------------
// Cache key helpers
// ---------------------------------------------------------------------------

function nip11Key(): string {
  return 'cache:nip11';
}

function rateLimitKey(pubkey: string, kind: 'event' | 'req'): string {
  return `cache:ratelimit:${kind}:${pubkey}`;
}

function profileKey(memberId: string): string {
  return `cache:profile:${memberId}`;
}

// ---------------------------------------------------------------------------
// NIP-11 cache
// ---------------------------------------------------------------------------

/**
 * Get cached NIP-11 response. Returns null on miss.
 */
export async function getCachedNip11(kv: KVNamespace | undefined): Promise<string | null> {
  if (!kv) return null;
  try {
    return await kv.get(nip11Key());
  } catch (err) {
    console.error('[cache] nip11 get failed:', err);
    return null;
  }
}

/**
 * Cache a NIP-11 response.
 */
export async function setCachedNip11(
  kv: KVNamespace | undefined,
  json: string,
): Promise<void> {
  if (!kv) return;
  try {
    await kv.put(nip11Key(), json, { expirationTtl: NIP11_CACHE_TTL });
  } catch (err) {
    console.error('[cache] nip11 set failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Rate limit cache
// ---------------------------------------------------------------------------

export interface CachedRateLimit {
  tokens: number;
  lastRefill: number;
}

/**
 * Get persisted rate limit state. Returns null on miss.
 */
export async function getCachedRateLimit(
  kv: KVNamespace | undefined,
  pubkey: string,
  kind: 'event' | 'req',
): Promise<CachedRateLimit | null> {
  if (!kv) return null;
  try {
    const raw = await kv.get(rateLimitKey(pubkey, kind));
    if (!raw) return null;
    return JSON.parse(raw) as CachedRateLimit;
  } catch {
    return null;
  }
}

/**
 * Persist rate limit state. Called after each token consumption.
 */
export async function setCachedRateLimit(
  kv: KVNamespace | undefined,
  pubkey: string,
  kind: 'event' | 'req',
  state: CachedRateLimit,
): Promise<void> {
  if (!kv) return;
  try {
    await kv.put(rateLimitKey(pubkey, kind), JSON.stringify(state), {
      expirationTtl: RATE_LIMIT_CACHE_TTL,
    });
  } catch {
    // Silently fail — rate limiting still works in-memory
  }
}

// ---------------------------------------------------------------------------
// Profile cache
// ---------------------------------------------------------------------------

/**
 * Get a cached profile payload. Returns null on miss.
 */
export async function getCachedProfile(
  kv: KVNamespace | undefined,
  memberId: string,
): Promise<string | null> {
  if (!kv) return null;
  try {
    return await kv.get(profileKey(memberId));
  } catch {
    return null;
  }
}

/**
 * Cache a profile payload (the encrypted JSON string from D1).
 */
export async function setCachedProfile(
  kv: KVNamespace | undefined,
  memberId: string,
  payload: string,
): Promise<void> {
  if (!kv) return;
  try {
    await kv.put(profileKey(memberId), payload, { expirationTtl: PROFILE_CACHE_TTL });
  } catch {
    // Silently fail
  }
}

/**
 * Invalidate a cached profile (call after profile update).
 */
export async function invalidateCachedProfile(
  kv: KVNamespace | undefined,
  memberId: string,
): Promise<void> {
  if (!kv) return;
  try {
    await kv.delete(profileKey(memberId));
  } catch {
    // Silently fail
  }
}
