/**
 * Relay policy interface.
 *
 * Policies control what events can be published, what queries can run,
 * and how content is filtered. The default policy is permissive for
 * a general-purpose relay; future domain protocols can compose additional policies.
 */
import type { NostrEvent, NostrFilter } from '../../types.js';

/**
 * Context provided to all policy decisions.
 */
export interface RelayContext {
  /** Unique session identifier */
  sessionId: string;
  /** Authenticated pubkey (from NIP-42), if any */
  authenticatedPubkey?: string;
  /** Relay URL */
  relayUrl: string;
  /** Connection metadata */
  connection: ConnectionMetadata;
}

export interface ConnectionMetadata {
  /** Client IP address (if available) */
  ip?: string;
  /** Cloudflare colo/region */
  region?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Result of a policy decision.
 */
export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Relay policy — pluggable content moderation.
 */
export interface RelayPolicy {
  /**
   * Decide whether an event can be published.
   */
  canPublish(
    event: NostrEvent,
    context: RelayContext
  ): Promise<PolicyDecision>;

  /**
   * Decide whether a set of filters can be queried.
   */
  canQuery(
    filters: NostrFilter[],
    context: RelayContext
  ): Promise<PolicyDecision>;

  /**
   * Decide whether a gift wrap (kind 1059) can be queried by this context.
   * Must enforce recipient-only access.
   */
  canQueryGiftWrap?(
    filters: NostrFilter[],
    context: RelayContext
  ): Promise<PolicyDecision>;
}

/**
 * Extension point for future domain protocols.
 *
 * Implementations can register handlers for specific event kinds
 * without modifying the core relay infrastructure.
 */
export interface RelayExtension {
  /** Unique name for this extension */
  name: string;

  /** Determine if this extension can handle the given event */
  canHandleEvent(
    event: NostrEvent,
    context: RelayContext
  ): boolean;

  /** Handle an event (optional — if not provided, event is stored normally) */
  handleEvent?(
    event: NostrEvent,
    context: RelayContext
  ): Promise<ExtensionResult>;

  /** Authorize a query (optional — if not provided, default policy applies) */
  authorizeQuery?(
    filters: NostrFilter[],
    context: RelayContext
  ): Promise<PolicyDecision>;
}

export interface ExtensionResult {
  /** Whether the event was handled */
  handled: boolean;
  /** If handled, whether to also store normally */
  storeNormally?: boolean;
  /** Message to return in OK response */
  message?: string;
  /**
   * Events the extension produced that must reach live subscribers.
   *
   * An extension runs inside the Durable Object but has no handle on it, so
   * it cannot push to open WebSockets itself. Persisting a reply is not
   * enough: a client waiting on a REQ subscription never re-queries, so a
   * stored-but-unbroadcast response looks exactly like no response at all.
   * The DO broadcasts whatever is returned here.
   */
  publish?: NostrEvent[];
}
