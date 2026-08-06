/**
 * Service Signer — NIP-44 v2 + NIP-59 compliant
 */
import { schnorr } from '@noble/curves/secp256k1';
import { bytesToHex, hexToBytes } from './encryption.js';

export interface ServiceKeypair {
  privateKey: string;  // hex
  publicKey: string;   // hex
}

export function derivePublicKey(privateKeyHex: string): string {
  const privBytes = hexToBytes(privateKeyHex);
  const pubBytes = schnorr.getPublicKey(privBytes);
  return bytesToHex(pubBytes);
}

export function validateServiceKey(privateKeyHex: string): string | null {
  try {
    if (!/^[a-f0-9]{64}$/i.test(privateKeyHex)) {
      return null;
    }
    return derivePublicKey(privateKeyHex);
  } catch {
    return null;
  }
}

export function createServiceKeypair(privateKeyHex: string): ServiceKeypair {
  const publicKey = validateServiceKey(privateKeyHex);
  if (!publicKey) {
    throw new Error('Invalid service private key');
  }
  return { privateKey: privateKeyHex, publicKey };
}
