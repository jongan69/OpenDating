/**
 * Service Identity Loader
 *
 * Loads service identities from configuration/environment.
 * Private keys come from Cloudflare Worker secrets.
 *
 * This module IS Cloudflare-aware — it loads secrets from env.
 */
import { validateServiceKey } from '../crypto/service-signer.js';
import { signEvent } from '../crypto/encryption.js';
import type { ServiceSigner } from './types.js';
import { serviceIdentityRegistry } from './registry.js';
import type { OpenDatingServiceRole } from '../protocol/constants.js';

/**
 * Load a service identity from a private key (hex).
 * The private key should come from a Cloudflare Worker secret.
 */
export function loadServiceIdentity(
  role: OpenDatingServiceRole,
  privateKeyHex: string,
): ServiceSigner {
  const publicKey = validateServiceKey(privateKeyHex);
  if (!publicKey) {
    throw new Error(`Invalid private key for service role "${role}". Check the OD_${role.toUpperCase()}_SERVICE_PRIVKEY secret.`);
  }

  const signer: ServiceSigner = {
    role,
    pubkey: publicKey,
    privateKey: privateKeyHex,
    signEvent(event) {
      return signEvent(event, this.privateKey);
    },
  };

  serviceIdentityRegistry.registerSigner(signer);
  console.log(`Loaded service identity: ${role} (pubkey: ${publicKey.substring(0, 8)}...)`);

  return signer;
}

/**
 * Load service identities from environment secrets.
 * Each service role looks for OD_<ROLE>_SERVICE_PRIVKEY in environment.
 *
 * Example:
 *   OD_SYSTEM_SERVICE_PRIVKEY=<hex private key>
 */
export function loadServiceIdentitiesFromEnv(env: {
  [key: string]: string | undefined;
}): ServiceSigner[] {
  const signers: ServiceSigner[] = [];

  // System service (the only active service in V0.1)
  const systemKey = env.OD_SYSTEM_SERVICE_PRIVKEY;
  if (systemKey && systemKey.length > 0) {
    try {
      signers.push(loadServiceIdentity('system', systemKey));
    } catch (err) {
      console.error('Failed to load system service identity:', (err as Error).message);
    }
  } else {
    console.warn('OD_SYSTEM_SERVICE_PRIVKEY not set — OpenDating system service will not be available');
  }

  // Future: load additional service identities
  // const profileKey = env.OD_PROFILE_SERVICE_PRIVKEY;
  // if (profileKey) signers.push(loadServiceIdentity('profile', profileKey));

  return signers;
}

/**
 * Check if any service identities are loaded.
 */
export function hasServiceIdentities(): boolean {
  return serviceIdentityRegistry.getAll().length > 0;
}

/**
 * Get all loaded service identities for capability reporting.
 */
export function getServiceIdentitiesForCapabilities(): Array<{
  role: string;
  pubkey: string;
  supportedTypes?: string[];
}> {
  return serviceIdentityRegistry.getAll().map(si => ({
    role: si.role,
    pubkey: si.pubkey,
    supportedTypes: getSupportedTypesForRole(si.role),
  }));
}

function getSupportedTypesForRole(role: string): string[] {
  switch (role) {
    case 'system': return ['system.ping', 'system.capabilities'];
    case 'profile': return ['profile.create', 'profile.update', 'profile.get', 'profile.pause', 'profile.resume', 'profile.delete'];
    case 'discovery': return ['discovery.update_location', 'discovery.get_candidates', 'discovery.update_preferences'];
    case 'matcher': return ['intent.like', 'intent.revoke', 'match.list'];
    case 'dm_policy': return ['block.create', 'block.list', 'unmatch.create'];
    case 'moderation': return ['report.create', 'moderation.action'];
    default: return [];
  }
}
