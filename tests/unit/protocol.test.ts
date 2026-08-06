import { describe, it, expect } from 'vitest';
import {
  validateEventShape,
  validateFilter,
  isReplaceableEvent,
  isParameterizedReplaceableEvent,
  isEphemeralEvent,
  isDeletionEvent,
  isGiftWrap,
  isAuthEvent,
  isProtectedKind,
  isValidSubscriptionId,
} from '../../src/relay/protocol/validation.js';

describe('event validation', () => {
  const validEvent = {
    id: 'a'.repeat(64),
    pubkey: 'b'.repeat(64),
    created_at: 1234567890,
    kind: 1,
    tags: [],
    content: 'hello',
    sig: 'c'.repeat(128),
  };

  it('should accept a valid event', () => {
    expect(validateEventShape(validEvent)).toBe(true);
  });

  it('should reject null/undefined', () => {
    expect(validateEventShape(null)).toBe(false);
    expect(validateEventShape(undefined)).toBe(false);
  });

  it('should reject non-object', () => {
    expect(validateEventShape('string')).toBe(false);
    expect(validateEventShape(42)).toBe(false);
  });

  it('should reject missing id', () => {
    const e = { ...validEvent, id: undefined };
    expect(validateEventShape(e)).toBe(false);
  });

  it('should reject invalid id format', () => {
    expect(validateEventShape({ ...validEvent, id: 'xyz' })).toBe(false);
    expect(validateEventShape({ ...validEvent, id: 'a'.repeat(63) })).toBe(false);
  });

  it('should reject invalid pubkey format', () => {
    expect(validateEventShape({ ...validEvent, pubkey: 'xyz' })).toBe(false);
  });

  it('should reject invalid sig format', () => {
    expect(validateEventShape({ ...validEvent, sig: 'short' })).toBe(false);
  });

  it('should reject negative kind', () => {
    expect(validateEventShape({ ...validEvent, kind: -1 })).toBe(false);
  });

  it('should reject non-integer kind', () => {
    expect(validateEventShape({ ...validEvent, kind: 1.5 })).toBe(false);
  });

  it('should reject missing content', () => {
    const e = { ...validEvent, content: undefined };
    expect(validateEventShape(e)).toBe(false);
  });

  it('should accept empty content string', () => {
    expect(validateEventShape({ ...validEvent, content: '' })).toBe(true);
  });

  it('should reject missing tags', () => {
    const e = { ...validEvent, tags: undefined };
    expect(validateEventShape(e)).toBe(false);
  });
});

describe('filter validation', () => {
  it('should accept a valid filter', () => {
    expect(validateFilter({ kinds: [1], limit: 10 })).toBe(true);
  });

  it('should accept empty filter', () => {
    expect(validateFilter({})).toBe(true);
  });

  it('should reject non-object', () => {
    expect(validateFilter('string')).toBe(false);
    expect(validateFilter(null)).toBe(false);
  });

  it('should validate id format', () => {
    expect(validateFilter({ ids: ['a'.repeat(64)] })).toBe(true);
    expect(validateFilter({ ids: ['bad'] })).toBe(false);
  });

  it('should validate author format', () => {
    expect(validateFilter({ authors: ['a'.repeat(64)] })).toBe(true);
    expect(validateFilter({ authors: ['bad'] })).toBe(false);
  });

  it('should validate limit is non-negative', () => {
    expect(validateFilter({ limit: 10 })).toBe(true);
    expect(validateFilter({ limit: -1 })).toBe(false);
  });

  it('should reject too many ids', () => {
    const ids = Array.from({ length: 5001 }, (_, i) => 'a'.repeat(64));
    expect(validateFilter({ ids })).toBe(false);
  });
});

describe('event classification', () => {
  it('should classify replaceable events', () => {
    expect(isReplaceableEvent(0)).toBe(true);
    expect(isReplaceableEvent(3)).toBe(true);
    expect(isReplaceableEvent(10000)).toBe(true);
    expect(isReplaceableEvent(19999)).toBe(true);
    expect(isReplaceableEvent(1)).toBe(false);
    expect(isReplaceableEvent(20000)).toBe(false);
  });

  it('should classify parameterized replaceable events', () => {
    expect(isParameterizedReplaceableEvent(30000)).toBe(true);
    expect(isParameterizedReplaceableEvent(39999)).toBe(true);
    expect(isParameterizedReplaceableEvent(1)).toBe(false);
  });

  it('should classify ephemeral events', () => {
    expect(isEphemeralEvent(20000)).toBe(true);
    expect(isEphemeralEvent(25000)).toBe(true);
    expect(isEphemeralEvent(29999)).toBe(true);
    expect(isEphemeralEvent(1)).toBe(false);
  });

  it('should classify deletion events', () => {
    expect(isDeletionEvent(5)).toBe(true);
    expect(isDeletionEvent(1)).toBe(false);
  });

  it('should classify gift wraps', () => {
    expect(isGiftWrap(1059)).toBe(true);
    expect(isGiftWrap(1)).toBe(false);
  });

  it('should classify auth events', () => {
    expect(isAuthEvent(22242)).toBe(true);
    expect(isAuthEvent(1)).toBe(false);
  });

  it('should identify protected kinds', () => {
    expect(isProtectedKind(0)).toBe(true);
    expect(isProtectedKind(3)).toBe(true);
    expect(isProtectedKind(10002)).toBe(true);
    expect(isProtectedKind(1)).toBe(false);
  });
});

describe('subscription ID validation', () => {
  it('should accept valid subscription IDs', () => {
    expect(isValidSubscriptionId('sub1')).toBe(true);
    expect(isValidSubscriptionId('a')).toBe(true);
    expect(isValidSubscriptionId('a'.repeat(64))).toBe(true);
  });

  it('should reject invalid subscription IDs', () => {
    expect(isValidSubscriptionId('')).toBe(false);
    expect(isValidSubscriptionId('a'.repeat(65))).toBe(false);
    expect(isValidSubscriptionId(null)).toBe(false);
    expect(isValidSubscriptionId(undefined)).toBe(false);
    expect(isValidSubscriptionId(42)).toBe(false);
  });
});
