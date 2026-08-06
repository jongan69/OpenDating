/**
 * D1 Idempotency Store
 *
 * Cloudflare D1 implementation of ODIdempotencyStore.
 * Tracks processed request IDs to prevent double execution.
 */
import type { ODIdempotencyStore } from '../interfaces.js';
import { OD_IDEMPOTENCY_RETENTION_SEC } from '../../protocol/constants.js';

export class D1IdempotencyStore implements ODIdempotencyStore {
  constructor(private db: D1Database) {}

  async isDuplicate(
    servicePubkey: string,
    senderPubkey: string,
    requestId: string,
  ): Promise<boolean> {
    try {
      const session = this.db.withSession('first-unconstrained');
      const result = await session.prepare(
        `SELECT request_id FROM od_idempotency
         WHERE service_pubkey = ? AND sender_pubkey = ? AND request_id = ?
         LIMIT 1`
      ).bind(servicePubkey, senderPubkey, requestId).first();

      return result !== null;
    } catch (error) {
      console.error('Idempotency check failed:', error);
      // On DB error, allow the request through (fail open)
      return false;
    }
  }

  async record(
    servicePubkey: string,
    senderPubkey: string,
    requestId: string,
    requestType: string,
  ): Promise<void> {
    try {
      const session = this.db.withSession('first-primary');
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + OD_IDEMPOTENCY_RETENTION_SEC;

      await session.prepare(
        `INSERT OR IGNORE INTO od_idempotency
         (service_pubkey, sender_pubkey, request_id, request_type, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(servicePubkey, senderPubkey, requestId, requestType, now, expiresAt).run();
    } catch (error) {
      console.error('Failed to record idempotency:', error);
      // Non-fatal: if we can't record, duplicate might slip through
    }
  }

  async pruneExpired(): Promise<number> {
    try {
      const session = this.db.withSession('first-primary');
      const now = Math.floor(Date.now() / 1000);
      const result = await session.prepare(
        `DELETE FROM od_idempotency WHERE expires_at < ?`
      ).bind(now).run();

      const deleted = result.meta?.changes || 0;
      if (deleted > 0) {
        console.log(`Pruned ${deleted} expired idempotency records`);
      }
      return deleted;
    } catch (error) {
      console.error('Idempotency pruning failed:', error);
      return 0;
    }
  }
}
