/**
 * Query complexity analysis.
 *
 * Assigns a deterministic cost to each filter so the relay can
 * reject overly expensive queries before they hit the database.
 */
import type { NostrFilter } from '../../types.js';

// ---------------------------------------------------------------------------
// Complexity weights
// ---------------------------------------------------------------------------

/** Cost per individual filter */
const BASE_FILTER_COST = 1;

/** Cost per author pubkey in filter */
const AUTHOR_COST = 1;

/** Cost per event kind in filter */
const KIND_COST = 1;

/** Cost per tag value (expensive — may scan tags table) */
const TAG_VALUE_COST = 2;

/** Multiplier when no time bounds are specified (full scan risk) */
const NO_TIME_BOUNDS_MULTIPLIER = 2;

/** Cost for full-text search (if supported) */
const SEARCH_COST = 10;

/** Cost multiplier for large limits */
const LARGE_LIMIT_MULTIPLIER = 1.5;

/** Maximum allowed complexity */
export const MAX_QUERY_COMPLEXITY = 1000;

/** Default maximum results */
export const DEFAULT_QUERY_LIMIT = 100;

/** Hard maximum results */
export const HARD_QUERY_LIMIT = 500;

// ---------------------------------------------------------------------------
// Complexity calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the complexity score for a single filter.
 *
 * Higher scores = more expensive queries.
 */
export function calculateFilterComplexity(filter: NostrFilter): number {
  let complexity = BASE_FILTER_COST;

  // ID lookups are cheap (primary key)
  complexity += (filter.ids?.length || 0) * 1;

  // Author lookups use indexes
  complexity += (filter.authors?.length || 0) * AUTHOR_COST;

  // Kind filtering uses indexes
  complexity += (filter.kinds?.length || 0) * KIND_COST;

  // Tag filters may require tag table joins
  for (const [key, values] of Object.entries(filter)) {
    if (key.startsWith('#') && Array.isArray(values)) {
      complexity += (values as unknown[]).length * TAG_VALUE_COST;
    }
  }

  // No time bounds = potential full scan
  if (!filter.since && !filter.until) {
    complexity *= NO_TIME_BOUNDS_MULTIPLIER;
  }

  // Large limits are expensive
  if ((filter.limit || 0) > 1000) {
    complexity *= LARGE_LIMIT_MULTIPLIER;
  }

  // Search is very expensive
  if (filter.search) {
    complexity += SEARCH_COST;
  }

  return complexity;
}

/**
 * Calculate total complexity for a set of filters.
 * Filters are additive — each one generates a separate query.
 */
export function calculateTotalComplexity(filters: NostrFilter[]): number {
  return filters.reduce((sum, f) => sum + calculateFilterComplexity(f), 0);
}

/**
 * Check if a query is within complexity bounds.
 */
export function isQueryTooComplex(filters: NostrFilter[]): boolean {
  return calculateTotalComplexity(filters) > MAX_QUERY_COMPLEXITY;
}

// ---------------------------------------------------------------------------
// Limit normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a query limit to safe bounds.
 */
export function normalizeLimit(limit?: number): number {
  if (limit === undefined || limit <= 0) {
    return DEFAULT_QUERY_LIMIT;
  }
  return Math.min(limit, HARD_QUERY_LIMIT);
}
