/**
 * OpenDating Extension
 *
 * Registers with the generic Nostr relay extension registry.
 * Handles incoming NIP-59 gift wraps addressed to OpenDating service identities.
 *
 * This is the bridge between the generic relay and the OpenDating protocol core.
 *
 * This module IS Cloudflare-aware — it uses D1Environment for idempotency.
 */
import type { RelayExtension, RelayContext, ExtensionResult } from '../../relay/policy/interface.js';
import type { NostrEvent } from '../../types.js';
import { nip44Decrypt } from './crypto/encryption.js';
import type { OpenDatingEnvelope } from './protocol/envelope.js';
import { routeRequest } from './transport/router.js';
import { odServiceRegistry } from './services/registry.js';
import { serviceIdentityRegistry } from './identities/registry.js';
import { createEnvelope, createErrorEnvelope } from './protocol/envelope.js';
import { OPENDATING_PROTOCOL, OPENDATING_VERSION } from './protocol/constants.js';
import { D1IdempotencyStore } from './storage/d1/idempotency.js';
import { buildServiceResponseGiftWrap } from './crypto/gift-wrap.js';
import { logger } from '../../shared/logger.js';
import { moderateContent, shouldBlock } from '../../cloudflare/moderation.js';

// ---------------------------------------------------------------------------
// Extension state
// ---------------------------------------------------------------------------

let idempotencyStore: D1IdempotencyStore | null = null;

/**
 * Initialize the OpenDating extension with D1 binding.
 * Call once at startup.
 */
export function initOpenDatingExtension(db: D1Database): void {
  idempotencyStore = new D1IdempotencyStore(db);
}

// ---------------------------------------------------------------------------
// Event recognition
// ---------------------------------------------------------------------------

/**
 * Determine if this gift wrap event is addressed to an OpenDating service.
 * Only claims events where:
 *   1. kind == 1059 (NIP-59 gift wrap)
 *   2. At least one #p tag matches a registered OpenDating service pubkey
 */
