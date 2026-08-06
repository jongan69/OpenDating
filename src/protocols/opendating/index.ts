/**
 * OpenDating Protocol — Entry Point
 */
import { extensionRegistry } from '../../relay/services/registry.js';
import { openDatingExtension, initOpenDatingExtension } from './extension.js';
import { loadServiceIdentitiesFromEnv } from './identities/loader.js';
import { SystemService } from './services/system/service.js';
import { ProfileService } from './services/profile/service.js';
import { DiscoveryService } from './services/discovery/service.js';
import { MatcherService } from './services/matcher/service.js';
import { BlockService } from './services/block/service.js';
import { ModerationService } from './services/moderation/service.js';
import { DeletionService } from './services/deletion/service.js';
import { odServiceRegistry } from './services/registry.js';
import { buildNip11Advertisement } from './protocol/capabilities.js';

export function initOpenDating(env: Record<string, any>, db: D1Database): void {
  console.log('[OpenDating] Initializing protocol core...');

  initOpenDatingExtension(db);
  const signers = loadServiceIdentitiesFromEnv(env || {});

  if (signers.length === 0) {
    console.warn('[OpenDating] No service identities loaded');
    return;
  }

  // Map role → service factory
  const factories: Record<string, (pubkey: string) => void> = {
    system: (pk) => odServiceRegistry.register(new SystemService('system', pk)),
    profile: (pk) => odServiceRegistry.register(new ProfileService('profile', pk, db)),
    discovery: (pk) => odServiceRegistry.register(new DiscoveryService('discovery', pk, db)),
    matcher: (pk) => odServiceRegistry.register(new MatcherService('matcher', pk, db)),
    dm_policy: (pk) => odServiceRegistry.register(new BlockService("dm_policy", pk, db)),
    moderation: (pk) => odServiceRegistry.register(new ModerationService("moderation", pk, db)),
    deletion: (pk) => odServiceRegistry.register(new DeletionService("deletion", pk, db)),
  };

  for (const signer of signers) {
    const factory = factories[signer.role];
    if (factory) {
      factory(signer.pubkey);
    } else {
      console.warn(`[OpenDating] Unknown service role: ${signer.role}`);
    }
  }

  extensionRegistry.register(openDatingExtension);
  console.log(`[OpenDating] Initialized with ${signers.length} service(s)`);
}

export function getOpenDatingNip11Advertisement(): Record<string, unknown> {
  return buildNip11Advertisement(odServiceRegistry.listServices());
}

export {
  OPENDATING_PROTOCOL,
  OPENDATING_VERSION,
  SUPPORTED_VERSIONS,
} from './protocol/constants.js';

export { createEnvelope } from './protocol/envelope.js';
export { buildGiftWrap } from './crypto/gift-wrap.js';
export { generateKeypair } from './crypto/encryption.js';
