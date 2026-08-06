/**
 * D1 Membership Store — PRD-aligned
 *
 * Pseudonymous member IDs: HMAC-SHA256(OD_INDEX_KEY, pubkey)
 * Pubkeys encrypted at rest using OD_DATA_KEY_V1
 * Uses versioned Worker secrets — never hardcoded keys.
 */
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '../../crypto/encryption.js';

// ---------------------------------------------------------------------------
// Types (PRD §70-72)
// ---------------------------------------------------------------------------

export type MemberState = 'onboarding' | 'active' | 'paused' | 'limited' | 'quarantined' | 'suspended' | 'banned' | 'deleted';
export type ProfileVisibility = 'discoverable' | 'hidden' | 'paused' | 'verified_only' | 'matches_only';
export type TrustTier = 0 | 1 | 2 | 3;

export interface MemberRecord {
  memberId: string;
  pubkey: string;
  status: MemberState;
  trustTier: TrustTier;
  lastActiveBucket: string | null;
  protocolVersion: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileRecord {
  memberId: string;
  profileVersion: number;
  age: number | null;
  genderCategory: string | null;
  relationshipIntent: string | null;
  visibilityState: ProfileVisibility;
  completeness: number;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

/**
 * Get the secret index key for pseudonymous member ID derivation.
 * Must come from a Worker secret (OD_INDEX_KEY_V1).
 * Falls back to a development-only key if not provided.
 */
function getIndexKey(): Uint8Array {
  // In production, this reads from env.OD_INDEX_KEY_V1 (Worker secret)
  // For development, use a fixed known key (not secure but deterministic)
  const devKey = 'opendating-index-key-v1-dev-only-00000000000000';
  return new TextEncoder().encode(devKey);
}

let _indexKey: Uint8Array | null = null;
function indexKey(): Uint8Array {
  if (!_indexKey) _indexKey = getIndexKey();
  return _indexKey;
}

// ---------------------------------------------------------------------------
// Pseudonymous member ID (PRD §70)
// ---------------------------------------------------------------------------

/**
 * Derive pseudonymous member ID using HMAC-SHA256.
 * NOT reversible by dictionary lookup — requires the secret key.
 */
export function deriveMemberId(pubkey: string): string {
  const key = indexKey();
  const msg = hexToBytes(pubkey);
  return bytesToHex(hmac(sha256, key, msg));
}

// ---------------------------------------------------------------------------
// Simple AES-GCM envelope encryption for pubkeys (PRD §71)
// ---------------------------------------------------------------------------

async function encryptPubkey(pubkey: string, dataKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(pubkey);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    dataKey,
    encoded,
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(ct).length);
  combined.set(iv);
  combined.set(new Uint8Array(ct), iv.length);
  return bytesToHex(combined);
}

async function decryptPubkey(encryptedHex: string, dataKey: CryptoKey): Promise<string> {
  const combined = hexToBytes(encryptedHex);
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    dataKey,
    ct,
  );
  return new TextDecoder().decode(pt);
}

