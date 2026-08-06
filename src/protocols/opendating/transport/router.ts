/**
 * OpenDating Request Router
 *
 * Routes validated requests to the correct service.
 * Handles version negotiation, sender auth, idempotency.
 *
 * This module IS Cloudflare-aware — it calls D1 for idempotency.
 */
import type { OpenDatingEnvelope } from '../protocol/envelope.js';
import { validateODRequest } from '../protocol/validation.js';
import { isSupportedVersion } from '../protocol/version.js';
import { checkRequestFreshness } from '../protocol/envelope.js';
import {
  OD_REQUEST_MAX_AGE_SEC,
  OD_REQUEST_MAX_FUTURE_SEC,
} from '../protocol/constants.js';
import { createErrorEnvelope } from '../protocol/envelope.js';
import type { OpenDatingTransportContext } from './context.js';
import type { ServiceResult } from '../services/interface.js';
import { odServiceRegistry } from '../services/registry.js';

export interface RouteResult {
  success: boolean;
  /** OpenDating response envelope (error on failure) */
  envelope: OpenDatingEnvelope;
  /** If the request was a duplicate (idempotent) */
  duplicate?: boolean;
}

/**
 * Route an OpenDating request through validation, freshness, auth, and service dispatch.
 */
export async function routeRequest(
  envelope: OpenDatingEnvelope,
  ctx: OpenDatingTransportContext,
  idempotencyCheck?: (servicePubkey: string, senderPubkey: string, requestId: string) => Promise<boolean>,
  idempotencyRecord?: (servicePubkey: string, senderPubkey: string, requestId: string, type: string) => Promise<void>,
): Promise<RouteResult> {
  // 1. Validate envelope
  const validation = validateODRequest(envelope);
  if (!validation.valid) {
    return {
      success: false,
      envelope: createErrorEnvelope(
        envelope.request_id || 'unknown',
        validation.errorCode || 'invalid_envelope',
        validation.errorMessage || 'Invalid request',
      ),
    };
  }

  // 2. Version check
  if (!isSupportedVersion(envelope.version)) {
    return {
      success: false,
      envelope: createErrorEnvelope(envelope.request_id, 'unsupported_version',
        `Unsupported version: ${envelope.version}`),
    };
  }

  // 3. Freshness check
  const freshnessError = checkRequestFreshness(
    envelope.created_at,
    OD_REQUEST_MAX_AGE_SEC,
    OD_REQUEST_MAX_FUTURE_SEC,
  );
  if (freshnessError) {
    return {
      success: false,
      envelope: createErrorEnvelope(envelope.request_id,
        envelope.created_at > Math.floor(Date.now() / 1000) ? 'future_request' : 'expired_request',
        freshnessError),
    };
  }

  // 4. Sender auth check (NIP-42 identity must match NIP-59 sender)
  if (ctx.authenticatedPubkey !== ctx.senderPubkey) {
    return {
      success: false,
      envelope: createErrorEnvelope(envelope.request_id, 'sender_auth_mismatch',
        'Authenticated connection identity does not match request sender'),
    };
  }

  // 5. Resolve service
  const service = odServiceRegistry.resolveByRecipient(ctx.servicePubkey);
  if (!service) {
    return {
      success: false,
      envelope: createErrorEnvelope(envelope.request_id, 'unknown_service',
        'Unknown service recipient'),
    };
  }

  // 6. Check service supports this message type
  if (!service.supports(envelope.type)) {
    return {
      success: false,
      envelope: createErrorEnvelope(envelope.request_id, 'unsupported_type',
        `Service ${service.role} does not support ${envelope.type}`),
    };
  }

  // 7. Idempotency check
  if (idempotencyCheck) {
    const isDuplicate = await idempotencyCheck(
      ctx.servicePubkey,
      ctx.senderPubkey,
      envelope.request_id,
    );
    if (isDuplicate) {
      // For duplicate requests, return a generic success (don't re-execute)
      return {
        success: true,
        envelope: createErrorEnvelope(envelope.request_id, 'duplicate_request',
          'Duplicate request — already processed'),
        duplicate: true,
      };
    }
  }

  // 8. Dispatch to service
  try {
    const { toServiceContext } = await import('./context.js');
    const result = await service.handle(envelope, toServiceContext(ctx));

    // Record idempotency
    if (idempotencyRecord) {
      await idempotencyRecord(
        ctx.servicePubkey,
        ctx.senderPubkey,
        envelope.request_id,
        envelope.type,
      ).catch(err => console.error('Failed to record idempotency:', err));
    }

    return { success: true, envelope: result.response };
  } catch (error) {
    console.error(`Service error (${service.role}/${envelope.type}):`, error);
    return {
      success: false,
      envelope: createErrorEnvelope(envelope.request_id, 'internal_error',
        'Internal processing error'),
    };
  }
}
