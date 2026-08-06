/**
 * Cache scope classification.
 *
 * Every query result MUST be classified before caching:
 *
 *   PUBLIC          — May use global Cache API / local cache.
 *   AUTH_SCOPED     — May only be cached under a key including authenticated identity.
 *   PRIVATE_NO_CACHE — Never enters shared cache. Never globally cached.
 */
import type { NostrFilter } from '../../types.js';
import { isGiftWrap } from '../protocol/validation.js';

export enum CacheScope {
  /** Safe for shared/global caching. No user-specific data. */
  PUBLIC = 'PUBLIC',

  /** Safe for per-user caching only. Cache key must include auth identity. */
  AUTH_SCOPED = 'AUTH_SCOPED',

  /** Never cache. Results are specific to this exact request. */
  PRIVATE_NO_CACHE = 'PRIVATE_NO_CACHE',
}

/**
 * Classify a set of filters by their cache sensitivity.
 *
 * Rules:
 * - Gift wrap (kind 1059) queries → PRIVATE_NO_CACHE
 * - Encrypted DM (kind 4) queries with #p tag → AUTH_SCOPED
 * - General public queries → PUBLIC
 */
export function classifyCacheScope(filters: NostrFilter[]): CacheScope {
  for (const filter of filters) {
    // Gift wraps are always private
    if (filter.kinds && filter.kinds.some(k => isGiftWrap(k))) {
      return CacheScope.PRIVATE_NO_CACHE;
    }

    // Encrypted DMs scoped to recipient should be auth-scoped
    if (filter.kinds && filter.kinds.includes(4)) {
      // If filtering by recipient (#p), it's auth-scoped
      if (filter['#p']) {
        return CacheScope.AUTH_SCOPED;
      }
    }
  }

  return CacheScope.PUBLIC;
}

/**
 * Build a cache key that includes all security-relevant state.
 *
 * For AUTH_SCOPED results, the authenticated pubkey MUST be included.
 * Never rely only on JSON.stringify(filters) for private responses.
 */
export function buildCacheKey(
  filters: NostrFilter[],
  bookmark: string,
  scope: CacheScope,
  authenticatedPubkey?: string
): string {
  const base = JSON.stringify({ filters, bookmark });

  switch (scope) {
    case CacheScope.PUBLIC:
      return base;

    case CacheScope.AUTH_SCOPED:
      if (!authenticatedPubkey) {
        throw new Error('AUTH_SCOPED cache key requires authenticated pubkey');
      }
      return `auth:${authenticatedPubkey}:${base}`;

    case CacheScope.PRIVATE_NO_CACHE:
      // Include session-specific entropy to prevent any sharing
      return `private:${crypto.randomUUID()}:${base}`;

    default:
      return base;
  }
}
