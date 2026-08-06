#!/usr/bin/env node
/**
 * OpenDating Development Key Generator
 *
 * Generates test service keypairs for local development.
 * WARNING: Development only. Never commit generated secret material.
 *
 * Usage: npx tsx scripts/opendating-keys-generate.ts
 */
import { generateKeypair } from '../src/protocols/opendating/crypto/encryption.js';

console.log('==========================================');
console.log('  OpenDating Development Key Generator');
console.log('  DEVELOPMENT ONLY — DO NOT USE IN PROD');
console.log('==========================================');
console.log('');

// System service
const system = generateKeypair();
console.log('# System Service');
console.log(`OD_SYSTEM_SERVICE_PRIVKEY=${system.privateKey}`);
console.log(`OD_SYSTEM_SERVICE_PUBKEY=${system.publicKey}`);
console.log('');

// Future services (keys generated for reference, not used in V0.1)
const profile = generateKeypair();
console.log('# Profile Service (future)');
console.log(`# OD_PROFILE_SERVICE_PRIVKEY=${profile.privateKey}`);
console.log(`# OD_PROFILE_SERVICE_PUBKEY=${profile.publicKey}`);
console.log('');

console.log('==========================================');
console.log('Add these to your .dev.vars file:');
console.log('');
console.log(`OD_SYSTEM_SERVICE_PRIVKEY=${system.privateKey}`);
console.log('==========================================');
console.log('');
console.log('WARNING: These are DEVELOPMENT keys.');
console.log('For production, use: wrangler secret put OD_SYSTEM_SERVICE_PRIVKEY');
