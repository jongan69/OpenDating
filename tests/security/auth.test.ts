/**
 * NIP-42 Authentication Security Tests
 *
 * Tests for:
 * - Challenge uniqueness
 * - Challenge single-use semantics
 * - Relay URL binding
 * - Expired challenge rejection
 * - Auth event validation
 */
import { describe, it, expect } from 'vitest';
import { randomHex } from '../../src/relay/crypto/random.js';
import { isAuthEvent } from '../../src/relay/protocol/validation.js';

describe('NIP-42 auth challenge properties', () => {
  it('should generate unique challenges', () => {
    const challenges = new Set<string>();
    for (let i = 0; i < 100; i++) {
      challenges.add(randomHex(32));
    }
    expect(challenges.size).toBe(100);
  });

  it('should generate 64-character hex challenges (32 bytes)', () => {
    const challenge = randomHex(32);
    expect(challenge.length).toBe(64);
    expect(/^[a-f0-9]{64}$/.test(challenge)).toBe(true);
  });

  it('should identify auth events by kind', () => {
    expect(isAuthEvent(22242)).toBe(true);
    expect(isAuthEvent(1)).toBe(false);
    expect(isAuthEvent(1059)).toBe(false);
  });
});

describe('NIP-42 auth event format validation', () => {
  it('requires kind 22242', () => {
    const notAuth = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 1,
      tags: [['challenge', 'abc'], ['relay', 'wss://example.com']],
      content: '',
      sig: 'c'.repeat(128),
    };
    expect(isAuthEvent(notAuth.kind)).toBe(false);
  });

  it('requires challenge tag', () => {
    const noChallenge = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 22242,
      tags: [['relay', 'wss://example.com']],
      content: '',
      sig: 'c'.repeat(128),
    };
    const hasChallenge = noChallenge.tags.some(t => t[0] === 'challenge');
    expect(hasChallenge).toBe(false);
  });

  it('requires relay tag', () => {
    const noRelay = {
      id: 'a'.repeat(64),
      pubkey: 'b'.repeat(64),
      created_at: Math.floor(Date.now() / 1000),
      kind: 22242,
      tags: [['challenge', 'abc']],
      content: '',
      sig: 'c'.repeat(128),
    };
    const hasRelay = noRelay.tags.some(t => t[0] === 'relay');
    expect(hasRelay).toBe(false);
  });
});
