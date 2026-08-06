/**
 * OpenDating Discovery Service (Phase 2)
 *
 * Private location update, candidate discovery with anti-enumeration controls.
 * Uses coarse geohash prefixes only — NO exact GPS storage.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore } from '../../storage/d1/membership.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '../../crypto/encryption.js';

const MAX_DAILY_CANDIDATES = 50;
const CANDIDATE_BATCH_SIZE = 20;
const CANDIDATE_GRANT_TTL = 24 * 60 * 60; // 24 hours

export class DiscoveryService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    private db: D1Database,
  ) {
    this.membership = new D1MembershipStore(db);
  }

  supports(type: string): boolean {
    return type === 'discovery.update_location' || type === 'discovery.get_candidates' ||
           type === 'discovery.update_preferences';
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(ctx.senderPubkey);

    switch (request.type) {
      case 'discovery.update_location':
        return this.updateLocation(member.memberId, request);
      case 'discovery.get_candidates':
        return this.getCandidates(member.memberId, request);
      case 'discovery.update_preferences':
        return this.updatePreferences(member.memberId, request);
      default:
        throw new Error(`Discovery service does not support: ${request.type}`);
    }
  }

  private async updateLocation(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const geohashPrefix = payload.geohash_prefix as string; // Client sends coarse prefix only (3-4 chars)
    const countryCode = payload.country_code as string | undefined;

    if (!geohashPrefix || geohashPrefix.length < 3 || geohashPrefix.length > 6) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope',
        'geohash_prefix must be 3-6 characters (coarse location only)') };
    }

    const session = this.db.withSession('first-primary');
    const now = Math.floor(Date.now() / 1000);
    await session.prepare(
      `INSERT OR REPLACE INTO od_locations (member_id, geohash_prefix, geohash_prefix_short, country_code, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(memberId, geohashPrefix, geohashPrefix.substring(0, 2), countryCode || null, now).run();

    return { response: createEnvelope('discovery.update_location.result', request.request_id, { updated_at: now }) };
  }

  private async getCandidates(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const cursor = payload.cursor as string | undefined;
    const limit = Math.min(payload.limit as number || CANDIDATE_BATCH_SIZE, CANDIDATE_BATCH_SIZE);

    // Check daily quota
    const session = this.db.withSession('first-unconstrained');
    const now = Math.floor(Date.now() / 1000);
    const quota = await session.prepare(
      'SELECT * FROM od_discovery_quotas WHERE member_id = ?'
    ).bind(memberId).first() as Record<string, any> | null;

    if (quota) {
      if (now > quota.daily_reset_at) {
        // Reset daily quota
        const ps = this.db.withSession('first-primary');
        await ps.prepare(
          'UPDATE od_discovery_quotas SET daily_candidates_served = 0, daily_reset_at = ? WHERE member_id = ?'
        ).bind(now + 86400, memberId).run();
      } else if (quota.daily_candidates_served >= MAX_DAILY_CANDIDATES) {
        return { response: createErrorEnvelope(request.request_id, 'rate_limited',
          `Daily discovery limit reached (${MAX_DAILY_CANDIDATES})`) };
      }
    }

    // Check existing grants first
    const grants = await session.prepare(
      `SELECT candidate_id, distance_bucket FROM od_candidate_grants
       WHERE viewer_id = ? AND (expires_at IS NULL OR expires_at > ?)
       ORDER BY granted_at DESC LIMIT ?`
    ).bind(memberId, now, limit).all();

    if (grants.results.length > 0) {
      const candidates = grants.results.map((r: any) => ({
        candidate_id: r.candidate_id,
        distance_bucket: r.distance_bucket,
      }));

      return {
        response: createEnvelope('discovery.get_candidates.result', request.request_id, {
          candidates,
          cursor: null,
          remaining_today: MAX_DAILY_CANDIDATES - (quota?.daily_candidates_served || 0),
        }),
      };
    }

    // No grants — would need to generate new ones (future: matching algorithm)
    return {
      response: createEnvelope('discovery.get_candidates.result', request.request_id, {
        candidates: [],
        cursor: null,
        remaining_today: MAX_DAILY_CANDIDATES - (quota?.daily_candidates_served || 0),
        message: 'No candidates available. Update your location and preferences to discover new people.',
      }),
    };
  }

  private async updatePreferences(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    await session.prepare(
      `INSERT OR REPLACE INTO od_discovery_prefs (member_id, max_distance_km, min_age, max_age, intent, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      memberId,
      payload.max_distance_km || 100,
      payload.min_age || 18,
      payload.max_age || 99,
      payload.intent || 'dating',
      now,
    ).run();

    return { response: createEnvelope('discovery.update_preferences.result', request.request_id, { updated_at: now }) };
  }
}
