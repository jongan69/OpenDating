import { describe, it, expect } from 'vitest';
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import {
  BLOSSOM_AUTH_KIND,
  parseAuthHeader,
  verifyAuth,
  type BlossomAuthEvent,
} from '../../../src/protocols/blossom/auth.js';
import { parseBlobPath, isBlossomPath } from '../../../src/protocols/blossom/server.js';
import {
  generateKeypair,
  bytesToHex,
  hexToBytes,
} from '../../../src/protocols/opendating/crypto/encryption.js';

const NOW = 1_800_000_000;
const BLOB = 'a'.repeat(64);
const user = generateKeypair();

function signAuth(over: Partial<BlossomAuthEvent> = {}, key = user): BlossomAuthEvent {
  const base = {
    pubkey: key.publicKey,
    created_at: NOW,
    kind: BLOSSOM_AUTH_KIND,
    tags: [
      ['t', 'upload'],
      ['x', BLOB],
      ['expiration', String(NOW + 60)],
    ] as string[][],
    content: '',
    ...over,
  };
  const serialized = JSON.stringify([
    0, base.pubkey, base.created_at, base.kind, base.tags, base.content,
  ]);
  const id = bytesToHex(sha256(new TextEncoder().encode(serialized)));
  const sig = bytesToHex(schnorr.sign(hexToBytes(id), hexToBytes(key.privateKey)));
  return { ...base, id, sig } as BlossomAuthEvent;
}

function header(event: BlossomAuthEvent): string {
  return `Nostr ${btoa(JSON.stringify(event))}`;
}

describe('parseAuthHeader', () => {
  it('round-trips a signed event', () => {
    const event = signAuth();
    expect(parseAuthHeader(header(event))?.id).toBe(event.id);
  });

  it('returns null for anything that is not a Nostr authorization', () => {
    expect(parseAuthHeader(null)).toBeNull();
    expect(parseAuthHeader('Bearer abc')).toBeNull();
    expect(parseAuthHeader('Nostr not-base64!!')).toBeNull();
    expect(parseAuthHeader(`Nostr ${btoa('{"not":"an event"}')}`)).toBeNull();
  });
});

describe('verifyAuth', () => {
  it('accepts a well-formed upload authorization', () => {
    const result = verifyAuth(signAuth(), 'upload', NOW, BLOB);
    expect(result.ok).toBe(true);
    expect(result.pubkey).toBe(user.publicKey);
  });

  it('rejects a missing authorization', () => {
    expect(verifyAuth(null, 'upload', NOW).ok).toBe(false);
  });

  it('rejects the wrong event kind', () => {
    expect(verifyAuth(signAuth({ kind: 1 }), 'upload', NOW, BLOB).ok).toBe(false);
  });

  // Without the verb check, a list authorization could be replayed to delete.
  it('rejects an authorization issued for a different verb', () => {
    const listAuth = signAuth({ tags: [['t', 'list'], ['expiration', String(NOW + 60)]] });
    expect(verifyAuth(listAuth, 'delete', NOW, BLOB).ok).toBe(false);
    expect(verifyAuth(listAuth, 'list', NOW).ok).toBe(true);
  });

  it('rejects an expired authorization', () => {
    const expired = signAuth({ tags: [
      ['t', 'upload'], ['x', BLOB], ['expiration', String(NOW - 1)],
    ] });
    expect(verifyAuth(expired, 'upload', NOW, BLOB).error).toMatch(/expired/i);
  });

  it('requires an expiration tag', () => {
    const noExpiry = signAuth({ tags: [['t', 'upload'], ['x', BLOB]] });
    expect(verifyAuth(noExpiry, 'upload', NOW, BLOB).error).toMatch(/expiration/i);
  });

  // A long-lived authorization is effectively a bearer token.
  it('rejects an authorization valid for too long', () => {
    const longLived = signAuth({ tags: [
      ['t', 'upload'], ['x', BLOB], ['expiration', String(NOW + 86400)],
    ] });
    expect(verifyAuth(longLived, 'upload', NOW, BLOB).error).toMatch(/too far in the future/i);
  });

  it('rejects an event dated in the future', () => {
    const future = signAuth({ created_at: NOW + 3600 });
    expect(verifyAuth(future, 'upload', NOW, BLOB).error).toMatch(/future/i);
  });

  // Binding to the hash stops one upload grant storing different content.
  it('rejects an authorization covering a different blob', () => {
    const result = verifyAuth(signAuth(), 'upload', NOW, 'b'.repeat(64));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/does not cover/i);
  });

  it('requires an x tag for upload and delete', () => {
    const noHash = signAuth({ tags: [['t', 'upload'], ['expiration', String(NOW + 60)]] });
    expect(verifyAuth(noHash, 'upload', NOW).error).toMatch(/x tag/i);
  });

  it('rejects a tampered signature', () => {
    const event = signAuth();
    const forged = { ...event, sig: 'f'.repeat(128) };
    expect(verifyAuth(forged, 'upload', NOW, BLOB).ok).toBe(false);
  });

  // The id is recomputed, so editing tags after signing invalidates the event.
  it('rejects an event whose id does not match its contents', () => {
    const event = signAuth();
    const tampered = {
      ...event,
      tags: [['t', 'upload'], ['x', 'b'.repeat(64)], ['expiration', String(NOW + 60)]],
    };
    expect(verifyAuth(tampered, 'upload', NOW).ok).toBe(false);
  });

  it('rejects an event signed by a different key than it claims', () => {
    const other = generateKeypair();
    const event = signAuth({}, other);
    const impersonating = { ...event, pubkey: user.publicKey };
    expect(verifyAuth(impersonating, 'upload', NOW, BLOB).ok).toBe(false);
  });

  it('rejects a malformed pubkey', () => {
    expect(verifyAuth(signAuth({ pubkey: 'nope' }), 'upload', NOW, BLOB).ok).toBe(false);
  });
});

describe('parseBlobPath', () => {
  it('accepts a bare hash and a hash with an extension', () => {
    expect(parseBlobPath(`/${BLOB}`)).toBe(BLOB);
    expect(parseBlobPath(`/${BLOB}.jpg`)).toBe(BLOB);
    expect(parseBlobPath(`/${BLOB}.webp`)).toBe(BLOB);
  });

  it('rejects anything that is not a 64-char hex hash', () => {
    expect(parseBlobPath('/upload')).toBeNull();
    expect(parseBlobPath('/abc.jpg')).toBeNull();
    expect(parseBlobPath(`/${BLOB}/extra`)).toBeNull();
    expect(parseBlobPath(`/${'z'.repeat(64)}`)).toBeNull();
  });
});

describe('isBlossomPath', () => {
  it('claims only media routes', () => {
    expect(isBlossomPath('/upload')).toBe(true);
    expect(isBlossomPath(`/list/${user.publicKey}`)).toBe(true);
    expect(isBlossomPath(`/${BLOB}.jpg`)).toBe(true);
  });

  // A blob hash must never shadow a relay endpoint.
  it('leaves relay routes alone', () => {
    expect(isBlossomPath('/')).toBe(false);
    expect(isBlossomPath('/.well-known/nostr.json')).toBe(false);
    expect(isBlossomPath('/favicon.ico')).toBe(false);
    expect(isBlossomPath('/api/check-payment')).toBe(false);
  });
});
