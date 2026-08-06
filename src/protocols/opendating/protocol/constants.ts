/**
 * OpenDating Protocol Constants
 *
 * Protocol identifier, version, and core configuration.
 * Infrastructure-independent — no Cloudflare/Worker/D1 imports.
 */

/** Machine-readable protocol identifier */
export const OPENDATING_PROTOCOL = 'opendating' as const;

/** Current protocol version (0.x = experimental) */
export const OPENDATING_VERSION = '0.1' as const;

/** All protocol versions supported by this implementation */
export const SUPPORTED_VERSIONS = ['0.1'] as const;

// ---------------------------------------------------------------------------
// Nostr event kinds used by OpenDating
// ---------------------------------------------------------------------------

/** Inner application message kind (rumor, kind 78) */
export const OD_KIND_RUMOR = 78;

/** Gift wrap transport kind (NIP-59, kind 1059) */
export const OD_KIND_GIFT_WRAP = 1059;

/** Auth event kind (NIP-42, kind 22242) */
export const OD_KIND_AUTH = 22242;

// ---------------------------------------------------------------------------
// Service roles
// ---------------------------------------------------------------------------

/**
 * OpenDating service roles.
 * Only "system" is active in V0.1. Other roles are type-safe placeholders.
 */
export type OpenDatingServiceRole =
  | 'system'
  | 'profile'
  | 'discovery'
  | 'matcher'
  | 'dm_policy'
  | 'moderation'
  | 'verification'
  | 'media';

export const ALL_SERVICE_ROLES: readonly OpenDatingServiceRole[] = [
  'system', 'profile', 'discovery', 'matcher',
  'dm_policy', 'moderation', 'verification', 'media',
] as const;

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

/** Known OpenDating message types (system service only for V0.1) */
export const OD_MESSAGE_TYPES = {
  'system.ping': 'system.ping',
  'system.pong': 'system.pong',
  'system.capabilities': 'system.capabilities',
  'system.capabilities_result': 'system.capabilities.result',
  'system.error': 'system.error',
} as const;

export type OpenDatingMessageType = typeof OD_MESSAGE_TYPES[keyof typeof OD_MESSAGE_TYPES];

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** Maximum decrypted OpenDating command payload size */
export const MAX_OD_PAYLOAD_BYTES = 16 * 1024; // 16 KB

/** Request freshness: max age in seconds (5 minutes) */
export const OD_REQUEST_MAX_AGE_SEC = 5 * 60;

/** Request freshness: max future drift in seconds (60 seconds) */
export const OD_REQUEST_MAX_FUTURE_SEC = 60;

/** Idempotency record retention (24 hours in seconds) */
export const OD_IDEMPOTENCY_RETENTION_SEC = 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

/** Features advertised by the OpenDating protocol implementation */
export const OD_FEATURES = [
  'private-service-requests',
  'nip42-required',
  'nip59-transport',
] as const;

export type OpenDatingFeature = typeof OD_FEATURES[number];
