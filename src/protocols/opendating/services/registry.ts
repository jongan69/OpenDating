/**
 * OpenDating Service Registry
 *
 * Routes requests to the correct service handler.
 * A simple Map-based registry — no DI frameworks.
 */
import type { OpenDatingService, OpenDatingServiceContext } from './interface.js';
import type { OpenDatingEnvelope } from '../protocol/envelope.js';

export class OpenDatingServiceRegistry {
  private services: Map<string, OpenDatingService> = new Map();
  private byPubkey: Map<string, OpenDatingService> = new Map();

  /**
   * Register a service.
   */
  register(service: OpenDatingService): void {
    this.services.set(service.role, service);
    this.byPubkey.set(service.pubkey, service);
    console.log(`Registered OpenDating service: ${service.role} (pubkey: ${service.pubkey.substring(0, 8)}...)`);
  }

  /**
   * Resolve a service by its Nostr public key (recipient of a gift wrap).
   */
  resolveByRecipient(pubkey: string): OpenDatingService | undefined {
    return this.byPubkey.get(pubkey);
  }

  /**
   * Resolve a service by its role.
   */
  resolveByRole(role: string): OpenDatingService | undefined {
    return this.services.get(role);
  }

  /**
   * Resolve a service that supports a given message type.
   */
  resolveByMessageType(type: string): OpenDatingService | undefined {
    for (const service of this.services.values()) {
      if (service.supports(type)) {
        return service;
      }
    }
    return undefined;
  }

  /**
   * List all registered services for capability reporting.
   */
  listServices(): Array<{ role: string; pubkey: string }> {
    return Array.from(this.services.values()).map(s => ({
      role: s.role,
      pubkey: s.pubkey,
    }));
  }

  /**
   * Check if a pubkey is a registered service.
   */
  isServicePubkey(pubkey: string): boolean {
    return this.byPubkey.has(pubkey);
  }
}

/** Singleton service registry */
export const odServiceRegistry = new OpenDatingServiceRegistry();
