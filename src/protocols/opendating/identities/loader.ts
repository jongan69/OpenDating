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
 * Roles this relay can run, in the order they are reported.
 *
 * A role becomes active purely by having its secret set, so an operator can
 * roll services out one at a time. `verification` and `media` are declared in
 * the protocol but have no service implementation yet, so they are not
 * listed — advertising them would promise capabilities the relay cannot serve.
 */
export const LOADABLE_SERVICE_ROLES = [
  'system',
  'profile',
  'discovery',
  'matcher',
  'dm_policy',
  'moderation',
  'deletion',
] as const;

export type LoadableServiceRole = (typeof LOADABLE_SERVICE_ROLES)[number];

/** Secret name carrying the private key for a role. */
export function secretNameForRole(role: string): string {
  return `OD_${role.toUpperCase()}_SERVICE_PRIVKEY`;
}

/**
 * Load service identities from environment secrets.
 * Each role looks for OD_<ROLE>_SERVICE_PRIVKEY in the environment.
 *
 * Example:
 *   OD_SYSTEM_SERVICE_PRIVKEY=<hex private key>
 *   OD_PROFILE_SERVICE_PRIVKEY=<hex private key>
 */
export function loadServiceIdentitiesFromEnv(env: {
  [key: string]: string | undefined;
}): ServiceSigner[] {
  const signers: ServiceSigner[] = [];
  const missing: string[] = [];

  for (const role of LOADABLE_SERVICE_ROLES) {
    const secretName = secretNameForRole(role);
    const key = env[secretName];

    if (!key || key.length === 0) {
      missing.push(role);
      continue;
    }

    try {
      signers.push(loadServiceIdentity(role as OpenDatingServiceRole, key));
    } catch (err) {
      // One bad key must not cost the roles that are configured correctly.
      console.error(`Failed to load "${role}" service identity:`, (err as Error).message);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[OpenDating] Not loaded (secret unset): ${missing.join(', ')}. ` +
        `Set with: wrangler secret put ${secretNameForRole(missing[0])}`,
    );
  }

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
