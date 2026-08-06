/**
 * OpenDating Capabilities
 *
 * Service capability reporting for protocol discovery.
 */
import { SUPPORTED_VERSIONS, OD_FEATURES } from './constants.js';
import type { SystemCapabilitiesResultPayload } from './message-types.js';

/**
 * Build a capabilities result for a set of services.
 */
export function buildCapabilities(
  services: Array<{ role: string; pubkey: string; supportedTypes?: string[] }>,
): SystemCapabilitiesResultPayload {
  return {
    versions: [...SUPPORTED_VERSIONS],
    services: services.map(s => ({
      role: s.role,
      pubkey: s.pubkey,
      supported_types: s.supportedTypes,
    })),
    features: [...OD_FEATURES],
  };
}

/**
 * Build a NIP-11 OpenDating advertisement object.
 */
export function buildNip11Advertisement(
  services: Array<{ role: string; pubkey: string }>,
): Record<string, unknown> {
  const serviceMap: Record<string, { pubkey: string }> = {};
  for (const s of services) {
    serviceMap[s.role] = { pubkey: s.pubkey };
  }

  return {
    opendating: {
      versions: [...SUPPORTED_VERSIONS],
      services: serviceMap,
    },
  };
}
