/**
 * OpenDating Crypto Conformance Tests
 */
import { describe, it, expect } from 'vitest';
import { generateKeypair, bytesToHex, hexToBytes } from '../../../src/protocols/opendating/crypto/encryption.js';
import { validateServiceKey, derivePublicKey, createServiceKeypair } from '../../../src/protocols/opendating/crypto/service-signer.js';

describe('key generation', () => {
  it('should generate valid secp256k1 keypairs', () => {
    const kp = generateKeypair();
    expect(kp.privateKey).toHaveLength(64);
    expect(kp.publicKey).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(kp.privateKey)).toBe(true);
    expect(/^[a-f0-9]{64}$/.test(kp.publicKey)).toBe(true);
  });

  it('should generate unique keypairs', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    expect(kp1.privateKey).not.toBe(kp2.privateKey);
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
  });

  it('should derive public key from private key', () => {
    const kp = generateKeypair();
    const derived = derivePublicKey(kp.privateKey);
    expect(derived).toBe(kp.publicKey);
  });
});

describe('service key validation', () => {
  it('should validate a correct key', () => {
    const kp = generateKeypair();
    const pubkey = validateServiceKey(kp.privateKey);
    expect(pubkey).toBe(kp.publicKey);
  });

  it('should reject invalid hex', () => {
    expect(validateServiceKey('not-hex')).toBeNull();
  });

  it('should reject wrong-length key', () => {
    expect(validateServiceKey('a'.repeat(63))).toBeNull();
    expect(validateServiceKey('a'.repeat(65))).toBeNull();
  });

  it('should create service keypair', () => {
    const kp = generateKeypair();
    const sk = createServiceKeypair(kp.privateKey);
    expect(sk.privateKey).toBe(kp.privateKey);
    expect(sk.publicKey).toBe(kp.publicKey);
  });

  it('should throw on invalid key', () => {
    expect(() => createServiceKeypair('invalid')).toThrow('Invalid service private key');
  });
});

describe('hex utilities', () => {
  it('should roundtrip hex ↔ bytes', () => {
    const hex = 'deadbeef'.repeat(8);
    expect(bytesToHex(hexToBytes(hex))).toBe(hex);
  });
});
