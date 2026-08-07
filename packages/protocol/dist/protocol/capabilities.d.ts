import type { SystemCapabilitiesResultPayload } from './message-types.js';
/**
 * Build a capabilities result for a set of services.
 */
export declare function buildCapabilities(services: Array<{
    role: string;
    pubkey: string;
    supportedTypes?: string[];
}>): SystemCapabilitiesResultPayload;
/**
 * Build a NIP-11 OpenDating advertisement object.
 */
export declare function buildNip11Advertisement(services: Array<{
    role: string;
    pubkey: string;
}>): Record<string, unknown>;
//# sourceMappingURL=capabilities.d.ts.map