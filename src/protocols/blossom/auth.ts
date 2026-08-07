/**
 * Blossom authorization (BUD-01).
 *
 * A request is authorized by a kind 24242 Nostr event passed as
 * `Authorization: Nostr <base64-encoded-event>`. The event is signed by the
 * uploader, so possession of the key — not a bearer token the server issued —
 * is what grants access. That keeps media consistent with the rest of the
 * protocol: no accounts, no sessions, no server-held credentials.
 *
 * Per BUD-01 the event must carry:
 *   t          — the verb being authorized (upload | list | delete | get)
 *   expiration — unix seconds; the event is invalid after this
 *   x          — sha256 of the blob, required for upload and delete
 */
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '../opendating/crypto/encryption.js';

export const BLOSSOM_AUTH_KIND = 24242;

/** Reject authorizations valid for longer than this. */
const MAX_AUTH_LIFETIME_SEC = 10 * 60;

export interface BlossomAuthEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export type BlossomVerb = 'upload' | 'list' | 'delete' | 'get';

export interface AuthResult {
  ok: boolean;
  pubkey?: string;
  error?: string;
}

function tagValue(event: BlossomAuthEvent, name: string): string | undefined {
  return event.tags.find((t) => t[0] === name)?.[1];
}

function tagValues(event: BlossomAuthEvent, name: string): string[] {
  return event.tags.filter((t) => t[0] === name).map((t) => t[1]);
}

/** Recompute the NIP-01 event id so a forged id cannot ride along. */
function computeEventId(event: BlossomAuthEvent): string {
  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  return bytesToHex(sha256(new TextEncoder().encode(serialized)));
}

export function parseAuthHeader(header: string | null): BlossomAuthEvent | null {
  if (!header) return null;

  const match = /^Nostr\s+(.+)$/i.exec(header.trim());
  if (!match) return null;

  try {
    // atob is available in Workers; decode base64 then parse.
    const json = atob(match[1]);
    const parsed = JSON.parse(json) as BlossomAuthEvent;
    if (typeof parsed?.pubkey !== 'string' || !Array.isArray(parsed?.tags)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Verify a Blossom authorization event for a given verb, and optionally for a
 * specific blob hash.
 */
export function verifyAuth(
  event: BlossomAuthEvent | null,
  verb: BlossomVerb,
  now: number,
  blobHash?: string,
): AuthResult {
  if (!event) return { ok: false, error: 'Missing Authorization header' };
  if (event.kind !== BLOSSOM_AUTH_KIND) {
    return { ok: false, error: `Authorization must be kind ${BLOSSOM_AUTH_KIND}` };
  }
  if (!/^[0-9a-f]{64}$/i.test(event.pubkey)) {
    return { ok: false, error: 'Malformed pubkey' };
  }

  // The verb is what stops a `list` authorization being replayed as a delete.
  const verbs = tagValues(event, 't');
  if (!verbs.includes(verb)) {
    return { ok: false, error: `Authorization is not valid for "${verb}"` };
  }

  const expiration = Number(tagValue(event, 'expiration'));
  if (!Number.isFinite(expiration)) {
    return { ok: false, error: 'Authorization must carry an expiration tag' };
  }
  if (expiration <= now) {
    return { ok: false, error: 'Authorization has expired' };
  }
  // A long-lived authorization is effectively a bearer token: cap the window
  // so a leaked event stops being useful quickly.
  if (expiration - now > MAX_AUTH_LIFETIME_SEC) {
    return { ok: false, error: 'Authorization expiration is too far in the future' };
  }
  // Reject events dated meaningfully in the future — a clock-skewed client is
  // fine, a replay from a forged timestamp is not.
  if (event.created_at > now + 300) {
    return { ok: false, error: 'Authorization is dated in the future' };
  }

  // Binding to the blob hash stops an upload authorization for one file being
  // reused to store a different one.
  if (verb === 'upload' || verb === 'delete') {
    const hashes = tagValues(event, 'x').map((h) => h.toLowerCase());
    if (hashes.length === 0) {
      return { ok: false, error: 'Authorization must carry an x tag with the blob hash' };
    }
    if (blobHash && !hashes.includes(blobHash.toLowerCase())) {
      return { ok: false, error: 'Authorization does not cover this blob' };
    }
  }

  if (computeEventId(event) !== event.id?.toLowerCase()) {
    return { ok: false, error: 'Authorization id does not match its contents' };
  }

  try {
    const valid = schnorr.verify(
      hexToBytes(event.sig),
      hexToBytes(event.id),
      hexToBytes(event.pubkey),
    );
    if (!valid) return { ok: false, error: 'Invalid signature' };
  } catch {
    return { ok: false, error: 'Invalid signature' };
  }

  return { ok: true, pubkey: event.pubkey.toLowerCase() };
}
