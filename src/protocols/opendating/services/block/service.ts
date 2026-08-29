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

function readTargetPubkey(request: OpenDatingEnvelope): string | null {
  const target = request.payload.target_pubkey;
  return typeof target === 'string' && /^[0-9a-f]{64}$/i.test(target)
    ? target.toLowerCase()
    : null;
}

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
    return ['block.create', 'block.remove', 'block.list', 'unmatch.create'].includes(type);
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(ctx.senderPubkey);

    switch (request.type) {
      case 'block.create': return this.createBlock(member.memberId, request, ctx);
      case 'block.remove': return this.removeBlock(member.memberId, request);
      case 'block.list': return this.listBlocks(member.memberId, request);
      case 'unmatch.create': return this.createUnmatch(member.memberId, request, ctx);
      default:
        throw new Error(`Block service does not support: ${request.type}`);
    }
  }

  private async removeBlock(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const targetPubkey = readTargetPubkey(request);
    if (!targetPubkey) {
      return {
        response: createErrorEnvelope(
          request.request_id,
          'invalid_envelope',
          'Invalid target_pubkey',
        ),
      };
    }

    const targetMemberId = this.membership.getMemberId(targetPubkey);
    const now = Math.floor(Date.now() / 1000);
    await this.db.withSession('first-primary').prepare(
      `DELETE FROM od_blocks
       WHERE blocker_member_id = ? AND blocked_member_id = ?`,
    ).bind(memberId, targetMemberId).run();

    // Removing a block never recreates a match, candidate grant, or intent.
    // Those relationships can only be established again through their normal
    // explicit user flows.
    return {
      response: createEnvelope('block.remove.result', request.request_id, {
        removed_at: now,
      }),
    };
  }

  private async createBlock(memberId: string, request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const targetPubkey = readTargetPubkey(request);
    if (!targetPubkey || targetPubkey === ctx.senderPubkey) {
      return {
        response: createErrorEnvelope(
          request.request_id,
          'invalid_envelope',
          'Invalid target_pubkey',
        ),
      };
    }
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

    const rows = (blocks.results ?? []) as unknown as Array<{
      blocked_member_id: string;
      created_at: number;
    }>;
    const pubkeys = await this.membership.getPubkeysByMemberIds(
      rows.map((row) => row.blocked_member_id),
    );

    return {
      response: createEnvelope('block.list.result', request.request_id, {
        blocks: rows.flatMap((row) => {
          const targetPubkey = pubkeys.get(row.blocked_member_id);
          return targetPubkey
            ? [{ target_pubkey: targetPubkey, created_at: row.created_at }]
            : [];
        }),
      }),
    };
  }

  private async createUnmatch(memberId: string, request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const targetPubkey = readTargetPubkey(request);
    if (!targetPubkey || targetPubkey === ctx.senderPubkey) {
      return {
        response: createErrorEnvelope(
          request.request_id,
          'invalid_envelope',
          'Invalid target_pubkey',
        ),
      };
    }
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
