/**
 * OpenDating Profile Service — PRD-aligned
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import {
  D1MembershipStore,
  profileCompleteness,
  type ProfileContentInput,
} from '../../storage/d1/membership.js';

const MIN_AGE = 18;
const MAX_AGE = 120;
const MAX_BIO_LENGTH = 2000;
const MAX_INTERESTS = 30;
const MAX_PHOTOS = 9;

/**
 * Validate submitted profile content.
 * Returns an error message, or null when the content is acceptable.
 *
 * The age floor is a legal requirement, not a preference — a dating service
 * must not store or surface an under-18 profile.
 */
export function validateProfileContent(profile: unknown): string | null {
  if (typeof profile !== 'object' || profile === null || Array.isArray(profile)) {
    return 'profile must be an object';
  }
  const p = profile as ProfileContentInput;

  const name = typeof p.display_name === 'string' ? p.display_name.trim() : '';
  if (name.length === 0) return 'display_name is required';
  if (name.length > 80) return 'display_name must be 80 characters or fewer';

  if (p.age !== undefined) {
    if (typeof p.age !== 'number' || !Number.isInteger(p.age)) {
      return 'age must be a whole number';
    }
    if (p.age < MIN_AGE) return `age must be at least ${MIN_AGE}`;
    if (p.age > MAX_AGE) return `age must be ${MAX_AGE} or under`;
  }

  if (p.bio !== undefined && typeof p.bio === 'string' && p.bio.length > MAX_BIO_LENGTH) {
    return `bio must be ${MAX_BIO_LENGTH} characters or fewer`;
  }
  if (p.interests !== undefined && (!Array.isArray(p.interests) || p.interests.length > MAX_INTERESTS)) {
    return `interests must be an array of at most ${MAX_INTERESTS} items`;
  }
  if (p.photos !== undefined && (!Array.isArray(p.photos) || p.photos.length > MAX_PHOTOS)) {
    return `photos must be an array of at most ${MAX_PHOTOS} items`;
  }
  return null;
}

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

  /**
   * Store the member's profile content.
   *
   * This used to accept the request and discard it — profiles existed as
   * membership rows with no name, bio, or photos, so a card had nothing to
   * render. Content now persists (encrypted at rest) and the denormalised
   * filter columns are mirrored into the discovery index so the member
   * becomes findable.
   */
  private async handleUpdate(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.ensureMember(ctx.senderPubkey);
    const payload = request.payload as Record<string, any>;
    const profile = payload.profile as ProfileContentInput | undefined;

    if (profile === undefined) {
      const now = Math.floor(Date.now() / 1000);
      return { response: createEnvelope('profile.update.result', request.request_id, { updated_at: now }) };
    }

    const invalid = validateProfileContent(profile);
    if (invalid) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_profile', invalid) };
    }

    await this.membership.updateProfileContent(ctx.senderPubkey, profile);
    await this.membership.syncDiscoveryIndex(ctx.senderPubkey);

    const now = Math.floor(Date.now() / 1000);
    return { response: createEnvelope('profile.update.result', request.request_id, {
      completeness: profileCompleteness(profile),
      updated_at: now,
    }) };
  }

  private async handleGet(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.getMember(ctx.senderPubkey);
    if (!member) return { response: createErrorEnvelope(request.request_id, 'unauthorized', 'No membership') };
    const profile = await this.membership.getProfile(ctx.senderPubkey);
    // Returned so a client that lost local state (reinstall, new device) can
    // restore its own profile rather than presenting an empty edit form.
    const content = await this.membership.getProfileContent(ctx.senderPubkey);

    return { response: createEnvelope('profile.get.result', request.request_id, {
      member_id: member.memberId, status: member.status, trust_tier: member.trustTier,
      profile: content,
      visibility: profile?.visibilityState || 'hidden', completeness: profile?.completeness || 0,
      created_at: member.createdAt, updated_at: member.updatedAt }) };
  }

  private async handlePause(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.pauseMember(ctx.senderPubkey);
    // Drop out of discovery immediately — a paused member must stop being
    // served to other people on the very next candidate query.
    await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
    return { response: createEnvelope('profile.pause.result', request.request_id, { paused_at: Math.floor(Date.now() / 1000) }) };
  }

  private async handleResume(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    await this.membership.resumeMember(ctx.senderPubkey);
    await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
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
    await this.membership.syncDiscoveryIndex(ctx.senderPubkey);
    return { response: createEnvelope('visibility.update.result', request.request_id, { updated_at: Math.floor(Date.now() / 1000) }) };
  }
}
