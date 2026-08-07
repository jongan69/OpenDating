export interface OpenDatingEnvelope {
    protocol: string;
    version: string;
    type: string;
    request_id: string;
    created_at: number;
    payload: Record<string, unknown>;
}
export interface OpenDatingRequest extends OpenDatingEnvelope {
}
export interface OpenDatingResponse extends OpenDatingEnvelope {
}
export interface OpenDatingErrorResponse extends OpenDatingResponse {
    type: 'system.error';
    payload: {
        code: string;
        message: string;
    };
}
/**
 * Create a minimal OpenDating envelope.
 */
export declare function createEnvelope(type: string, requestId: string, payload?: Record<string, unknown>, version?: string): OpenDatingEnvelope;
/**
 * Create an error response envelope.
 */
export declare function createErrorEnvelope(requestId: string, code: string, message: string): OpenDatingErrorResponse;
export interface EnvelopeValidationResult {
    valid: boolean;
    error?: string;
    errorCode?: string;
}
/**
 * Validate an OpenDating envelope against protocol requirements.
 */
export declare function validateEnvelope(envelope: unknown, options?: {
    maxSizeBytes?: number;
}): EnvelopeValidationResult;
/**
 * Check request freshness.
 * Returns null if fresh, error string if stale/future.
 */
export declare function checkRequestFreshness(created_at: number, maxAgeSec?: number, maxFutureSec?: number): string | null;
//# sourceMappingURL=envelope.d.ts.map