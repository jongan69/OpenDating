/**
 * D1 Membership Store
 *
 * Manages OpenDating member lifecycle and private profiles.
 * Member IDs are pseudonymous: SHA-256(pubkey || relay_salt).
 */
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '../../crypto/encryption.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemberState = 'active' | 'paused' | 'deleted';
export type ProfileVisibility = 'discoverable' | 'hidden' | 'paused';

export interface MemberRecord {
  memberId: string;
  pubkey: string;
  state: MemberState;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileRecord {
  memberId: string;
  profileEventId: string | null;
  displayNameHash: string | null;
  visibility: ProfileVisibility;
  pausedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Pseudonymous member ID
// ---------------------------------------------------------------------------

/** Derive a pseudonymous member ID from pubkey. */
export function deriveMemberId(pubkey: string, relaySalt: string): string {
  const input = new TextEncoder().encode(pubkey + relaySalt);
  return bytesToHex(sha256(input));
}

// ---------------------------------------------------------------------------
// D1 Store
// ---------------------------------------------------------------------------

export class D1MembershipStore {
  private relaySalt: string;

  constructor(private db: D1Database, relaySalt?: string) {
    // Salt should come from a Worker secret in production
    this.relaySalt = relaySalt || 'opendating-membership-v1';
  }

  getMemberId(pubkey: string): string {
    return deriveMemberId(pubkey, this.relaySalt);
  }

  // -----------------------------------------------------------------------
  // Member lifecycle
  // -----------------------------------------------------------------------

  async getMember(pubkey: string): Promise<MemberRecord | null> {
    const memberId = this.getMemberId(pubkey);
    const session = this.db.withSession('first-unconstrained');
    const row = await session.prepare(
      'SELECT * FROM od_members WHERE member_id = ?'
    ).bind(memberId).first() as Record<string, unknown> | null;

    if (!row) return null;
    return {
      memberId: row.member_id as string,
      pubkey: row.pubkey as string,
      state: row.state as MemberState,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  async createMember(pubkey: string): Promise<MemberRecord> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    await session.prepare(
      `INSERT OR IGNORE INTO od_members (member_id, pubkey, state, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?)`
    ).bind(memberId, pubkey, now, now).run();

    // Also create profile record
    await session.prepare(
      `INSERT OR IGNORE INTO od_profiles (member_id, visibility, created_at, updated_at)
       VALUES (?, 'discoverable', ?, ?)`
    ).bind(memberId, now, now).run();

    return {
      memberId,
      pubkey,
      state: 'active',
      createdAt: now,
      updatedAt: now,
    };
  }

  async ensureMember(pubkey: string): Promise<MemberRecord> {
    const existing = await this.getMember(pubkey);
    if (existing) {
      if (existing.state === 'deleted') {
        throw new Error('Member has been deleted');
      }
      return existing;
    }
    return this.createMember(pubkey);
  }

  async pauseMember(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    await session.batch([
      session.prepare(
        `UPDATE od_members SET state = 'paused', updated_at = ? WHERE member_id = ?`
      ).bind(now, memberId),
      session.prepare(
        `UPDATE od_profiles SET visibility = 'paused', paused_at = ?, updated_at = ? WHERE member_id = ?`
      ).bind(now, now, memberId),
    ]);
  }

  async resumeMember(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    await session.batch([
      session.prepare(
        `UPDATE od_members SET state = 'active', updated_at = ? WHERE member_id = ?`
      ).bind(now, memberId),
      session.prepare(
        `UPDATE od_profiles SET visibility = 'discoverable', paused_at = NULL, updated_at = ? WHERE member_id = ?`
      ).bind(now, memberId),
    ]);
  }

  async deleteMember(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    await session.batch([
      session.prepare(
        `UPDATE od_members SET state = 'deleted', updated_at = ? WHERE member_id = ?`
      ).bind(now, memberId),
      session.prepare(
        `UPDATE od_profiles SET visibility = 'hidden', updated_at = ? WHERE member_id = ?`
      ).bind(now, memberId),
      session.prepare(
        `DELETE FROM od_profile_media WHERE member_id = ?`
      ).bind(memberId),
    ]);
  }

  // -----------------------------------------------------------------------
  // Profile
  // -----------------------------------------------------------------------

  async getProfile(pubkey: string): Promise<ProfileRecord | null> {
    const memberId = this.getMemberId(pubkey);
    const session = this.db.withSession('first-unconstrained');
    const row = await session.prepare(
      'SELECT * FROM od_profiles WHERE member_id = ?'
    ).bind(memberId).first() as Record<string, unknown> | null;

    if (!row) return null;
    return {
      memberId: row.member_id as string,
      profileEventId: row.profile_event_id as string | null,
      displayNameHash: row.display_name_hash as string | null,
      visibility: row.visibility as ProfileVisibility,
      pausedAt: row.paused_at as number | null,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  async updateProfileEventId(pubkey: string, eventId: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.prepare(
      `UPDATE od_profiles SET profile_event_id = ?, updated_at = ? WHERE member_id = ?`
    ).bind(eventId, now, memberId).run();
  }

  async setVisibility(pubkey: string, visibility: ProfileVisibility): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.prepare(
      `UPDATE od_profiles SET visibility = ?, updated_at = ? WHERE member_id = ?`
    ).bind(visibility, now, memberId).run();
  }

  // -----------------------------------------------------------------------
  // Anti-enumeration: no list/getAll methods
  // Profiles can only be accessed by their owner or via discovery (Phase 2)
  // -----------------------------------------------------------------------
}
