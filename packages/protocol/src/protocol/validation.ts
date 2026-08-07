/**
 * OpenDating Runtime Validation
 *
 * Lightweight JSON schema validation for OpenDating messages.
 * Infrastructure-independent — no Cloudflare imports.
 */
import type { OpenDatingEnvelope } from './envelope.js';
import { OPENDATING_PROTOCOL, MAX_OD_PAYLOAD_BYTES } from './constants.js';
import { isKnownMessageType, getPayloadValidator } from './message-types.js';
import { isSupportedVersion } from './version.js';

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ODValidationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// Full request validation
// ---------------------------------------------------------------------------

/**
 * Validate a complete OpenDating request envelope.
 * Checks: shape, protocol, version, type, payload, size.
 */
export function validateODRequest(envelope: unknown): ODValidationResult {
  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Envelope must be an object' };
  }

  const e = envelope as Record<string, unknown>;

  // Protocol
  if (e.protocol !== OPENDATING_PROTOCOL) {
    return {
      valid: false,
      errorCode: 'invalid_envelope',
      errorMessage: `Unknown protocol: ${String(e.protocol)}`,
    };
  }

  // Version
  if (typeof e.version !== 'string') {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Missing version' };
  }
  if (!isSupportedVersion(e.version)) {
    return {
      valid: false,
      errorCode: 'unsupported_version',
      errorMessage: `Unsupported version: ${e.version}`,
    };
  }

  // Type
  if (typeof e.type !== 'string' || e.type.length === 0) {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Missing message type' };
  }
  if (!isKnownMessageType(e.type)) {
    return {
      valid: false,
      errorCode: 'unsupported_type',
      errorMessage: `Unknown message type: ${e.type}`,
    };
  }

  // Request ID
  if (typeof e.request_id !== 'string' || e.request_id.length < 8) {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Invalid request_id' };
  }

  // Created at
  if (typeof e.created_at !== 'number' || e.created_at <= 0) {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Invalid created_at' };
  }

  // Payload
  if (typeof e.payload !== 'object' || e.payload === null) {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Payload must be an object' };
  }

  // Payload validation via registered validator
  const payloadValidator = getPayloadValidator(e.type);
  if (payloadValidator && !payloadValidator(e.payload)) {
    return { valid: false, errorCode: 'invalid_envelope', errorMessage: 'Invalid payload for message type' };
  }

  // Size check
  const size = JSON.stringify(e).length;
  if (size > MAX_OD_PAYLOAD_BYTES) {
    return {
      valid: false,
      errorCode: 'payload_too_large',
      errorMessage: `Payload too large: ${size} bytes (max ${MAX_OD_PAYLOAD_BYTES})`,
    };
  }

  return { valid: true };
}
