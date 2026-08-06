/**
 * OpenDating Request Context
 *
 * Extends the generic RelayContext with OpenDating-specific fields.
 */
import type { RelayContext } from '../../../relay/policy/interface.js';
import type { OpenDatingServiceContext } from '../services/interface.js';

/**
 * Full OpenDating transport context.
 */
export interface OpenDatingTransportContext {
  /** Generic relay context (NIP-42 auth, session, connection) */
  relayContext: RelayContext;
  /** The authenticated pubkey from NIP-42 */
  authenticatedPubkey: string;
  /** The verified sender from the inner NIP-59 rumor */
  senderPubkey: string;
  /** The service recipient pubkey */
  servicePubkey: string;
  /** Protocol version from the envelope */
  protocolVersion: string;
  /** Request ID for idempotency and correlation */
  requestId: string;
  /** When the request was received (unix ms) */
  receivedAt: number;
}

/**
 * Convert transport context to service context.
 */
export function toServiceContext(ctx: OpenDatingTransportContext): OpenDatingServiceContext {
  return {
    authenticatedPubkey: ctx.authenticatedPubkey,
    senderPubkey: ctx.senderPubkey,
    servicePubkey: ctx.servicePubkey,
    protocolVersion: ctx.protocolVersion,
    receivedAt: Math.floor(ctx.receivedAt / 1000),
    requestId: ctx.requestId,
  };
}
