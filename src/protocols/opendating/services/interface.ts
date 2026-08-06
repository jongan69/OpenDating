/**
 * OpenDating Service Interface
 *
 * Every OpenDating service must implement this interface.
 * Infrastructure-independent.
 */
import type { OpenDatingEnvelope } from '../protocol/envelope.js';

/**
 * Context provided to service handlers.
 */
export interface OpenDatingServiceContext {
  /** The authenticated NIP-42 pubkey */
  authenticatedPubkey: string;
  /** The verified sender from the inner NIP-59 rumor */
  senderPubkey: string;
  /** The service recipient pubkey */
  servicePubkey: string;
  /** Protocol version used by the request */
  protocolVersion: string;
  /** When the request was received (unix seconds) */
  receivedAt: number;
  /** Request ID for idempotency */
  requestId: string;
}

/**
 * Result from handling an OpenDating request.
 */
export interface ServiceResult {
  /** The response envelope to send back */
  response: OpenDatingEnvelope;
}

/**
 * OpenDating service handler.
 */
export interface OpenDatingService {
  /** The service role */
  role: string;

  /** The service's Nostr public key */
  pubkey: string;

  /** Check if this service supports a message type */
  supports(type: string): boolean;

  /** Handle a request and return a response */
  handle(
    request: OpenDatingEnvelope,
    context: OpenDatingServiceContext,
  ): Promise<ServiceResult>;
}
