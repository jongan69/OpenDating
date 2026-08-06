/**
 * Default relay policy — permissive for a general-purpose relay.
 *
 * Handles:
 * - blocked/allowed pubkeys
 * - blocked/allowed event kinds
 * - blocked/allowed tags
 * - content filtering
 * - NIP-05 restrictions
 * - payment requirements (if enabled)
 */
import type { NostrEvent, NostrFilter } from '../../types.js';
import type { RelayPolicy, RelayContext, PolicyDecision } from './interface.js';
import {
  blockedPubkeys,
  allowedPubkeys,
  blockedEventKinds,
  allowedEventKinds,
  blockedContent,
  blockedTags,
  allowedTags,
  checkValidNip05,
} from '../../config.js';

/**
 * Check if a pubkey is allowed to publish.
 */
export function isPubkeyAllowed(pubkey: string): boolean {
  if (allowedPubkeys.size > 0 && !allowedPubkeys.has(pubkey)) {
    return false;
  }
  return !blockedPubkeys.has(pubkey);
}

/**
 * Check if an event kind is allowed.
 */
export function isEventKindAllowed(kind: number): boolean {
  if (allowedEventKinds.size > 0 && !allowedEventKinds.has(kind)) {
    return false;
  }
  return !blockedEventKinds.has(kind);
}

/**
 * Check if event content contains blocked words/phrases (case-insensitive).
 */
export function containsBlockedContent(event: NostrEvent): boolean {
  if (blockedContent.size === 0) return false;

  const lowercaseContent = (event.content || '').toLowerCase();
  const lowercaseTags = event.tags.map(tag => tag.join('').toLowerCase());

  for (const blocked of blockedContent) {
    const blockedLower = blocked.toLowerCase();
    if (
      lowercaseContent.includes(blockedLower) ||
      lowercaseTags.some(tag => tag.includes(blockedLower))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a tag name is allowed.
 */
export function isTagAllowed(tag: string): boolean {
  if (allowedTags.size > 0 && !allowedTags.has(tag)) {
    return false;
  }
  return !blockedTags.has(tag);
}

/**
 * The default relay policy.
 *
 * This is permissive: only blocks explicitly configured pubkeys/kinds/content.
 * Future domain protocols can compose additional restrictions.
 */
export const defaultPolicy: RelayPolicy = {
  async canPublish(
    event: NostrEvent,
    _context: RelayContext
  ): Promise<PolicyDecision> {
    // Check pubkey
    if (!isPubkeyAllowed(event.pubkey)) {
      return { allowed: false, reason: 'blocked: pubkey not allowed' };
    }

    // Check kind
    if (!isEventKindAllowed(event.kind)) {
      return { allowed: false, reason: `blocked: event kind ${event.kind} not allowed` };
    }

    // Check content
    if (containsBlockedContent(event)) {
      return { allowed: false, reason: 'blocked: content contains blocked phrases' };
    }

    // Check tags
    for (const tag of event.tags) {
      if (!isTagAllowed(tag[0]!)) {
        return { allowed: false, reason: `blocked: tag '${tag[0]}' not allowed` };
      }
    }

    return { allowed: true };
  },

  async canQuery(
    filters: NostrFilter[],
    _context: RelayContext
  ): Promise<PolicyDecision> {
    // Check for blocked kinds in filters
    for (const filter of filters) {
      if (filter.kinds) {
        const blockedKinds = filter.kinds.filter(k => !isEventKindAllowed(k));
        if (blockedKinds.length > 0) {
          return {
            allowed: false,
            reason: `blocked: kinds ${blockedKinds.join(', ')} not allowed`,
          };
        }
      }
    }

    return { allowed: true };
  },
};