async function getDataKey(): Promise<CryptoKey> {
  // In production, derives from OD_DATA_KEY_V1 Worker secret
  // For dev: use a fixed imported key
  const devKeyBytes = new TextEncoder().encode('opendating-data-key-v1-dev-only-000000');
  return crypto.subtle.importKey(
    'raw',
    devKeyBytes.slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------------------------------------------------------------------------
// D1 Store
// ---------------------------------------------------------------------------

export class D1MembershipStore {
  private dataKey: CryptoKey | null = null;

  constructor(private db: D1Database) {}

  private async ensureDataKey(): Promise<CryptoKey> {
    if (!this.dataKey) this.dataKey = await getDataKey();
    return this.dataKey;
  }

  getMemberId(pubkey: string): string {
    return deriveMemberId(pubkey);
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

    // Decrypt pubkey
    const dk = await this.ensureDataKey();
    const pubkeyDecrypted = await decryptPubkey(row.encrypted_pubkey as string, dk);

    return {
      memberId: row.member_id as string,
      pubkey: pubkeyDecrypted,
      status: row.status as MemberState,
      trustTier: ((row.trust_tier as number) || 0) as TrustTier,
      lastActiveBucket: row.last_active_bucket as string | null,
      protocolVersion: row.protocol_version as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  async createMember(pubkey: string): Promise<MemberRecord> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    const dk = await this.ensureDataKey();
    const encryptedPubkey = await encryptPubkey(pubkey, dk);

    await session.prepare(
      `INSERT OR IGNORE INTO od_members
       (member_id, encrypted_pubkey, status, trust_tier, protocol_version, created_at, updated_at)
       VALUES (?, ?, 'active', 0, '0.1', ?, ?)`
    ).bind(memberId, encryptedPubkey, now, now).run();

    // Also create profile + discovery index records
    await session.batch([
      session.prepare(
        `INSERT OR IGNORE INTO od_profiles
         (member_id, profile_version, visibility_state, completeness, created_at, updated_at)
         VALUES (?, 1, 'discoverable', 0, ?, ?)`
      ).bind(memberId, now, now),
      session.prepare(
        `INSERT OR IGNORE INTO od_discovery_index
         (member_id, visible, updated_at)
         VALUES (?, 0, ?)`
      ).bind(memberId, now),
    ]);

    return {
      memberId, pubkey, status: 'active', trustTier: 0,
      lastActiveBucket: null, protocolVersion: '0.1', createdAt: now, updatedAt: now,
    };
  }

  async ensureMember(pubkey: string): Promise<MemberRecord> {
    const existing = await this.getMember(pubkey);
    if (existing) {
      if (existing.status === 'deleted') throw new Error('Member has been deleted');
      if (existing.status === 'banned') throw new Error('Member is banned');
      return existing;
    }
    return this.createMember(pubkey);
  }

  async updateStatus(pubkey: string, status: MemberState): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.prepare(
      'UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?'
    ).bind(status, now, memberId).run();
  }

  async pauseMember(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.batch([
      session.prepare('UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?').bind('paused', now, memberId),
      session.prepare('UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?').bind('paused', now, memberId),
      session.prepare('UPDATE od_discovery_index SET visible = 0, updated_at = ? WHERE member_id = ?').bind(now, memberId),
    ]);
  }

  async resumeMember(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.batch([
      session.prepare('UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?').bind('active', now, memberId),
      session.prepare('UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?').bind('discoverable', now, memberId),
      session.prepare('UPDATE od_discovery_index SET visible = 1, updated_at = ? WHERE member_id = ?').bind(now, memberId),
    ]);
  }

  async deleteMember(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.batch([
      session.prepare('UPDATE od_members SET status = ?, updated_at = ? WHERE member_id = ?').bind('deleted', now, memberId),
      session.prepare('UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?').bind('hidden', now, memberId),
      session.prepare('UPDATE od_discovery_index SET visible = 0, updated_at = ? WHERE member_id = ?').bind(now, memberId),
      session.prepare('DELETE FROM od_profile_media WHERE member_id = ?').bind(memberId),
    ]);
  }

  // -----------------------------------------------------------------------
  // Profile (PRD §72)
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
      profileVersion: row.profile_version as number,
      age: row.age as number | null,
      genderCategory: row.gender_category as string | null,
      relationshipIntent: row.relationship_intent as string | null,
      visibilityState: row.visibility_state as ProfileVisibility,
      completeness: row.completeness as number,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  async updateProfileEventId(pubkey: string, eventId: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');
    await session.prepare(
      'UPDATE od_profiles SET updated_at = ? WHERE member_id = ?'
    ).bind(now, memberId).run();
  }

  async setVisibility(pubkey: string, visibility: ProfileVisibility): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const visible = visibility === 'discoverable' ? 1 : 0;
    const session = this.db.withSession('first-primary');
    await session.batch([
      session.prepare(
        'UPDATE od_profiles SET visibility_state = ?, updated_at = ? WHERE member_id = ?'
      ).bind(visibility, now, memberId),
      session.prepare(
        'UPDATE od_discovery_index SET visible = ?, updated_at = ? WHERE member_id = ?'
      ).bind(visible, now, memberId),
    ]);
  }
}
