#!/usr/bin/env node
/**
 * OpenDating Key Generator
 *
 * Generates the service signing keypairs and the two storage keys the relay
 * needs. Output is secret material — never commit it, and never paste it
 * anywhere but `wrangler secret put` or a local, git-ignored `.dev.vars`.
 *
 * Usage:
 *   npx tsx scripts/opendating-keys-generate.ts            # all secrets
 *   npx tsx scripts/opendating-keys-generate.ts --commands # ready-to-run wrangler
 */
import { generateKeypair } from '../src/protocols/opendating/crypto/encryption.js';
import { LOADABLE_SERVICE_ROLES, secretNameForRole } from '../src/protocols/opendating/identities/loader.js';
import { randomBytes } from 'node:crypto';

const asCommands = process.argv.includes('--commands');

/** Storage keys are opaque strings; 48 base64 chars comfortably clears the 32-char floor. */
function storageKey(): string {
  return randomBytes(36).toString('base64url');
}

const secrets: { name: string; value: string; note: string }[] = [];

for (const role of LOADABLE_SERVICE_ROLES) {
  const kp = generateKeypair();
  secrets.push({
    name: secretNameForRole(role),
    value: kp.privateKey,
    note: `${role} service — pubkey ${kp.publicKey}`,
  });
}

secrets.push({
  name: 'OD_INDEX_KEY_V1',
  value: storageKey(),
  note: 'HMAC key for pseudonymous member IDs — rotating it orphans every existing member row',
});
secrets.push({
  name: 'OD_DATA_KEY_V1',
  value: storageKey(),
  note: 'AES-GCM key for pubkeys and profile content at rest — rotating it makes existing rows unreadable',
});

if (asCommands) {
  console.log('# Run each line, pasting the value when prompted.');
  console.log('# Values are printed below the command for copying.');
  console.log('');
  for (const s of secrets) {
    console.log(`# ${s.note}`);
    console.log(`npx wrangler secret put ${s.name}`);
    console.log(`#   ${s.value}`);
    console.log('');
  }
} else {
  console.log('# OpenDating secrets — DO NOT COMMIT');
  console.log('# Local dev: save as .dev.vars (git-ignored)');
  console.log('# Production: npx wrangler secret put <NAME>');
  console.log('');
  for (const s of secrets) {
    console.log(`# ${s.note}`);
    console.log(`${s.name}=${s.value}`);
  }
  console.log('');
  console.log('# Local development only — never set in production:');
  console.log('# OD_ALLOW_DEV_KEYS=true');
}
