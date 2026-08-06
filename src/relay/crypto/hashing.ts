/**
 * Cryptographic hashing utilities for Nostr.
 */
import type { NostrEvent } from '../../types.js';
import { bytesToHex } from '../../shared/hex.js';

/**
 * Compute the SHA-256 hash of a string.
 */
export async function sha256(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Compute Nostr event ID per NIP-01:
 *   sha256(serializeEventForSigning(event))
 */
export async function computeEventId(event: Omit<NostrEvent, 'id' | 'sig'>): Promise<string> {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  return sha256(serialized);
}

/**
 * Content hashing for anti-spam duplicate detection.
 */
export async function hashContent(
  event: NostrEvent,
  globalDuplicateCheck: boolean = false
): Promise<string> {
  const contentToHash = globalDuplicateCheck
    ? JSON.stringify({ kind: event.kind, tags: event.tags, content: event.content })
    : JSON.stringify({ pubkey: event.pubkey, kind: event.kind, tags: event.tags, content: event.content });

  return sha256(contentToHash);
}

/**
 * Generate a secure random hex string for auth challenges.
 */
export function generateRandomHex(bytes: number = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a UUID v4.
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
