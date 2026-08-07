/**
 * OpenDating Discovery Service
 *
 * Private location update and candidate discovery with anti-enumeration
 * controls. Coarse geohash prefixes only — no exact GPS is ever stored.
 *
 * Matching walks outward from the tightest geohash cell to the widest,
 * stopping as soon as it has a full page. That keeps dense cities local
 * while still finding people in sparse areas, using the composite indexes
 * on od_discovery_index rather than scanning the table.
 */
import type { OpenDatingService, OpenDatingServiceContext, ServiceResult } from '../interface.js';
import type { OpenDatingEnvelope } from '../../protocol/envelope.js';
import { createEnvelope, createErrorEnvelope } from '../../protocol/envelope.js';
import { D1MembershipStore, type ProfileContentInput } from '../../storage/d1/membership.js';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '../../crypto/encryption.js';

const MAX_DAILY_CANDIDATES = 50;
const CANDIDATE_BATCH_SIZE = 20;
const CANDIDATE_GRANT_TTL = 24 * 60 * 60; // 24 hours
const DAY_SEC = 24 * 60 * 60;

/** Geohash prefix lengths searched, tightest first, with a display bucket. */
export const GEO_TIERS = [
  { column: 'geo_cell_p5', precision: 5, bucket: 'nearby' },
  { column: 'geo_cell_p4', precision: 4, bucket: 'within 10 mi' },
  { column: 'geo_cell_p3', precision: 3, bucket: '10-50 mi' },
] as const;

interface ViewerPrefs {
  ageMin: number;
  ageMax: number;
  maxDistanceKm: number;
  genders: string[] | null;
  intent: string | null;
}

interface CandidateRow {
  member_id: string;
  age: number | null;
  gender_category: string | null;
  intent_category: string | null;
}

export class DiscoveryService implements OpenDatingService {
  private membership: D1MembershipStore;

  constructor(
    public readonly role: string,
    public readonly pubkey: string,
    private db: D1Database,
  ) { this.membership = new D1MembershipStore(db); }

  supports(type: string): boolean {
    return type === 'discovery.update_location' || type === 'discovery.get_candidates' ||
           type === 'discovery.update_preferences';
  }

  async handle(request: OpenDatingEnvelope, ctx: OpenDatingServiceContext): Promise<ServiceResult> {
    const member = await this.membership.ensureMember(ctx.senderPubkey);

    switch (request.type) {
      case 'discovery.update_location':
        return this.updateLocation(ctx.senderPubkey, member.memberId, request);
      case 'discovery.get_candidates':
        return this.getCandidates(member.memberId, request);
      case 'discovery.update_preferences':
        return this.updatePreferences(ctx.senderPubkey, member.memberId, request);
      default:
        throw new Error(`Discovery service does not support: ${request.type}`);
    }
  }

  // -------------------------------------------------------------------------
  // Location
  // -------------------------------------------------------------------------

  private async updateLocation(
    pubkey: string,
    memberId: string,
    request: OpenDatingEnvelope,
  ): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const geohashPrefix = payload.geohash_prefix as string;

