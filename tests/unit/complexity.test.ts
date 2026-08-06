import { describe, it, expect } from 'vitest';
import {
  calculateFilterComplexity,
  calculateTotalComplexity,
  isQueryTooComplex,
  normalizeLimit,
  MAX_QUERY_COMPLEXITY,
  DEFAULT_QUERY_LIMIT,
  HARD_QUERY_LIMIT,
} from '../../src/relay/queries/complexity.js';
import type { NostrFilter } from '../../src/types.js';

describe('query complexity', () => {
  it('should assign base cost to empty filter', () => {
    const cost = calculateFilterComplexity({});
    expect(cost).toBe(2); // base(1) * no_time_bounds(2)
  });

  it('should be cheaper with time bounds', () => {
    const withBounds = calculateFilterComplexity({ since: 1000 });
    expect(withBounds).toBe(1);
  });

  it('should scale with authors', () => {
    const small = calculateFilterComplexity({ authors: ['a'.repeat(64)] });
    const large = calculateFilterComplexity({
      authors: Array.from({ length: 100 }, () => 'a'.repeat(64)),
    });
    expect(large).toBeGreaterThan(small);
  });

  it('should scale with tag filters', () => {
    const withTags = calculateFilterComplexity({ '#p': ['a'.repeat(64), 'b'.repeat(64)], since: 1000 });
    const withoutTags = calculateFilterComplexity({ since: 1000 });
    expect(withTags).toBeGreaterThan(withoutTags);
  });

  it('should multiply when no time bounds', () => {
    const noBounds = calculateFilterComplexity({ kinds: [1] });
    const withBounds = calculateFilterComplexity({ kinds: [1], since: 1000 });
    expect(noBounds).toBeGreaterThan(withBounds);
  });

  it('should calculate total complexity additively', () => {
    const total = calculateTotalComplexity([
      { since: 1000 },
      { since: 1000 },
    ]);
    expect(total).toBe(2);
  });

  it('should reject queries above MAX_QUERY_COMPLEXITY', () => {
    const hugeFilter: NostrFilter = {
      '#p': Array.from({ length: 500 }, () => 'a'.repeat(64)),
    };
    expect(isQueryTooComplex([hugeFilter])).toBe(true);
  });

  it('should accept normal queries', () => {
    expect(isQueryTooComplex([{ kinds: [1], limit: 10, since: 1000 }])).toBe(false);
  });
});

describe('limit normalization', () => {
  it('should use default when no limit specified', () => {
    expect(normalizeLimit()).toBe(DEFAULT_QUERY_LIMIT);
    expect(normalizeLimit(undefined)).toBe(DEFAULT_QUERY_LIMIT);
    expect(normalizeLimit(0)).toBe(DEFAULT_QUERY_LIMIT);
    expect(normalizeLimit(-1)).toBe(DEFAULT_QUERY_LIMIT);
  });

  it('should cap at hard limit', () => {
    expect(normalizeLimit(100000)).toBe(HARD_QUERY_LIMIT);
  });

  it('should pass through reasonable limits', () => {
    expect(normalizeLimit(50)).toBe(50);
    expect(normalizeLimit(100)).toBe(100);
  });
});
