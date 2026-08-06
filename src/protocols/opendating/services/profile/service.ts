/**
 * OpenDating Profile Service
 *
 * Handles: profile.create, profile.update, profile.get, profile.pause, profile.resume, profile.delete
 *
 * Profile content is stored as Nostr kind 30078 events (parameterized replaceable).
 * Membership metadata and visibility controls are in D1.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '../../crypto/encryption.js';

const SUPPORTED_TYPES = new Set([
  'profile.create',
  'profile.update',
  'profile.get',
  'profile.pause',
  'profile.resume',
  'profile.delete',
]);

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
    return SUPPORTED_TYPES.has(type);
  }

  async handle(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    switch (request.type) {
      case 'profile.create':
        return this.handleCreate(request, context);
      case 'profile.update':
        return this.handleUpdate(request, context);
      case 'profile.get':
        return this.handleGet(request, context);
      case 'profile.pause':
        return this.handlePause(request, context);
      case 'profile.resume':
        return this.handleResume(request, context);
      case 'profile.delete':
        return this.handleDelete(request, context);
      default:
        throw new Error(`Profile service does not support: ${request.type}`);
    }
  }

  private async handleCreate(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(context.senderPubkey);

    return {
      response: createEnvelope('profile.create.result', request.request_id, {
        member_id: member.memberId,
        state: member.state,
        created_at: member.createdAt,
      }),
    };
  }

  private async handleUpdate(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.ensureMember(context.senderPubkey);

    const payload = request.payload as Record<string, unknown>;
    const profileEventId = payload.profile_event_id as string | undefined;

    if (profileEventId) {
      await this.membership.updateProfileEventId(context.senderPubkey, profileEventId);
    }

    return {
      response: createEnvelope('profile.update.result', request.request_id, {
        updated_at: Math.floor(Date.now() / 1000),
      }),
    };
  }

  private async handleGet(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.getMember(context.senderPubkey);
    if (!member) {
      return {
        response: createErrorEnvelope(request.request_id, 'unauthorized', 'No membership found'),
      };
    }

    const profile = await this.membership.getProfile(context.senderPubkey);

    return {
      response: createEnvelope('profile.get.result', request.request_id, {
        member_id: member.memberId,
        state: member.state,
        visibility: profile?.visibility || 'hidden',
        profile_event_id: profile?.profileEventId || null,
        paused_at: profile?.pausedAt || null,
        created_at: member.createdAt,
        updated_at: member.updatedAt,
      }),
    };
  }

  private async handlePause(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.pauseMember(context.senderPubkey);

    return {
      response: createEnvelope('profile.pause.result', request.request_id, {
        paused_at: Math.floor(Date.now() / 1000),
      }),
    };
  }

  private async handleResume(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.resumeMember(context.senderPubkey);

    return {
      response: createEnvelope('profile.resume.result', request.request_id, {
        resumed_at: Math.floor(Date.now() / 1000),
      }),
    };
  }

  private async handleDelete(request: OpenDatingEnvelope, context: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.deleteMember(context.senderPubkey);

    return {
      response: createEnvelope('profile.delete.result', request.request_id, {
        deleted_at: Math.floor(Date.now() / 1000),
      }),
    };
  }
}
