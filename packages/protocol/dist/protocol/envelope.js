/**
 * OpenDating Message Envelope
 *
 * Every OpenDating application message must use this envelope.
 * Infrastructure-independent — no Cloudflare imports.
 */
import { OPENDATING_PROTOCOL } from './constants.js';
// ---------------------------------------------------------------------------
// Envelope construction
// ---------------------------------------------------------------------------
/**
 * Create a minimal OpenDating envelope.
 */
export function createEnvelope(type, requestId, payload = {}, version = '0.1') {
    return {
        protocol: OPENDATING_PROTOCOL,
        version,
        type,
        request_id: requestId,
        created_at: Math.floor(Date.now() / 1000),
        payload,
    };
}
/**
 * Create an error response envelope.
 */
export function createErrorEnvelope(requestId, code, message) {
    return {
        protocol: OPENDATING_PROTOCOL,
        version: '0.1',
        type: 'system.error',
        request_id: requestId,
        created_at: Math.floor(Date.now() / 1000),
        payload: { code, message },
    };
}
/**
 * Validate an OpenDating envelope against protocol requirements.
 */
export function validateEnvelope(envelope, options) {
    if (!envelope || typeof envelope !== 'object') {
        return { valid: false, error: 'Envelope must be an object', errorCode: 'invalid_envelope' };
    }
    const e = envelope;
    // Check protocol field
    if (e.protocol !== OPENDATING_PROTOCOL) {
        return { valid: false, error: `Unknown protocol: ${String(e.protocol)}`, errorCode: 'invalid_envelope' };
    }
    // Check version field
    if (typeof e.version !== 'string') {
        return { valid: false, error: 'Missing version field', errorCode: 'invalid_envelope' };
    }
    // Check type field
    if (typeof e.type !== 'string' || e.type.length === 0) {
        return { valid: false, error: 'Missing or invalid type field', errorCode: 'invalid_envelope' };
    }
    // Check request_id
    if (typeof e.request_id !== 'string' || e.request_id.length === 0) {
        return { valid: false, error: 'Missing or invalid request_id', errorCode: 'invalid_envelope' };
    }
    // Check created_at
    if (typeof e.created_at !== 'number' || e.created_at <= 0) {
        return { valid: false, error: 'Missing or invalid created_at', errorCode: 'invalid_envelope' };
    }
    // Check payload
    if (typeof e.payload !== 'object' || e.payload === null) {
        return { valid: false, error: 'Payload must be an object', errorCode: 'invalid_envelope' };
    }
    // Size check
    if (options?.maxSizeBytes) {
        const size = JSON.stringify(e).length;
        if (size > options.maxSizeBytes) {
            return { valid: false, error: `Payload too large: ${size} bytes`, errorCode: 'invalid_envelope' };
        }
    }
    return { valid: true };
}
/**
 * Check request freshness.
 * Returns null if fresh, error string if stale/future.
 */
export function checkRequestFreshness(created_at, maxAgeSec = 300, maxFutureSec = 60) {
    const now = Math.floor(Date.now() / 1000);
    const age = now - created_at;
    if (age > maxAgeSec) {
        return `Request expired: ${age}s old (max ${maxAgeSec}s)`;
    }
    if (age < -maxFutureSec) {
        return `Request from the future: ${-age}s ahead (max ${maxFutureSec}s)`;
    }
    return null;
}
//# sourceMappingURL=envelope.js.map