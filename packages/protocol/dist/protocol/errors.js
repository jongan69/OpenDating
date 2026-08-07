/**
 * OpenDating Error Codes
 *
 * Stable machine-readable error identifiers.
 * Do not leak internal details through error messages.
 */
export const OD_ERROR_CODES = {
    INVALID_ENVELOPE: 'invalid_envelope',
    UNSUPPORTED_VERSION: 'unsupported_version',
    UNSUPPORTED_TYPE: 'unsupported_type',
    EXPIRED_REQUEST: 'expired_request',
    FUTURE_REQUEST: 'future_request',
    DUPLICATE_REQUEST: 'duplicate_request',
    SENDER_AUTH_MISMATCH: 'sender_auth_mismatch',
    UNKNOWN_SERVICE: 'unknown_service',
    SERVICE_UNAVAILABLE: 'service_unavailable',
    INTERNAL_ERROR: 'internal_error',
    RATE_LIMITED: 'rate_limited',
    UNAUTHORIZED: 'unauthorized',
    PAYLOAD_TOO_LARGE: 'payload_too_large',
};
/**
 * Safe error messages for clients (no stack traces, secrets, or internals).
 */
export const OD_ERROR_MESSAGES = {
    invalid_envelope: 'Invalid OpenDating envelope',
    unsupported_version: 'Unsupported protocol version',
    unsupported_type: 'Unsupported message type',
    expired_request: 'Request has expired',
    future_request: 'Request timestamp is too far in the future',
    duplicate_request: 'Duplicate request ID',
    sender_auth_mismatch: 'Sender identity does not match authenticated connection',
    unknown_service: 'Unknown service recipient',
    service_unavailable: 'Service is currently unavailable',
    internal_error: 'Internal processing error',
    rate_limited: 'Rate limit exceeded',
    unauthorized: 'Not authorized for this operation',
    payload_too_large: 'Request payload exceeds size limit',
};
//# sourceMappingURL=errors.js.map