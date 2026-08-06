/**
 * Service Identity Registry Implementation
 *
 * Manages known OpenDating service identities.
 */
import type { OpenDatingServiceRole } from '../protocol/constants.js';
import type { ServiceIdentity, ServiceSigner, ServiceIdentityRegistry } from './types.js';

export class InMemoryServiceIdentityRegistry implements ServiceIdentityRegistry {
  private byRole: Map<OpenDatingServiceRole, ServiceIdentity> = new Map();
  private byPubkey: Map<string, ServiceIdentity> = new Map();
  private signers: Map<string, ServiceSigner> = new Map();

  register(identity: ServiceIdentity): void {
    this.byRole.set(identity.role, identity);
    this.byPubkey.set(identity.pubkey, identity);
  }

  registerSigner(signer: ServiceSigner): void {
    this.register(signer);
    this.signers.set(signer.pubkey, signer);
  }

  getByRole(role: OpenDatingServiceRole): ServiceIdentity | undefined {
    return this.byRole.get(role);
  }

  getByPubkey(pubkey: string): ServiceIdentity | undefined {
    return this.byPubkey.get(pubkey);
  }

  getAll(): ServiceIdentity[] {
    return Array.from(this.byRole.values());
  }

  getSigner(pubkey: string): ServiceSigner | undefined {
    return this.signers.get(pubkey);
  }

  /**
   * Check if a pubkey belongs to a registered service.
   */
  isServicePubkey(pubkey: string): boolean {
    return this.byPubkey.has(pubkey);
  }
}

/** Singleton service identity registry */
export const serviceIdentityRegistry = new InMemoryServiceIdentityRegistry();
