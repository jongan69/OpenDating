/**
 * Token bucket rate limiter.
 *
 * Used for multi-dimensional rate limiting:
 *   - AUTH (auth attempts)
 *   - EVENT_PUBLIC (public events)
 *   - EVENT_GIFTWRAP (gift wrap events)
 *   - REQ (standard queries)
 *   - REQ_EXPENSIVE (complex queries)
 *   - CONNECTION (new WebSocket connections)
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly capacity: number;
  private readonly fillRate: number; // tokens per millisecond

  constructor(rate: number, capacity: number) {
    this.tokens = capacity;
    this.lastRefillTime = Date.now();
    this.capacity = capacity;
    this.fillRate = rate; // rate is tokens/ms
  }

  /**
   * Attempt to consume one token.
   * Returns true if a token was available, false if rate limited.
   */
  removeToken(): boolean {
    this.refill();
    if (this.tokens < 1) {
      return false;
    }
    this.tokens -= 1;
    return true;
  }

  /**
   * Get current token count (for inspection).
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedTime = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(elapsedTime * this.fillRate);
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }
}

/**
 * Rate limit bucket categories.
 */
export type RateLimitBucket =
  | 'AUTH'
  | 'EVENT_PUBLIC'
  | 'EVENT_GIFTWRAP'
  | 'REQ'
  | 'REQ_EXPENSIVE'
  | 'CONNECTION';

/**
 * Configuration for rate limit buckets.
 */
export interface RateLimitConfig {
  AUTH: { rate: number; capacity: number };
  EVENT_PUBLIC: { rate: number; capacity: number };
  EVENT_GIFTWRAP: { rate: number; capacity: number };
  REQ: { rate: number; capacity: number };
  REQ_EXPENSIVE: { rate: number; capacity: number };
  CONNECTION: { rate: number; capacity: number };
}

/**
 * Multi-dimensional rate limiter with independent buckets.
 */
export class MultiRateLimiter {
  private buckets: Map<string, RateLimiter> = new Map();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if an action is allowed under the given bucket.
   * Creates the bucket lazily on first use.
   */
  check(bucket: RateLimitBucket): boolean {
    let limiter = this.buckets.get(bucket);
    if (!limiter) {
      const cfg = this.config[bucket];
      limiter = new RateLimiter(cfg.rate, cfg.capacity);
      this.buckets.set(bucket, limiter);
    }
    return limiter.removeToken();
  }

  /**
   * Get current token count for a bucket.
   */
  getTokens(bucket: RateLimitBucket): number {
    const limiter = this.buckets.get(bucket);
    return limiter ? limiter.getTokens() : this.config[bucket].capacity;
  }
}
