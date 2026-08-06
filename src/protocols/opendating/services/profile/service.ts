/**
 * OpenDating Profile Service — PRD-aligned
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';

export class ProfileService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    db: D1Database,
  ) {
    this.membership = new D1MembershipStore(db);
  }

  supports(type: string): boolean {
    return ['profile.create', 'profile.update', 'profile.get', 'profile.pause', 'profile.resume',
            'profile.delete', 'visibility.update'].includes(type);
  }

  async handle(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    switch (request.type) {
      case 'profile.create': return this.handleCreate(request, context);
      case 'profile.update': return this.handleUpdate(request, context);
      case 'profile.get': return this.handleGet(request, context);
      case 'profile.pause': return this.handlePause(request, context);
      case 'profile.resume': return this.handleResume(request, context);
      case 'profile.delete': return this.handleDelete(request, context);
      case 'visibility.update': return this.handleVisibilityUpdate(request, context);
      default: throw new Error(`Profile service: unsupported type ${request.type}`);
    }
  }

  private async handleCreate(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(ctx.senderPubkey);
    return { response: createEnvelope('profile.create.result', request.request_id, {
      member_id: member.memberId, status: member.status, created_at: member.createdAt }) };
  }

  private async handleUpdate(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.ensureMember(ctx.senderPubkey);
    const now = Math.floor(Date.now() / 1000);
    return { response: createEnvelope('profile.update.result', request.request_id, { updated_at: now }) };
  }

  private async handleGet(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.getMember(ctx.senderPubkey);
    if (!member) return { response: createErrorEnvelope(request.request_id, 'unauthorized', 'No membership') };
    const profile = await this.membership.getProfile(ctx.senderPubkey);
    return { response: createEnvelope('profile.get.result', request.request_id, {
      member_id: member.memberId, status: member.status, trust_tier: member.trustTier,
      visibility: profile?.visibilityState || 'hidden', completeness: profile?.completeness || 0,
      created_at: member.createdAt, updated_at: member.updatedAt }) };
  }

  private async handlePause(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.pauseMember(ctx.senderPubkey);
    return { response: createEnvelope('profile.pause.result', request.request_id, { paused_at: Math.floor(Date.now() / 1000) }) };
  }

  private async handleResume(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.resumeMember(ctx.senderPubkey);
    return { response: createEnvelope('profile.resume.result', request.request_id, { resumed_at: Math.floor(Date.now() / 1000) }) };
  }

  private async handleDelete(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.deleteMember(ctx.senderPubkey);
    return { response: createEnvelope('profile.delete.result', request.request_id, { deleted_at: Math.floor(Date.now() / 1000) }) };
  }

  private async handleVisibilityUpdate(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const vis = payload.visibility as string;
    await this.membership.setVisibility(ctx.senderPubkey, vis as any);
    return { response: createEnvelope('visibility.update.result', request.request_id, { updated_at: Math.floor(Date.now() / 1000) }) };
  }
}
