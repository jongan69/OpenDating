/**
 * OpenDating Deletion + Vanish Service (Phase 8, PRD §68-69)
 *
 * NIP-09 deletion, NIP-62 vanish, tombstone management, stale-event prevention.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';
import { bytesToHex } from '../../crypto/encryption.js';
import { sha256 } from '@noble/hashes/sha256';

export class DeletionService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    private db: D1Database,
  ) { this.membership = new D1MembershipStore(db); }

  supports(type: string): boolean {
    return type === 'account.delete';
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const memberId = this.membership.getMemberId(ctx.senderPubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    // 1. Delete profile + discovery index
    await this.membership.deleteMember(ctx.senderPubkey);

    // 2. Revoke pending intents
    await session.prepare(
      `UPDATE od_intents SET state = 'revoked', revoked_at = ? WHERE from_member_id = ?`
    ).bind(now, memberId).run();

    // 3. Close matches
    await session.prepare(
      `UPDATE od_matches SET state = 'unmatched_a', updated_at = ?
       WHERE (member_a = ? OR member_b = ?) AND state = 'active'`
    ).bind(now, memberId, memberId).run();

    // 4. Remove blocks
    await session.prepare(
      `DELETE FROM od_blocks WHERE blocker_member_id = ? OR blocked_member_id = ?`
    ).bind(memberId, memberId).run();

    // 5. Remove candidate grants
    await session.prepare(
      `DELETE FROM od_candidate_grants WHERE viewer_id = ? OR candidate_id = ?`
    ).bind(memberId, memberId).run();

    // 6. Create vanish tombstone (NIP-62)
    const requestHash = bytesToHex(sha256(new TextEncoder().encode(
      ctx.senderPubkey + String(now)
    )));
    await session.prepare(
      `INSERT OR REPLACE INTO od_vanish_tombstones (member_id, cutoff_timestamp, request_hash, created_at)
       VALUES (?, ?, ?, ?)`
    ).bind(memberId, now, requestHash, now).run();

    return { response: createEnvelope('account.delete.result', request.request_id, {
      deleted_at: now, tombstone_hash: requestHash }) };
  }
}
