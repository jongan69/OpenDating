/**
 * OpenDating Protocol Constants
 *
 * Protocol identifier, version, and core configuration.
 * Infrastructure-independent — no Cloudflare/Worker/D1 imports.
 */
/** Machine-readable protocol identifier */
export declare const OPENDATING_PROTOCOL: "opendating";
/** Current protocol version (0.x = experimental) */
export declare const OPENDATING_VERSION: "0.1";
/** All protocol versions supported by this implementation */
export declare const SUPPORTED_VERSIONS: readonly ["0.1"];
/** Inner application message kind (rumor, kind 78) */
export declare const OD_KIND_RUMOR = 78;
/** Gift wrap transport kind (NIP-59, kind 1059) */
export declare const OD_KIND_GIFT_WRAP = 1059;
/** Auth event kind (NIP-42, kind 22242) */
export declare const OD_KIND_AUTH = 22242;
/**
 * OpenDating service roles.
 * Only "system" is active in V0.1. Other roles are type-safe placeholders.
 */
export type OpenDatingServiceRole = 'system' | 'profile' | 'discovery' | 'matcher' | 'dm_policy' | 'moderation' | 'verification' | 'media';
export declare const ALL_SERVICE_ROLES: readonly OpenDatingServiceRole[];
/** Known OpenDating message types (system service only for V0.1) */
export declare const OD_MESSAGE_TYPES: {
    readonly 'system.ping': "system.ping";
    readonly 'system.pong': "system.pong";
    readonly 'system.capabilities': "system.capabilities";
    readonly 'system.capabilities_result': "system.capabilities.result";
    readonly 'system.error': "system.error";
};
export type OpenDatingMessageType = typeof OD_MESSAGE_TYPES[keyof typeof OD_MESSAGE_TYPES];
/** Maximum decrypted OpenDating command payload size */
export declare const MAX_OD_PAYLOAD_BYTES: number;
/** Request freshness: max age in seconds (5 minutes) */
export declare const OD_REQUEST_MAX_AGE_SEC: number;
/** Request freshness: max future drift in seconds (60 seconds) */
export declare const OD_REQUEST_MAX_FUTURE_SEC = 60;
/** Idempotency record retention (24 hours in seconds) */
export declare const OD_IDEMPOTENCY_RETENTION_SEC: number;
/** Features advertised by the OpenDating protocol implementation */
export declare const OD_FEATURES: readonly ["private-service-requests", "nip42-required", "nip59-transport"];
export type OpenDatingFeature = typeof OD_FEATURES[number];
//# sourceMappingURL=constants.d.ts.map