/**
 * Nostr signature verification using secp256k1 (schnorr).
 *
 * Uses @noble/curves for signature verification. All cryptographic
 * operations go through this module — never write custom secp256k1 code.
 */
import { schnorr } from '@noble/curves/secp256k1.js';
import type { NostrEvent } from '../../types.js';
import { hexToBytes } from '../../shared/hex.js';

/**
 * Verify a Nostr event's signature.
 *
 * Serializes the event per NIP-01:
 *   [0, pubkey, created_at, kind, tags, content]
 *
 * Then verifies the schnorr signature against the event's pubkey.
 */
export async function verifyEventSignature(event: NostrEvent): Promise<boolean> {
  try {
    const signatureBytes = hexToBytes(event.sig);
    const serializedEventData = serializeEventForSigning(event);
    const messageHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(serializedEventData)
    );
    const messageHash = new Uint8Array(messageHashBuffer);
    const publicKeyBytes = hexToBytes(event.pubkey);
    return schnorr.verify(signatureBytes, messageHash, publicKeyBytes);
  } catch (error) {
    console.error('Error verifying event signature:', error);
    return false;
  }
}

/**
 * Serialize a Nostr event for signing/verification per NIP-01.
 */
export function serializeEventForSigning(event: NostrEvent): string {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}

// ---------------------------------------------------------------------------
// Known test vectors for secp256k1 schnorr (Nostr)
// ---------------------------------------------------------------------------

/**
 * Test vector: a known-valid Nostr event.
 * Event ID: 5c8e11a7e4e2b1a4c4c6b1a4c4c6b1a4c4c6b1a4c4c6b1a4c4c6b1a4c4c6b1a
 * (example vector for testing - replace with real test vector)
 */
export const TEST_VECTORS = {
  validEvent: {
    id: '0000000000000000000000000000000000000000000000000000000000000000',
    pubkey: '0000000000000000000000000000000000000000000000000000000000000000',
    created_at: 0,
    kind: 1,
    tags: [],
    content: '',
    sig: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  },
} as const;