function isAddressedToService(event: NostrEvent): { servicePubkey: string } | null {
  if (event.kind !== 1059) return null;

  const pTags = event.tags.filter(t => t[0] === 'p').map(t => t[1]);
  for (const pTag of pTags) {
    if (serviceIdentityRegistry.isServicePubkey(pTag)) {
      return { servicePubkey: pTag };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Gift wrap decryption + rumor parsing
// ---------------------------------------------------------------------------

interface DecryptedRequest {
  envelope: OpenDatingEnvelope;
  rumorEvent: NostrEvent;
  senderPubkey: string;
}

/**
 * Decrypt a gift wrap and parse the inner OpenDating envelope.
 */
async function decryptAndParse(
  event: NostrEvent,
  servicePubkey: string,
): Promise<DecryptedRequest | null> {
  try {
    // Get the service signer for decryption
    const signer = serviceIdentityRegistry.getSigner(servicePubkey);
    if (!signer) {
      logger.warn('No signer available for service', { pubkey: servicePubkey.substring(0, 8) });
      return null;
    }

    // 1. Decrypt the gift wrap outer layer (NIP-44)
    const sealJson = await nip44Decrypt(
      event.content,
      signer.privateKey,
      event.pubkey, // ephemeral wrapper pubkey
    );
    const seal: NostrEvent = JSON.parse(sealJson);

    if (seal.kind !== 13) {
      logger.warn('Inner seal is not kind 13', { kind: seal.kind });
      return null;
    }

    // 2. Decrypt the seal to get the rumor
    const rumorJson = await nip44Decrypt(
      seal.content,
      signer.privateKey,
      seal.pubkey, // sender's pubkey from the seal
    );
    const rumor: NostrEvent = JSON.parse(rumorJson);

    if (rumor.kind !== 78) {
      logger.warn('Inner rumor is not kind 78', { kind: rumor.kind });
      return null;
    }

    // 3. Parse the OpenDating envelope from rumor content
    const envelope = JSON.parse(rumor.content) as OpenDatingEnvelope;

    if (envelope.protocol !== OPENDATING_PROTOCOL) {
      return null; // Not an OpenDating message
    }

    return {
      envelope,
      rumorEvent: rumor,
      senderPubkey: seal.pubkey, // The actual sender (from the seal)
    };

  } catch (error) {
    logger.warn('Failed to decrypt/parse gift wrap', {
      error: (error as Error).message,
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Response delivery
// ---------------------------------------------------------------------------

/**
 * Publish an OpenDating response back to the sender via NIP-59.
 * The response is encrypted and gift-wrapped for the requesting user.
 */
async function sendResponse(
  envelope: OpenDatingEnvelope,
  senderPubkey: string,
  servicePubkey: string,
  env: any,
): Promise<NostrEvent | null> {
  try {
    const signer = serviceIdentityRegistry.getSigner(servicePubkey);
    if (!signer) {
      logger.error('Cannot send response — no signer for service', { servicePubkey: servicePubkey.substring(0, 8) });
      return null;
    }

    // Build the response gift wrap
    const responseJson = JSON.stringify(envelope);
    const { giftWrap } = await buildServiceResponseGiftWrap(
      78,  // rumor kind for application messages
      responseJson,
      signer.privateKey,
      signer.pubkey,
      senderPubkey,
    );

    // Persist so a client that reconnects can still fetch the reply.
    if (env.RELAY_DATABASE) {
      const { processEvent } = await import('../../relay-worker.js');
      await processEvent(giftWrap, 'opendating-service-response', env);
      logger.info('Published OpenDating response', {
        type: envelope.type,
        requestId: envelope.request_id,
        recipient: senderPubkey.substring(0, 8),
      });
    }

    // Returned for live broadcast. Persistence alone leaves the requester
    // waiting on a subscription that never fires.
    return giftWrap as unknown as NostrEvent;
  } catch (error) {
    logger.error('Failed to send OpenDating response', {
      error: (error as Error).message,
      type: envelope.type,
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// AI Content Moderation
// ---------------------------------------------------------------------------

/**
 * Screen profile content through Workers AI before allowing create/update.
 * Degrades open: if AI is unavailable, content passes through.
 * Only blocks high-confidence violations to avoid false positives.
 */
async function screenProfileContent(
  envelope: OpenDatingEnvelope,
  senderPubkey: string,
  context: RelayContext,
): Promise<void> {
  try {
    const payload = envelope.payload;
    const profile = payload?.profile as Record<string, unknown> | undefined;
    if (!profile) return;

    const bio = typeof profile.bio === 'string' ? profile.bio : '';
    const name = typeof profile.display_name === 'string' ? profile.display_name : '';
    const text = [name, bio].filter(Boolean).join(' ');

    if (text.length < 3) return;

    const env = (context as any)._env;
    if (!env?.AI) return;

    const result = await moderateContent(env.AI, text, 'profile_bio');

    if (shouldBlock(result)) {
      logger.warn('[moderation] Blocked profile content', {
        senderPrefix: senderPubkey.slice(0, 8),
        flags: result.flags,
        confidence: result.confidence,
      });
      throw new Error(`Profile content rejected: ${result.explanation}`);
    }

    if (result.flags.length > 0) {
      logger.info('[moderation] Flagged profile (allowed through)', {
        senderPrefix: senderPubkey.slice(0, 8),
        flags: result.flags,
      });
    }
  } catch (err) {
    if ((err as Error).message?.startsWith('Profile content rejected:')) throw err;
    logger.error('[moderation] screenProfileContent error');
  }
}

// ---------------------------------------------------------------------------
// Extension implementation
// ---------------------------------------------------------------------------

export const openDatingExtension: RelayExtension = {
  name: 'opendating',

  canHandleEvent(event: NostrEvent, _context: RelayContext): boolean {
    const match = isAddressedToService(event);
    return match !== null;
  },

  async handleEvent(event: NostrEvent, context: RelayContext): Promise<ExtensionResult> {
    // Determine which service this gift wrap is addressed to
    const match = isAddressedToService(event);
    if (!match) {
      return { handled: false };
    }

    const { servicePubkey } = match;

    // Decrypt and parse the request
    const decrypted = await decryptAndParse(event, servicePubkey);
    if (!decrypted) {
      // Could not decrypt — likely not an OpenDating message, or malformed
      // Don't error — let the event be stored normally
      return { handled: false };
    }

    const { envelope, senderPubkey } = decrypted;

    // AI content moderation for profile operations
    if (envelope.type === 'profile.create' || envelope.type === 'profile.update') {
      try {
        await screenProfileContent(envelope, senderPubkey, context);
      } catch (modErr) {
        // Moderation blocked this content — return error to client
        const errMsg = (modErr as Error).message || 'Content rejected by moderation';
        const env = (context as any)._env;
        if (env) {
          const errorEnvelope = createErrorEnvelope(
            envelope.request_id,
            'content_rejected',
            errMsg,
          );
          await sendResponse(errorEnvelope, senderPubkey, servicePubkey, env);
        }
        return { handled: true, storeNormally: false, message: errMsg };
      }
    }

    // Build transport context
    const transportCtx = {
      relayContext: context,
      authenticatedPubkey: context.authenticatedPubkey || '',
      senderPubkey,
      servicePubkey,
      protocolVersion: envelope.version,
      requestId: envelope.request_id,
      receivedAt: Date.now(),
    };

    // Route the request
    const result = await routeRequest(
      envelope,
      transportCtx,
      // Idempotency check
      idempotencyStore
        ? (spk, sp, rid) => idempotencyStore!.isDuplicate(spk, sp, rid)
        : undefined,
      // Idempotency record
      idempotencyStore
        ? (spk, sp, rid, type) => idempotencyStore!.record(spk, sp, rid, type)
        : undefined,
    );

    // Send response back to the requesting user
    // Use a type assertion for env since the DO has it
    const env = (context as any)._env;
    const responseEvent = env
      ? await sendResponse(result.envelope, senderPubkey, servicePubkey, env)
      : null;

    // Always claim as handled (don't store normally — gift wraps are transport)
    return {
      handled: true,
      storeNormally: false,
      message: result.success ? '' : (result.envelope.type === 'system.error' ? 'error' : ''),
      publish: responseEvent ? [responseEvent] : undefined,
    };
  },

  async authorizeQuery(_filters, _context) {
    // OpenDating does not restrict queries — queries go through normal relay
    return { allowed: true };
  },
};
