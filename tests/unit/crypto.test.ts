import { describe, it, expect } from 'vitest';
import { hexToBytes, bytesToHex } from '../../src/shared/hex.js';
import { generateRandomHex } from '../../src/relay/crypto/hashing.js';
import { randomHex, uuid } from '../../src/relay/crypto/random.js';

describe('hex utilities', () => {
  it('should convert hex to bytes and back', () => {
    const hex = 'deadbeef';
    const bytes = hexToBytes(hex);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(4);
    expect(bytesToHex(bytes)).toBe(hex);
  });

  it('should handle empty hex string', () => {
    const bytes = hexToBytes('');
    expect(bytes.length).toBe(0);
  });

  it('should handle full 64-char hex (Nostr IDs)', () => {
    const hex = 'a'.repeat(64);
    const bytes = hexToBytes(hex);
    expect(bytes.length).toBe(32);
    expect(bytesToHex(bytes)).toBe(hex);
  });

  it('should throw on odd-length hex', () => {
    expect(() => hexToBytes('abc')).toThrow('Invalid hex string');
  });
});

describe('random generation', () => {
  it('should generate random hex of specified length', () => {
    const hex = randomHex(32);
    expect(hex.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(hex)).toBe(true);
  });

  it('should generate unique random hex values', () => {
    const a = randomHex(32);
    const b = randomHex(32);
    expect(a).not.toBe(b);
  });

  it('should generate valid auth challenges', () => {
    const challenge = generateRandomHex();
    // 32 bytes = 64 hex chars
    expect(challenge.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(challenge)).toBe(true);
  });

  it('should generate valid UUIDs', () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
