import { describe, it, expect } from 'vitest';
import {
  CacheScope,
  classifyCacheScope,
  buildCacheKey,
} from '../../src/relay/cache/classification.js';
import type { NostrFilter } from '../../src/types.js';

describe('cache classification', () => {
  it('should classify public queries as PUBLIC', () => {
    const filters: NostrFilter[] = [{ kinds: [1], limit: 10 }];
    expect(classifyCacheScope(filters)).toBe(CacheScope.PUBLIC);
  });

  it('should classify gift wrap queries as PRIVATE_NO_CACHE', () => {
    const filters: NostrFilter[] = [{ kinds: [1059] }];
    expect(classifyCacheScope(filters)).toBe(CacheScope.PRIVATE_NO_CACHE);
  });

  it('should classify mixed kind queries with gift wraps as PRIVATE_NO_CACHE', () => {
    const filters: NostrFilter[] = [{ kinds: [1, 1059] }];
    expect(classifyCacheScope(filters)).toBe(CacheScope.PRIVATE_NO_CACHE);
  });

  it('should classify encrypted DM queries as AUTH_SCOPED', () => {
    const filters: NostrFilter[] = [{ kinds: [4], '#p': ['some_pubkey'] }];
    expect(classifyCacheScope(filters)).toBe(CacheScope.AUTH_SCOPED);
  });

  it('should classify multi-filter queries conservatively', () => {
    const filters: NostrFilter[] = [
      { kinds: [1] },
      { kinds: [1059] },
    ];
    expect(classifyCacheScope(filters)).toBe(CacheScope.PRIVATE_NO_CACHE);
  });
});

describe('cache key building', () => {
  it('should build PUBLIC cache keys without auth identity', () => {
    const filters: NostrFilter[] = [{ kinds: [1] }];
    const key = buildCacheKey(filters, 'bookmark1', CacheScope.PUBLIC);
    expect(key).toContain('bookmark1');
    expect(key).not.toContain('auth:');
    expect(key).not.toContain('private:');
  });

  it('should include authenticated pubkey in AUTH_SCOPED keys', () => {
    const filters: NostrFilter[] = [{ kinds: [4], '#p': ['recipient'] }];
    const key = buildCacheKey(filters, 'bookmark1', CacheScope.AUTH_SCOPED, 'auth_pubkey_hex');
    expect(key).toContain('auth_pubkey_hex');
    expect(key).toContain('auth:');
  });

  it('should throw if AUTH_SCOPED key lacks pubkey', () => {
    const filters: NostrFilter[] = [{ kinds: [4] }];
    expect(() =>
      buildCacheKey(filters, 'bm', CacheScope.AUTH_SCOPED)
    ).toThrow('authenticated pubkey');
  });

  it('should include random entropy in PRIVATE_NO_CACHE keys', () => {
    const filters: NostrFilter[] = [{ kinds: [1059] }];
    const key1 = buildCacheKey(filters, 'bm', CacheScope.PRIVATE_NO_CACHE);
    const key2 = buildCacheKey(filters, 'bm', CacheScope.PRIVATE_NO_CACHE);
    // Each call generates a unique key (no sharing)
    expect(key1).not.toBe(key2);
    expect(key1).toContain('private:');
  });
});
