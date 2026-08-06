import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, MultiRateLimiter } from '../../src/relay/rate-limit/buckets.js';
import type { RateLimitConfig } from '../../src/relay/rate-limit/buckets.js';

describe('RateLimiter', () => {
  it('should allow consuming tokens up to capacity', () => {
    // 10 tokens per second, capacity 10
    const limiter = new RateLimiter(10 / 1000, 10);
    for (let i = 0; i < 10; i++) {
      expect(limiter.removeToken()).toBe(true);
    }
    // 11th should fail
    expect(limiter.removeToken()).toBe(false);
  });

  it('should refill tokens over time', async () => {
    const limiter = new RateLimiter(10 / 1000, 10);

    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      limiter.removeToken();
    }
    expect(limiter.removeToken()).toBe(false);

    // Wait for ~1 token to refill
    await new Promise(r => setTimeout(r, 110));

    // Should have ~1 token now
    expect(limiter.getTokens()).toBeGreaterThan(0);
  });
});

describe('MultiRateLimiter', () => {
  const config: RateLimitConfig = {
    AUTH:           { rate: 10 / 60000, capacity: 10 },
    EVENT_PUBLIC:   { rate: 30 / 60000, capacity: 30 },
    EVENT_GIFTWRAP: { rate: 60 / 60000, capacity: 60 },
    REQ:            { rate: 60 / 60000, capacity: 60 },
    REQ_EXPENSIVE:  { rate: 10 / 60000, capacity: 10 },
    CONNECTION:     { rate: 5  / 60000, capacity: 5  },
  };

  let limiter: MultiRateLimiter;

  beforeEach(() => {
    limiter = new MultiRateLimiter(config);
  });

  it('should have independent buckets', () => {
    // Consume all AUTH tokens
    for (let i = 0; i < 10; i++) {
      limiter.check('AUTH');
    }
    expect(limiter.check('AUTH')).toBe(false);
    // But EVENT_PUBLIC should still work
    expect(limiter.check('EVENT_PUBLIC')).toBe(true);
  });

  it('should track tokens per bucket', () => {
    limiter.check('AUTH');
    expect(limiter.getTokens('AUTH')).toBe(9);
    expect(limiter.getTokens('REQ')).toBe(60);
  });

  it('should have all bucket types available', () => {
    for (const bucket of ['AUTH', 'EVENT_PUBLIC', 'EVENT_GIFTWRAP', 'REQ', 'REQ_EXPENSIVE', 'CONNECTION'] as const) {
      expect(limiter.check(bucket)).toBe(true);
    }
  });
});
