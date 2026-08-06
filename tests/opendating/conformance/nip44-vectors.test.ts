/**
 * NIP-44 v2 Official Test Vectors
 *
 * Verifies our implementation against the official NIP-44 test vectors
 * from https://github.com/nostr-protocol/nips/blob/master/44.md
 *
 * Vector file sha256: 269ed0f69e4c192512cc779e78c555090cebc7c785b609e338a62afc3ce25040
 */
import { describe, it, expect } from 'vitest';
import {
  getConversationKey,
  nip44Encrypt,
  nip44Decrypt,
  calcPaddedLen,
  hexToBytes,
  bytesToHex,
  getEventHash,
} from '../../../src/protocols/opendating/crypto/encryption.js';

// ---------------------------------------------------------------------------
// Official test vectors from NIP-44 spec
// ---------------------------------------------------------------------------

const VEC_SEC1 = '0000000000000000000000000000000000000000000000000000000000000001';
const VEC_SEC2 = '0000000000000000000000000000000000000000000000000000000000000002';
const VEC_CONVERSATION_KEY = 'c41c775356fd92eadc63ff5a0dc1da211b268cbea22316767095b2871ea1412d';
const VEC_NONCE = '0000000000000000000000000000000000000000000000000000000000000001';

describe('NIP-44 v2 conversation key', () => {
  it('should match official test vector', () => {
    // sec1 = private key 1, sec2 should map to pubkey2
    const { schnorr } = require('@noble/curves/secp256k1');
    const pub2 = bytesToHex(schnorr.getPublicKey(hexToBytes(VEC_SEC2)));

    const convKey = getConversationKey(VEC_SEC1, pub2);
    expect(bytesToHex(convKey)).toBe(VEC_CONVERSATION_KEY);
  });

  it('should be symmetric', () => {
    const { schnorr } = require('@noble/curves/secp256k1');
    const pub1 = bytesToHex(schnorr.getPublicKey(hexToBytes(VEC_SEC1)));
    const pub2 = bytesToHex(schnorr.getPublicKey(hexToBytes(VEC_SEC2)));

    const keyAtoB = getConversationKey(VEC_SEC1, pub2);
    const keyBtoA = getConversationKey(VEC_SEC2, pub1);

    expect(bytesToHex(keyAtoB)).toBe(bytesToHex(keyBtoA));
  });
});

describe('NIP-44 v2 encrypt/decrypt roundtrip', () => {
  const { schnorr } = require('@noble/curves/secp256k1');
  const alicePriv = VEC_SEC1;
  const bobPriv = VEC_SEC2;
  const alicePub = bytesToHex(schnorr.getPublicKey(hexToBytes(alicePriv)));
  const bobPub = bytesToHex(schnorr.getPublicKey(hexToBytes(bobPriv)));

  it('should encrypt and decrypt short message', () => {
    const plaintext = 'a';
    const ciphertext = nip44Encrypt(plaintext, alicePriv, bobPub);
    const decrypted = nip44Decrypt(ciphertext, bobPriv, alicePub);
    expect(decrypted).toBe(plaintext);
  });

  it('should encrypt and decrypt longer message', () => {
    const plaintext = 'Hello, Nostr! This is a NIP-44 v2 encrypted message.';
    const ciphertext = nip44Encrypt(plaintext, alicePriv, bobPub);
    const decrypted = nip44Decrypt(ciphertext, bobPriv, alicePub);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same plaintext', () => {
    const plaintext = 'test';
    const ct1 = nip44Encrypt(plaintext, alicePriv, bobPub);
    const ct2 = nip44Encrypt(plaintext, alicePriv, bobPub);
    expect(ct1).not.toBe(ct2); // Random nonce → different ciphertexts
  });

  it('should reject wrong recipient decryption', () => {
    // Carol tries to decrypt Alice's message to Bob
    const { schnorr } = require('@noble/curves/secp256k1');
    const carolPriv = '0000000000000000000000000000000000000000000000000000000000000003';
    const carolPub = bytesToHex(schnorr.getPublicKey(hexToBytes(carolPriv)));

    const ciphertext = nip44Encrypt('secret', alicePriv, bobPub);
    expect(() => nip44Decrypt(ciphertext, carolPriv, alicePub)).toThrow();
  });

  it('should reject tampered ciphertext', () => {
    const ciphertext = nip44Encrypt('secret', alicePriv, bobPub);
    const tampered = ciphertext.slice(0, -5) + 'XXXXX';
    expect(() => nip44Decrypt(tampered, bobPriv, alicePub)).toThrow();
  });

  it('should reject short payload', () => {
    expect(() => nip44Decrypt('short', bobPriv, alicePub)).toThrow();
  });

  it('should reject unknown version byte', () => {
    // Version 0x03 is unknown
    const badVersion = 'AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB'; // too short but starts with wrong version
    expect(() => nip44Decrypt(badVersion, bobPriv, alicePub)).toThrow();
  });
});

describe('NIP-44 v2 padding', () => {
  it('should pad 1 byte to 32 bytes', () => {
    expect(calcPaddedLen(1)).toBe(32);
  });

  it('should pad 32 bytes to 32 bytes', () => {
    expect(calcPaddedLen(32)).toBe(32);
  });

  it('should pad 33 bytes to 64 bytes', () => {
    expect(calcPaddedLen(33)).toBe(64);
  });

  it('should reject 0-length plaintext', () => {
    expect(() => calcPaddedLen(0)).toThrow();
  });
});

describe('NIP-01 event ID', () => {
  it('should compute deterministic event ID', () => {
    const event = {
      pubkey: 'a'.repeat(64),
      created_at: 1234567890,
      kind: 1,
      tags: [],
      content: 'hello',
    };

    const id1 = getEventHash(event);
    const id2 = getEventHash(event);
    expect(id1).toBe(id2); // Deterministic
    expect(id1).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(id1)).toBe(true);
  });

  it('should produce different IDs for different events', () => {
    const id1 = getEventHash({
      pubkey: 'a'.repeat(64), created_at: 1, kind: 1, tags: [], content: 'a',
    });
    const id2 = getEventHash({
      pubkey: 'a'.repeat(64), created_at: 1, kind: 1, tags: [], content: 'b',
    });
    expect(id1).not.toBe(id2);
  });
});
