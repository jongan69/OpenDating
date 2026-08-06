/**
 * Extension registry for domain-specific protocols.
 *
 * Future application protocols (like OpenDating) register their
 * handlers here without modifying the core relay infrastructure.
 */
import type { RelayExtension, RelayContext, PolicyDecision } from '../policy/interface.js';
import type { NostrEvent, NostrFilter } from '../../types.js';

/**
 * Registry of protocol extensions.
 */
class ExtensionRegistry {
  private extensions: Map<string, RelayExtension> = new Map();

  /**
   * Register a protocol extension.
   */
  register(extension: RelayExtension): void {
    if (this.extensions.has(extension.name)) {
      throw new Error(`Extension "${extension.name}" is already registered`);
    }
    this.extensions.set(extension.name, extension);
    console.log(`Registered extension: ${extension.name}`);
  }

  /**
   * Unregister a protocol extension.
   */
  unregister(name: string): void {
    this.extensions.delete(name);
  }

  /**
   * Get all registered extensions.
   */
  getAll(): RelayExtension[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Find an extension that can handle the given event.
   * Returns the first matching extension, or null if none match.
   */
  findHandler(event: NostrEvent, context: RelayContext): RelayExtension | null {
    for (const ext of this.extensions.values()) {
      if (ext.canHandleEvent(event, context)) {
        return ext;
      }
    }
    return null;
  }

  /**
   * Check all extensions for query authorization.
   * If any extension denies the query, it's denied.
   * If no extension handles it, default policy applies.
   */
  async authorizeQuery(
    filters: NostrFilter[],
    context: RelayContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    for (const ext of this.extensions.values()) {
      if (ext.authorizeQuery) {
        const result = await ext.authorizeQuery(filters, context);
        if (!result.allowed) {
          return result;
        }
      }
    }
    return { allowed: true };
  }
}

/**
 * Singleton extension registry.
 */
export const extensionRegistry = new ExtensionRegistry();
