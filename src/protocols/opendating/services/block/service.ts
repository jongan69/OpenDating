/**
 * OpenDating Block Service (Phase 5)
 *
 * Private blocking, unmatching, and portable block lists.
 * Block enforcement is server-side.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';

export class BlockService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    private db: D1Database,
  ) {
    this.membership = new D1MembershipStore(db);
  }

  supports(type: string): boolean {
    return ['block.create', 'block.list', 'unmatch.create'].includes(type);
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(ctx.senderPubkey);

    switch (request.type) {
      case 'block.create': return this.createBlock(member.memberId, request, ctx);
      case 'block.list': return this.listBlocks(member.memberId, request);
      case 'unmatch.create': return this.createUnmatch(member.memberId, request, ctx);
      default:
        throw new Error(`Block service does not support: ${request.type}`);
    }
  }

  private async createBlock(memberId: string, request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const targetPubkey = payload.target_pubkey as string;
    const targetMemberId = this.membership.getMemberId(targetPubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    // Create block
    await session.prepare(
      `INSERT OR REPLACE INTO od_blocks (blocker_member_id, blocked_member_id, block_type, created_at)
       VALUES (?, ?, 'block', ?)`
    ).bind(memberId, targetMemberId, now).run();

    // Remove any active match
    await session.prepare(
      `UPDATE od_matches SET state = 'blocked_a', updated_at = ?
       WHERE (member_a = ? AND member_b = ?) OR (member_a = ? AND member_b = ?)`
    ).bind(now, memberId, targetMemberId, targetMemberId, memberId).run();

    // Revoke pending intents
    await session.prepare(
      `UPDATE od_intents SET state = 'revoked', revoked_at = ?
       WHERE (from_member_id = ? AND to_member_id = ?)
          OR (from_member_id = ? AND to_member_id = ?)`
    ).bind(now, memberId, targetMemberId, targetMemberId, memberId).run();

    // Remove candidate grants
    await session.prepare(
      `DELETE FROM od_candidate_grants WHERE (viewer_id = ? AND candidate_id = ?) OR (viewer_id = ? AND candidate_id = ?)`
    ).bind(memberId, targetMemberId, targetMemberId, memberId).run();

    return { response: createEnvelope('block.create.result', request.request_id, { blocked_at: now }) };
  }

  private async listBlocks(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const session = this.db.withSession('first-unconstrained');
    const blocks = await session.prepare(
      `SELECT blocked_member_id, created_at FROM od_blocks WHERE blocker_member_id = ? ORDER BY created_at DESC`
    ).bind(memberId).all();

    return {
      response: createEnvelope('block.list.result', request.request_id, {
        blocked: blocks.results.map((r: any) => ({
          member_id: r.blocked_member_id,
          created_at: r.created_at,
        })),
      }),
    };
  }

  private async createUnmatch(memberId: string, request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const targetPubkey = payload.target_pubkey as string;
    const targetMemberId = this.membership.getMemberId(targetPubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    // Update match state
    const matchResult = await session.prepare(
      `UPDATE od_matches SET state = 'unmatched_a', updated_at = ?
       WHERE member_a = ? AND member_b = ? AND state = 'active'`
    ).bind(now, memberId, targetMemberId).run();

    if (matchResult.meta?.changes === 0) {
      await session.prepare(
        `UPDATE od_matches SET state = 'unmatched_b', updated_at = ?
         WHERE member_b = ? AND member_a = ? AND state = 'active'`
      ).bind(now, memberId, targetMemberId).run();
    }

    return { response: createEnvelope('unmatch.create.result', request.request_id, { unmatched_at: now }) };
  }
}
