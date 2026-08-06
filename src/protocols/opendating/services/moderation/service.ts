/**
 * OpenDating Moderation Service (Phase 6)
 *
 * Private reports, moderation actions, sanctions.
 * Moderators do NOT have a general-purpose DM browser.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';
import { bytesToHex } from '../../crypto/encryption.js';
import { sha256 } from '@noble/hashes/sha256';

export class ModerationService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    private db: D1Database,
  ) {
    this.membership = new D1MembershipStore(db);
  }

  supports(type: string): boolean {
    return ['report.create', 'moderation.action'].includes(type);
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    switch (request.type) {
      case 'report.create': return this.createReport(request, ctx);
      case 'moderation.action': return this.applyAction(request, ctx);
      default:
        throw new Error(`Moderation service does not support: ${request.type}`);
    }
  }

  private async createReport(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const subjectPubkey = payload.subject_pubkey as string;
    const reportType = payload.report_type as string;
    const description = payload.description_encrypted as string | undefined;

    if (!subjectPubkey || !reportType) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope', 'Missing subject_pubkey or report_type') };
    }

    const validTypes = ['harassment', 'scam', 'catfish', 'underage', 'inappropriate_content', 'other'];
    if (!validTypes.includes(reportType)) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope', `Invalid report_type: ${reportType}`) };
    }

    const reporterMemberId = this.membership.getMemberId(ctx.senderPubkey);
    const subjectMemberId = this.membership.getMemberId(subjectPubkey);
    const now = Math.floor(Date.now() / 1000);

    const reportId = bytesToHex(sha256(new TextEncoder().encode(
      ctx.senderPubkey + subjectPubkey + reportType + String(now)
    )));

    const session = this.db.withSession('first-primary');
    await session.prepare(
      `INSERT INTO od_reports (report_id, reporter_member_id, subject_member_id, report_type, description_encrypted,
        evidence_event_ids, severity, state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'medium', 'pending', ?, ?)`
    ).bind(reportId, reporterMemberId, subjectMemberId, reportType,
      description || null, JSON.stringify(payload.evidence_event_ids || []),
      now, now).run();

    return { response: createEnvelope('report.create.result', request.request_id, { report_id: reportId, created_at: now }) };
  }

  private async applyAction(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    // Verify moderator role
    const session = this.db.withSession('first-unconstrained');
    const moderator = await session.prepare(
      'SELECT role FROM od_moderators WHERE pubkey = ?'
    ).bind(ctx.senderPubkey).first() as Record<string, any> | null;

    if (!moderator) {
      return { response: createErrorEnvelope(request.request_id, 'unauthorized', 'Not a moderator') };
    }

    const payload = request.payload as Record<string, any>;
    const targetMemberId = payload.target_member_id as string;
    const actionType = payload.action_type as string;
    const reason = payload.reason as string;
    const durationSeconds = payload.duration_seconds as number | undefined;
    const now = Math.floor(Date.now() / 1000);

    const actionId = bytesToHex(sha256(new TextEncoder().encode(
      ctx.senderPubkey + targetMemberId + actionType + String(now)
    )));

    const ps = this.db.withSession('first-primary');

    // Record action (immutable)
    await ps.prepare(
      `INSERT INTO od_moderation_actions (action_id, report_id, moderator_pubkey, action_type, target_member_id, reason, duration_seconds, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(actionId, payload.report_id || null, ctx.senderPubkey, actionType, targetMemberId, reason, durationSeconds || null, now).run();

    // Apply sanction if applicable
    if (['suspend', 'ban'].includes(actionType)) {
      await ps.prepare(
        `INSERT OR REPLACE INTO od_sanctions (target_member_id, sanction_type, reason, expires_at, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(targetMemberId, actionType === 'ban' ? 'banned' : 'suspended', reason,
        durationSeconds ? now + durationSeconds : null, now, ctx.senderPubkey).run();

      // Hide profile
      await ps.prepare(
        `UPDATE od_profiles SET visibility = 'hidden', updated_at = ? WHERE member_id = ?`
      ).bind(now, targetMemberId).run();
    }

    return { response: createEnvelope('moderation.action.result', request.request_id, { action_id: actionId, applied_at: now }) };
  }
}
