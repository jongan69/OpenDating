/**
 * OpenDating Storage Interfaces
 *
 * Persistence for idempotency and future service state.
 */
export interface ODIdempotencyStore {
  /**
   * Check if a request was already processed.
   * Returns true if the request ID was seen before.
   */
  isDuplicate(
    servicePubkey: string,
    senderPubkey: string,
    requestId: string,
  ): Promise<boolean>;

  /**
   * Record that a request was processed.
   */
  record(
    servicePubkey: string,
    senderPubkey: string,
    requestId: string,
    requestType: string,
  ): Promise<void>;

  /**
   * Prune expired idempotency records.
   * Returns count of pruned records.
   */
  pruneExpired(): Promise<number>;
}
