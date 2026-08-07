/**
 * OpenDating Matcher Service (Phase 3-4)
 *
 * Private likes (intents), reciprocal matching, match state, notifications.
 * One-way likes MUST remain invisible to the target.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '../../crypto/encryption.js';

const LIKE_EXPIRY_SEC = 90 * 24 * 60 * 60; // 90 days
const MAX_DAILY_LIKES = 30;
const DAY_SEC = 24 * 60 * 60;

function deterministicMatchId(pubkeyA: string, pubkeyB: string): string {
  const sorted = [pubkeyA, pubkeyB].sort();
  return bytesToHex(sha256(new TextEncoder().encode(sorted[0] + sorted[1])));
}

function intentId(fromPubkey: string, toPubkey: string, type: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(fromPubkey + toPubkey + type)));
}

export class MatcherService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    private db: D1Database,
  ) {
    this.membership = new D1MembershipStore(db);
  }

  supports(type: string): boolean {
    return ['intent.like', 'intent.revoke', 'match.list'].includes(type);
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(ctx.senderPubkey);

    switch (request.type) {
      case 'intent.like': return this.handleLike(member.memberId, request, ctx);
      case 'intent.revoke': return this.handleRevoke(member.memberId, request, ctx);
      case 'match.list': return this.handleMatchList(member.memberId, request);
      default:
        throw new Error(`Matcher service does not support: ${request.type}`);
    }
  }

  private async handleLike(memberId: string, request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const targetPubkey = payload.target_pubkey as string;

    if (!targetPubkey || targetPubkey === ctx.senderPubkey) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope', 'Invalid target') };
    }

    const targetMemberId = this.membership.getMemberId(targetPubkey);
    const candidateGrant = payload.candidate_grant as string | undefined;
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    // Verify the viewer holds a valid grant — without this anyone could like
    // any pubkey they could name, defeating the anti-enumeration design.
    if (!candidateGrant) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_candidate_grant',
        'This profile is no longer available.') };
    }
    const grant = await session.prepare(
      `SELECT grant_token FROM od_candidate_grants
        WHERE viewer_id = ? AND candidate_id = ? AND grant_token = ?
          AND (expires_at IS NULL OR expires_at > ?)`
    ).bind(memberId, targetMemberId, candidateGrant, now).first();
    if (!grant) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_candidate_grant',
        'No valid grant found — this profile may no longer be available') };
    }

    // Enforce daily like quota
    const likeQuota = await session.prepare(
      `SELECT daily_likes_sent, daily_reset_at FROM od_discovery_quotas WHERE member_id = ?`
    ).bind(memberId).first() as Record<string, unknown> | null;
    const likesSent = (likeQuota?.daily_likes_sent as number) ?? 0;
    const likeResetAt = (likeQuota?.daily_reset_at as number) ?? 0;
    if (now < likeResetAt && likesSent >= MAX_DAILY_LIKES) {
      return { response: createErrorEnvelope(request.request_id, 'rate_limited',
        'Daily like limit reached') };
    }

    const iid = intentId(ctx.senderPubkey, targetPubkey, 'like');

    // Record the intent
    await session.prepare(
      `INSERT OR IGNORE INTO od_intents (id, from_member_id, to_member_id, intent_type, state, created_at, expires_at)
       VALUES (?, ?, ?, 'like', 'active', ?, ?)`
    ).bind(iid, memberId, targetMemberId, now, now + LIKE_EXPIRY_SEC).run();

    // Increment like quota (atomic, handles rollover)
    const newResetAt = now >= likeResetAt ? now + DAY_SEC : likeResetAt;
    await session.prepare(
      `INSERT INTO od_discovery_quotas (member_id, daily_candidates_served, daily_likes_sent, daily_reset_at, updated_at)
       VALUES (?, 0, 1, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         daily_likes_sent = CASE WHEN daily_reset_at < ? THEN 1 ELSE daily_likes_sent + 1 END,
         daily_reset_at = CASE WHEN daily_reset_at < ? THEN ? ELSE daily_reset_at END,
         updated_at = ?`
    ).bind(memberId, newResetAt, now, now, newResetAt, now, now).run();

    // Consume the grant — one-time use
    await session.prepare(
      `DELETE FROM od_candidate_grants WHERE viewer_id = ? AND candidate_id = ?`
    ).bind(memberId, targetMemberId).run();

    // Check for reciprocal match
    const reciprocal = await session.prepare(
      `SELECT id FROM od_intents
       WHERE from_member_id = ? AND to_member_id = ? AND intent_type = 'like' AND state = 'active'`
    ).bind(targetMemberId, memberId).first() as Record<string, any> | null;

    let matchCreated = false;

    if (reciprocal) {
      const matchId = deterministicMatchId(ctx.senderPubkey, targetPubkey);
      await session.prepare(
        `INSERT OR IGNORE INTO od_matches (match_id, member_a, member_b, state, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?)`
      ).bind(matchId, memberId, targetMemberId, now, now).run();

      // Create match notifications for both parties
      const notifAId = bytesToHex(sha256(new TextEncoder().encode(matchId + memberId + 'match_created')));
      const notifBId = bytesToHex(sha256(new TextEncoder().encode(matchId + targetMemberId + 'match_created')));
      await session.batch([
        session.prepare(
          `INSERT OR IGNORE INTO od_match_notifications (id, match_id, recipient_member_id, notification_type, created_at)
           VALUES (?, ?, ?, 'match_created', ?)`
        ).bind(notifAId, matchId, memberId, now),
        session.prepare(
          `INSERT OR IGNORE INTO od_match_notifications (id, match_id, recipient_member_id, notification_type, created_at)
           VALUES (?, ?, ?, 'match_created', ?)`
        ).bind(notifBId, matchId, targetMemberId, now),
      ]);

      matchCreated = true;
    }

    return {
      response: createEnvelope('intent.like.result', request.request_id, {
        intent_id: iid,
        match_created: matchCreated,
        created_at: now,
      }),
    };
  }

  private async handleRevoke(memberId: string, request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const targetPubkey = payload.target_pubkey as string;
    const iid = intentId(ctx.senderPubkey, targetPubkey, 'like');
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    await session.prepare(
      `UPDATE od_intents SET state = 'revoked', revoked_at = ? WHERE id = ? AND from_member_id = ?`
    ).bind(now, iid, memberId).run();

    return { response: createEnvelope('intent.revoke.result', request.request_id, { revoked_at: now }) };
  }

  private async handleMatchList(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const session = this.db.withSession('first-unconstrained');
    const matches = await session.prepare(
      `SELECT match_id, member_a, member_b, state, created_at FROM od_matches
       WHERE (member_a = ? OR member_b = ?) AND state = 'active'
       ORDER BY created_at DESC LIMIT 50`
    ).bind(memberId, memberId).all();

    return {
      response: createEnvelope('match.list.result', request.request_id, {
        matches: matches.results.map((r: any) => ({
          match_id: r.match_id,
          other_member: r.member_a === memberId ? r.member_b : r.member_a,
          state: r.state,
          created_at: r.created_at,
        })),
      }),
    };
  }
}
