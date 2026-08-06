/**
 * OpenDating Service Identity Types
 *
 * Infrastructure-independent — no Cloudflare imports.
 */
import type { OpenDatingServiceRole } from '../protocol/constants.js';

/**
 * A known OpenDating service identity.
 */
export interface ServiceIdentity {
  role: OpenDatingServiceRole;
  pubkey: string;           // Nostr hex public key
}

/**
 * A service that can sign events (has a private key).
 */
export interface ServiceSigner extends ServiceIdentity {
  /** The service's private key (hex) — protected, only for crypto operations */
  readonly privateKey: string;
  /** Sign a Nostr event with the service's key */
  signEvent(event: {
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
  }): { id: string; sig: string };
}

/**
 * Registry of service identities.
 */
export interface ServiceIdentityRegistry {
  getByRole(role: OpenDatingServiceRole): ServiceIdentity | undefined;
  getByPubkey(pubkey: string): ServiceIdentity | undefined;
  getAll(): ServiceIdentity[];
  getSigner(pubkey: string): ServiceSigner | undefined;
}
