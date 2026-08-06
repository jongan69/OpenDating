/**
 * Nostr protocol validation — canonical event/filter validation.
 *
 * Every incoming event MUST pass through this pipeline.
 * No alternate path should bypass validation.
 */
import type { NostrEvent, NostrFilter } from '../../types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hex characters only */
const HEX_RE = /^[a-f0-9]{64}$/;

/** Maximum event sizes */
export const MAX_EVENT_SIZE_BYTES = 70_000;
export const MAX_CONTENT_LENGTH = 65_000;
export const MAX_TAG_COUNT = 2000;
export const MAX_TAG_VALUE_LENGTH = 1024;

/** Subscription limits */
export const MAX_SUBSCRIPTION_ID_LENGTH = 64;
export const MAX_FILTER_IDS = 5000;

// ---------------------------------------------------------------------------
// Event validation
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a Nostr event's shape before any crypto or DB work.
 */
export function validateEventShape(event: unknown): event is NostrEvent {
  if (!event || typeof event !== 'object') return false;

  const e = event as Record<string, unknown>;

  // Required fields exist
  if (typeof e.id !== 'string' || !HEX_RE.test(e.id)) return false;
  if (typeof e.pubkey !== 'string' || !HEX_RE.test(e.pubkey)) return false;
  if (typeof e.sig !== 'string' || e.sig.length !== 128) return false;
  if (typeof e.created_at !== 'number' || e.created_at < 0) return false;
  if (typeof e.kind !== 'number' || !Number.isInteger(e.kind) || e.kind < 0) return false;
  if (!Array.isArray(e.tags)) return false;
  if (typeof e.content !== 'string') return false;

  return true;
}

/**
 * Validate all tags are well-formed (string array elements).
 */
export function validateTags(tags: unknown): tags is string[][] {
  if (!Array.isArray(tags)) return false;
  return tags.every(tag =>
    Array.isArray(tag) && tag.every(t => typeof t === 'string')
  );
}

/**
 * Check event size limits.
 * Returns error message or null if valid.
 */
export function validateEventSize(event: NostrEvent): string | null {
  // Tag count
  if (event.tags.length > MAX_TAG_COUNT) {
    return `Too many tags: ${event.tags.length} (max ${MAX_TAG_COUNT})`;
  }

  // Content length
  if (event.content.length > MAX_CONTENT_LENGTH) {
    return `Content too long: ${event.content.length} (max ${MAX_CONTENT_LENGTH})`;
  }

  // Tag value lengths
  for (const tag of event.tags) {
    for (const val of tag) {
      if (val.length > MAX_TAG_VALUE_LENGTH) {
        return `Tag value too long (max ${MAX_TAG_VALUE_LENGTH})`;
      }
    }
  }

  return null;
}

/**
 * Validate event kind is within valid range.
 */
export function isValidKind(kind: number): boolean {
  return Number.isInteger(kind) && kind >= 0 && kind <= 2_147_483_647;
}

// ---------------------------------------------------------------------------
// Filter validation
// ---------------------------------------------------------------------------

/**
 * Validate a Nostr filter.
 * Returns error message or null if valid.
 */
export function validateFilter(filter: unknown): filter is NostrFilter {
  if (!filter || typeof filter !== 'object') return false;

  const f = filter as Record<string, unknown>;

  // Validate IDs
  if (f.ids !== undefined) {
    if (!Array.isArray(f.ids)) return false;
    if (f.ids.length > MAX_FILTER_IDS) return false;
    if (!f.ids.every((id: unknown) => typeof id === 'string' && HEX_RE.test(id as string))) return false;
  }

  // Validate authors
  if (f.authors !== undefined) {
    if (!Array.isArray(f.authors)) return false;
    if (!f.authors.every((a: unknown) => typeof a === 'string' && HEX_RE.test(a as string))) return false;
  }

  // Validate kinds
  if (f.kinds !== undefined) {
    if (!Array.isArray(f.kinds)) return false;
    if (!f.kinds.every((k: unknown) => typeof k === 'number' && Number.isInteger(k))) return false;
  }

  // Validate numeric fields
  if (f.since !== undefined && (typeof f.since !== 'number' || f.since < 0)) return false;
  if (f.until !== undefined && (typeof f.until !== 'number' || f.until < 0)) return false;
  if (f.limit !== undefined && (typeof f.limit !== 'number' || f.limit < 0)) return false;

  return true;
}

/**
 * Validate a subscription ID string.
 */
export function isValidSubscriptionId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= MAX_SUBSCRIPTION_ID_LENGTH;
}

// ---------------------------------------------------------------------------
// Event classification
// ---------------------------------------------------------------------------

/**
 * Determine if an event is replaceable (NIP-16).
 * Kinds 0, 3, 10000-19999
 */
export function isReplaceableEvent(kind: number): boolean {
  return kind === 0 || kind === 3 || (kind >= 10000 && kind < 20000);
}

/**
 * Determine if an event is parameterized replaceable (NIP-33).
 * Kinds 30000-39999
 */
export function isParameterizedReplaceableEvent(kind: number): boolean {
  return kind >= 30000 && kind < 40000;
}

/**
 * Determine if an event is ephemeral (NIP-16).
 * Kinds 20000-29999 — broadcast only, never stored.
 */
export function isEphemeralEvent(kind: number): boolean {
  return kind >= 20000 && kind < 30000;
}

/**
 * Determine if an event is a deletion request (NIP-09).
 * Kind 5
 */
export function isDeletionEvent(kind: number): boolean {
  return kind === 5;
}

/**
 * Determine if an event is a gift wrap (NIP-59).
 * Kind 1059
 */
export function isGiftWrap(kind: number): boolean {
  return kind === 1059;
}

/**
 * Determine if an event is an auth event (NIP-42).
 * Kind 22242
 */
export function isAuthEvent(kind: number): boolean {
  return kind === 22242;
}

/**
 * Check if a kind is considered "protected" for retention purposes.
 * Identity and configuration kinds should not be pruned.
 */
export function isProtectedKind(kind: number): boolean {
  return kind === 0 || kind === 3 || kind === 10002;
}