    if (typeof geohashPrefix !== 'string' || geohashPrefix.length < 3 || geohashPrefix.length > 6) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope',
        'geohash_prefix must be 3-6 characters (coarse location only)') };
    }
    if (!/^[0-9bcdefghjkmnpqrstuvwxyz]+$/.test(geohashPrefix)) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope',
        'geohash_prefix contains characters outside the geohash alphabet') };
    }

    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    // Truncation is deliberate: the client may send up to 6 characters, but
    // nothing finer than precision 5 (~5km) is ever stored or matched on.
    await session.prepare(
      `INSERT INTO od_discovery_index
         (member_id, geo_cell_p5, geo_cell_p4, geo_cell_p3, visible, trust_tier, activity_bucket, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, 'recently', ?)
       ON CONFLICT(member_id) DO UPDATE SET
         geo_cell_p5 = excluded.geo_cell_p5,
         geo_cell_p4 = excluded.geo_cell_p4,
         geo_cell_p3 = excluded.geo_cell_p3,
         activity_bucket = 'recently',
         updated_at = excluded.updated_at`
    ).bind(
      memberId,
      geohashPrefix.substring(0, 5),
      geohashPrefix.substring(0, 4),
      geohashPrefix.substring(0, 3),
      now,
    ).run();

    // A first location for a member who already has a profile should make them
    // discoverable straight away, rather than on their next profile edit.
    await this.membership.syncDiscoveryIndex(pubkey);

    return { response: createEnvelope('discovery.update_location.result', request.request_id, { updated_at: now }) };
  }

  // -------------------------------------------------------------------------
  // Preferences
  // -------------------------------------------------------------------------

  private async updatePreferences(
    pubkey: string,
    memberId: string,
    request: OpenDatingEnvelope,
  ): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const now = Math.floor(Date.now() / 1000);

    const ageMin = clampAge(payload.min_age, 18);
    const ageMax = clampAge(payload.max_age, 99);
    if (ageMin > ageMax) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_envelope',
        'min_age must not exceed max_age') };
    }

    const genders = Array.isArray(payload.genders)
      ? payload.genders.filter((g: unknown): g is string => typeof g === 'string')
      : null;
    const intent = typeof payload.intent === 'string' ? payload.intent : null;
    const maxDistanceKm =
      typeof payload.max_distance_km === 'number' && payload.max_distance_km > 0
        ? Math.min(Math.round(payload.max_distance_km), 500)
        : 100;

    const session = this.db.withSession('first-primary');
    await session.prepare(
      `INSERT INTO od_discovery_prefs
         (member_id, age_min, age_max, max_distance_km, genders, intent, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         age_min = excluded.age_min,
         age_max = excluded.age_max,
         max_distance_km = excluded.max_distance_km,
         genders = excluded.genders,
         intent = excluded.intent,
         updated_at = excluded.updated_at`
    ).bind(
      memberId, ageMin, ageMax, maxDistanceKm,
      genders && genders.length > 0 ? JSON.stringify(genders) : null,
      intent, now,
    ).run();

    // Changing preferences invalidates the current deck: grants were issued
    // against the old filters and would otherwise keep showing people the
    // member has just said they do not want to see.
    await session.prepare(
      `DELETE FROM od_candidate_grants WHERE viewer_id = ? AND grant_type = 'discovery'`
    ).bind(memberId).run();

    await this.membership.syncDiscoveryIndex(pubkey);

    return { response: createEnvelope('discovery.update_preferences.result', request.request_id, { updated_at: now }) };
  }

  // -------------------------------------------------------------------------
  // Candidates
  // -------------------------------------------------------------------------

  private async getCandidates(memberId: string, request: OpenDatingEnvelope): Promise<ServiceResult> {
    const payload = request.payload as Record<string, any>;
    const limit = Math.min(
      typeof payload.limit === 'number' ? payload.limit : CANDIDATE_BATCH_SIZE,
      CANDIDATE_BATCH_SIZE,
    );
    const now = Math.floor(Date.now() / 1000);

    const quota = await this.consumeQuota(memberId, now);
    if (quota.exhausted) {
      return { response: createErrorEnvelope(request.request_id, 'discovery_quota_exhausted',
        `Daily discovery limit reached (${MAX_DAILY_CANDIDATES})`) };
    }

    const viewer = await this.loadViewer(memberId);
    if (!viewer) {
      return { response: createErrorEnvelope(request.request_id, 'invalid_location',
        'Set your location before discovering people nearby') };
    }

    // Re-serve any grants still in flight before minting new ones, so a
    // dropped response does not burn the candidates it was carrying.
    let granted = await this.loadExistingGrants(memberId, now, limit);

    if (granted.length < limit) {
      const fresh = await this.generateGrants(
        memberId, viewer, limit - granted.length, now,
      );
      granted = [...granted, ...fresh];
    }

    const candidates = await this.hydrate(granted);
    const served = quota.servedToday + candidates.length;
    await this.recordServed(memberId, served, quota.resetAt, now);

    return {
      response: createEnvelope('discovery.get_candidates.result', request.request_id, {
        candidates,
        cursor: null,
        remaining_today: Math.max(MAX_DAILY_CANDIDATES - served, 0),
      }),
    };
  }

  /** Read the viewer's own index row and preferences. */
  private async loadViewer(
    memberId: string,
  ): Promise<{ cells: Record<string, string | null>; prefs: ViewerPrefs } | null> {
    const session = this.db.withSession('first-unconstrained');

    const row = await session.prepare(
      `SELECT geo_cell_p5, geo_cell_p4, geo_cell_p3 FROM od_discovery_index WHERE member_id = ?`
    ).bind(memberId).first() as Record<string, unknown> | null;

    // No location means no way to rank anyone by distance.
    if (!row || !row.geo_cell_p3) return null;

    const prefRow = await session.prepare(
      `SELECT age_min, age_max, max_distance_km, genders, intent
         FROM od_discovery_prefs WHERE member_id = ?`
    ).bind(memberId).first() as Record<string, unknown> | null;

    let genders: string[] | null = null;
    if (typeof prefRow?.genders === 'string') {
      try {
        const parsed = JSON.parse(prefRow.genders);
        if (Array.isArray(parsed) && parsed.length > 0) genders = parsed;
      } catch {
        // Malformed preference JSON falls back to "no gender filter" rather
        // than failing the request.
      }
    }

    return {
      cells: {
        geo_cell_p5: (row.geo_cell_p5 as string | null) ?? null,
        geo_cell_p4: (row.geo_cell_p4 as string | null) ?? null,
        geo_cell_p3: (row.geo_cell_p3 as string | null) ?? null,
      },
      prefs: {
        ageMin: clampAge(prefRow?.age_min, 18),
        ageMax: clampAge(prefRow?.age_max, 99),
        maxDistanceKm: typeof prefRow?.max_distance_km === 'number' ? prefRow.max_distance_km : 100,
        genders,
        intent: typeof prefRow?.intent === 'string' ? prefRow.intent : null,
      },
    };
  }

  private async loadExistingGrants(
    memberId: string,
    now: number,
    limit: number,
  ): Promise<GrantRow[]> {
    const session = this.db.withSession('first-unconstrained');
    const rows = await session.prepare(
      `SELECT candidate_id, grant_token, distance_bucket FROM od_candidate_grants
        WHERE viewer_id = ? AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY granted_at DESC LIMIT ?`
    ).bind(memberId, now, limit).all();
    return (rows.results as unknown as GrantRow[]) ?? [];
  }

  /**
   * Find new candidates and grant the viewer permission to see them.
   *
   * Widens outward through the geohash tiers, excluding at the SQL layer:
   * the viewer themselves, anyone invisible, anyone already granted or
   * already seen, and blocks in either direction.
   */
  private async generateGrants(
    memberId: string,
    viewer: { cells: Record<string, string | null>; prefs: ViewerPrefs },
    want: number,
    now: number,
  ): Promise<GrantRow[]> {
    const collected: GrantRow[] = [];
    const excluded = new Set<string>([memberId]);
    const session = this.db.withSession('first-unconstrained');

    // Distance preference decides how far out we are allowed to widen.
    const maxPrecision = viewer.prefs.maxDistanceKm <= 10 ? 5
      : viewer.prefs.maxDistanceKm <= 50 ? 4
      : 3;

    for (const tier of GEO_TIERS) {
      if (collected.length >= want) break;
      if (tier.precision < maxPrecision) break;

      const cell = viewer.cells[tier.column];
      if (!cell) continue;

      const genderFilter = viewer.prefs.genders
        ? ` AND di.gender_category IN (${viewer.prefs.genders.map(() => '?').join(',')})`
        : '';

      // Binding order must track the placeholders below exactly: cell, age
      // range, optional genders, then memberId once for each of the five
      // exclusion clauses (self, seen, blocked-by-me, blocking-me, granted),
      // then the grant-expiry cutoff and the row limit.
      const binds: unknown[] = [cell, viewer.prefs.ageMin, viewer.prefs.ageMax];
      if (viewer.prefs.genders) binds.push(...viewer.prefs.genders);
      binds.push(
        memberId, // di.member_id != ?
        memberId, // od_seen_candidates.viewer_id = ?
        memberId, // od_blocks.blocker_member_id = ?
        memberId, // od_blocks.blocked_member_id = ?
        memberId, // od_candidate_grants.viewer_id = ?
        now,
        want - collected.length,
      );

      const rows = await session.prepare(
        `SELECT di.member_id, di.age, di.gender_category, di.intent_category
           FROM od_discovery_index di
           JOIN od_members m ON m.member_id = di.member_id
          WHERE di.${tier.column} = ?
            AND di.visible = 1
            AND m.status = 'active'
            AND di.age IS NOT NULL
            AND di.age BETWEEN ? AND ?
            ${genderFilter}
            AND di.member_id != ?
            AND di.member_id NOT IN (SELECT candidate_id FROM od_seen_candidates WHERE viewer_id = ?)
            AND di.member_id NOT IN (
              SELECT blocked_member_id FROM od_blocks WHERE blocker_member_id = ?
              UNION
              SELECT blocker_member_id FROM od_blocks WHERE blocked_member_id = ?
            )
            AND di.member_id NOT IN (
              SELECT candidate_id FROM od_candidate_grants
               WHERE viewer_id = ? AND (expires_at IS NULL OR expires_at > ?)
            )
          ORDER BY di.trust_tier DESC, di.updated_at DESC
          LIMIT ?`
      ).bind(...binds).all();

      for (const raw of (rows.results ?? []) as unknown as CandidateRow[]) {
        if (excluded.has(raw.member_id)) continue;
        excluded.add(raw.member_id);
        collected.push({
          candidate_id: raw.member_id,
          grant_token: grantToken(memberId, raw.member_id, now),
          distance_bucket: tier.bucket,
        });
        if (collected.length >= want) break;
      }
    }

    if (collected.length > 0) {
      await this.persistGrants(memberId, collected, now);
    }
    return collected;
  }

  private async persistGrants(memberId: string, grants: GrantRow[], now: number): Promise<void> {
    const session = this.db.withSession('first-primary');
    const expiresAt = now + CANDIDATE_GRANT_TTL;

    const statements = grants.flatMap((g) => [
      session.prepare(
        `INSERT OR REPLACE INTO od_candidate_grants
           (viewer_id, candidate_id, grant_token, grant_type, distance_bucket, geo_precision, granted_at, expires_at)
         VALUES (?, ?, ?, 'discovery', ?, NULL, ?, ?)`
      ).bind(memberId, g.candidate_id, g.grant_token, g.distance_bucket, now, expiresAt),
      // Mark as seen at grant time rather than on like/pass. A pass is a
      // purely local gesture the client never reports, so recording here is
      // what stops the same faces cycling back round tomorrow. Grants expire
      // after a day; this ledger does not.
      session.prepare(
        `INSERT OR IGNORE INTO od_seen_candidates (viewer_id, candidate_id, seen_at)
         VALUES (?, ?, ?)`
      ).bind(memberId, g.candidate_id, now),
    ]);

    await session.batch(statements);
  }

  /**
   * Turn grants into the cards a client can actually render: real pubkey,
   * decrypted profile content, coarse distance, and the grant token.
   *
   * The pubkey has to be returned — a like is addressed to `target_pubkey`
   * and a direct message is encrypted to it, so a pseudonymous member id
   * alone leaves the viewer unable to act on anyone they are shown.
   */
  private async hydrate(grants: GrantRow[]): Promise<unknown[]> {
    const out: unknown[] = [];

    for (const grant of grants) {
      const pubkey = await this.membership.getPubkeyByMemberId(grant.candidate_id);
      if (!pubkey) continue; // Deleted between grant and hydrate.

      const content = await this.membership.getProfileContentByMemberId(grant.candidate_id);
      if (!content) continue; // No profile content — nothing worth showing.

      out.push({
        pubkey,
        profile: publicProfile(content),
        distance_bucket: grant.distance_bucket,
        candidate_grant: grant.grant_token,
      });
    }

    return out;
  }

  // -------------------------------------------------------------------------
  // Quota
  // -------------------------------------------------------------------------

  private async consumeQuota(
    memberId: string,
    now: number,
  ): Promise<{ exhausted: boolean; servedToday: number; resetAt: number }> {
    const session = this.db.withSession('first-unconstrained');
    const row = await session.prepare(
      'SELECT daily_candidates_served, daily_reset_at FROM od_discovery_quotas WHERE member_id = ?'
    ).bind(memberId).first() as Record<string, unknown> | null;

    if (!row) return { exhausted: false, servedToday: 0, resetAt: now + DAY_SEC };

    const resetAt = (row.daily_reset_at as number) ?? 0;
    if (now > resetAt) {
      // Window rolled over — the counter starts again.
      return { exhausted: false, servedToday: 0, resetAt: now + DAY_SEC };
    }

    const served = (row.daily_candidates_served as number) ?? 0;
    return { exhausted: served >= MAX_DAILY_CANDIDATES, servedToday: served, resetAt };
  }

  private async recordServed(
    memberId: string,
    served: number,
    resetAt: number,
    now: number,
  ): Promise<void> {
    const session = this.db.withSession('first-primary');
    await session.prepare(
      `INSERT INTO od_discovery_quotas
         (member_id, daily_candidates_served, daily_likes_sent, daily_reset_at, updated_at)
       VALUES (?, ?, 0, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         daily_candidates_served = excluded.daily_candidates_served,
         daily_reset_at = excluded.daily_reset_at,
         updated_at = excluded.updated_at`
    ).bind(memberId, served, resetAt, now).run();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface GrantRow {
  candidate_id: string;
  grant_token: string;
  distance_bucket: string;
}

export function clampAge(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 18), 120);
}

/**
 * Opaque, unguessable grant token. Bound to the pair so a token issued for
 * one viewer cannot be replayed by another.
 */
export function grantToken(viewerId: string, candidateId: string, now: number): string {
  return bytesToHex(
    sha256(new TextEncoder().encode(`${viewerId}:${candidateId}:${now}`)),
  ).substring(0, 32);
}

/**
 * Strip a stored profile down to what another member may see.
 *
 * An allowlist rather than a blocklist: anything future code adds to the
 * stored blob stays private until it is deliberately published here.
 */
export function publicProfile(content: ProfileContentInput): Record<string, unknown> {
  return {
    display_name: content.display_name ?? '',
    age: content.age,
    gender: content.gender,
    bio: content.bio,
    interests: Array.isArray(content.interests) ? content.interests.slice(0, 30) : [],
    relationship_intent: content.relationship_intent,
    prompts: Array.isArray(content.prompts) ? content.prompts.slice(0, 5) : [],
    photos: Array.isArray(content.photos) ? content.photos.slice(0, 9) : [],
  };
}
