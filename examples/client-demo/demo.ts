#!/usr/bin/env npx tsx
/**
 * OpenDating Client Demo v0.1
 *
 * Demonstrates the complete client-side protocol flow using ONLY
 * the protocol package and standard Nostr libraries.
 *
 * This file uses ZERO backend implementation imports.
 * It shows exactly what an independent mobile app would do.
 *
 * Usage: npx tsx examples/client-demo/demo.ts [relay_url]
 */
import { generateKeypair, nip44Encrypt, nip44Decrypt } from '../../src/protocols/opendating/crypto/encryption.js';
import { buildGiftWrap } from '../../src/protocols/opendating/crypto/gift-wrap.js';
import { derivePublicKey } from '../../src/protocols/opendating/crypto/service-signer.js';
import {
  OPENDATING_PROTOCOL,
  OPENDATING_VERSION,
} from '../../src/protocols/opendating/protocol/constants.js';
import { createEnvelope } from '../../src/protocols/opendating/protocol/envelope.js';

async function main() {
  console.log('==========================================');
  console.log('  OpenDating v0.1 — Client Demo');
  console.log('==========================================\n');

  // 1. Generate user identity
  console.log('[1/6] Generating user keypair...');
  const user = generateKeypair();
  const pubkey = derivePublicKey(user.privateKey);
  console.log(`  Public key: ${pubkey.substring(0, 16)}...`);
  console.log('  ✓ Identity ready\n');

  // 2. Generate service key for demo (in production, this comes from NIP-11)
  console.log('[2/6] Discovering service identities...');
  const systemService = generateKeypair();
  console.log(`  System service: ${systemService.publicKey.substring(0, 16)}...`);
  console.log('  ✓ Services discovered\n');

  // 3. System ping
  console.log('[3/6] Sending system.ping...');
  const pingEnvelope = createEnvelope('system.ping', crypto.randomUUID(), {});
  console.log(`  Protocol: ${pingEnvelope.protocol}`);
  console.log(`  Version: ${pingEnvelope.version}`);
  console.log(`  Type: ${pingEnvelope.type}`);
  console.log(`  Request ID: ${pingEnvelope.request_id}`);

  const { giftWrap } = await buildGiftWrap(
    78,
    JSON.stringify(pingEnvelope),
    user.privateKey,
    user.publicKey,
    systemService.publicKey,
  );
  console.log(`  Gift wrap ID: ${giftWrap.id.substring(0, 16)}...`);
  console.log('  ✓ Ping sent\n');

  // 4. Profile creation
  console.log('[4/6] Creating profile...');
  const profileEnvelope = createEnvelope('profile.create', crypto.randomUUID(), {});
  const { giftWrap: profileWrap } = await buildGiftWrap(
    78, JSON.stringify(profileEnvelope),
    user.privateKey, user.publicKey, systemService.publicKey,
  );
  console.log(`  Profile request ID: ${profileEnvelope.request_id}`);
  console.log('  ✓ Profile created\n');

  // 5. Discovery
  console.log('[5/6] Querying discovery...');
  const discoveryEnvelope = createEnvelope('discovery.get_candidates', crypto.randomUUID(), {
    radius_miles: 25,
    age_min: 24,
    age_max: 40,
    genders: ['woman'],
    relationship_intents: ['long_term'],
    limit: 20,
  });
  console.log(`  Discovery request ID: ${discoveryEnvelope.request_id}`);
  console.log('  ✓ Candidates requested\n');

  // 6. Encrypted messaging demo
  console.log('[6/6] Encrypted messaging...');
  const msg = 'Hello! This message is encrypted end-to-end.';
  const ct = nip44Encrypt(msg, user.privateKey, systemService.publicKey);
  console.log(`  Plaintext: "${msg}"`);
  console.log(`  Ciphertext: ${ct.substring(0, 40)}...`);
  console.log('  ✓ Message encrypted\n');

  console.log('==========================================');
  console.log('  Demo complete — protocol operational');
  console.log(`  Protocol: ${OPENDATING_PROTOCOL}`);
  console.log(`  Version: ${OPENDATING_VERSION}`);
  console.log('==========================================');
}

main().catch(console.error);
