/**
 * Storage interfaces for the relay.
 *
 * Generic relay logic must not directly depend on D1 everywhere.
 * These interfaces provide a clean seam between business logic and
 * Cloudflare-specific storage.
 */
import type { NostrEvent } from '../../types.js';

// ---------------------------------------------------------------------------
// Query plan
// ---------------------------------------------------------------------------

/**
 * A normalized query plan produced by the query planner.
 * This is the canonical representation of what to query,
 * independent of the underlying storage engine.
 */
export interface QueryPlan {
  filters: NormalizedFilter[];
  limit: number;
  bookmark?: string;
}

export interface NormalizedFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  since?: number;
  until?: number;
  tags?: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Event store
// ---------------------------------------------------------------------------

/**
 * Event storage interface.
 */
export interface EventStore {
  /** Save an event. Returns false if duplicate. */
  save(event: NostrEvent): Promise<{ success: boolean; message: string; bookmark?: string }>;

  /** Delete an event by ID. */
  delete(id: string): Promise<void>;

  /** Delete events by author pubkey. */
  deleteByAuthor(pubkey: string): Promise<number>;

  /** Query events by plan. */
  query(plan: QueryPlan): Promise<{ events: NostrEvent[]; bookmark: string | null }>;

  /** Get a single event by ID. */
  getById(id: string): Promise<NostrEvent | null>;

  /** Count events matching a filter. */
  count(filter: NormalizedFilter): Promise<number>;
}

// ---------------------------------------------------------------------------
// System store
// ---------------------------------------------------------------------------

/**
 * System/configuration storage.
 */
export interface SystemStore {
  /** Get the current schema version. */
  getSchemaVersion(): Promise<number>;

  /** Set the schema version. */
  setSchemaVersion(version: number): Promise<void>;

  /** Get a configuration value. */
  getConfig(key: string): Promise<string | null>;

  /** Set a configuration value. */
  setConfig(key: string, value: string): Promise<void>;

  /** Check if the database has been initialized. */
  isInitialized(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Content hash store (anti-spam)
// ---------------------------------------------------------------------------

/**
 * Content hash storage for anti-spam duplicate detection.
 */
export interface ContentHashStore {
  /** Check if content hash exists. */
  exists(hash: string, pubkey?: string): Promise<boolean>;

  /** Store a content hash. */
  store(hash: string, eventId: string, pubkey: string, createdAt: number): Promise<void>;
}
