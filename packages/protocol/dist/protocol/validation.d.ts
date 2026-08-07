export interface ODValidationResult {
    valid: boolean;
    errorCode?: string;
    errorMessage?: string;
}
/**
 * Validate a complete OpenDating request envelope.
 * Checks: shape, protocol, version, type, payload, size.
 */
export declare function validateODRequest(envelope: unknown): ODValidationResult;
//# sourceMappingURL=validation.d.ts.map