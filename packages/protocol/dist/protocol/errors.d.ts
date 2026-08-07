/**
 * OpenDating Error Codes
 *
 * Stable machine-readable error identifiers.
 * Do not leak internal details through error messages.
 */
export declare const OD_ERROR_CODES: {
    readonly INVALID_ENVELOPE: "invalid_envelope";
    readonly UNSUPPORTED_VERSION: "unsupported_version";
    readonly UNSUPPORTED_TYPE: "unsupported_type";
    readonly EXPIRED_REQUEST: "expired_request";
    readonly FUTURE_REQUEST: "future_request";
    readonly DUPLICATE_REQUEST: "duplicate_request";
    readonly SENDER_AUTH_MISMATCH: "sender_auth_mismatch";
    readonly UNKNOWN_SERVICE: "unknown_service";
    readonly SERVICE_UNAVAILABLE: "service_unavailable";
    readonly INTERNAL_ERROR: "internal_error";
    readonly RATE_LIMITED: "rate_limited";
    readonly UNAUTHORIZED: "unauthorized";
    readonly PAYLOAD_TOO_LARGE: "payload_too_large";
};
export type ODErrorCode = typeof OD_ERROR_CODES[keyof typeof OD_ERROR_CODES];
/**
 * Safe error messages for clients (no stack traces, secrets, or internals).
 */
export declare const OD_ERROR_MESSAGES: Record<ODErrorCode, string>;
//# sourceMappingURL=errors.d.ts.map