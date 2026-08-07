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

/** Profile content as members write it and other members see it. */
export interface ProfileContentInput {
  display_name?: string;
  age?: number;
  gender?: string;
  bio?: string;
  interests?: string[];
  relationship_intent?: string;
  prompts?: { question: string; answer: string }[];
  photos?: { id: string; url: string; order: number }[];
  [key: string]: unknown;
}

/**
 * Rough completeness score (0-100) used to rank and to nudge members with
 * thin profiles. Weighted towards the fields that actually drive a swipe.
 */
export function profileCompleteness(content: ProfileContentInput): number {
  let score = 0;
  if (content.display_name && String(content.display_name).trim()) score += 25;
  if (typeof content.age === 'number') score += 15;
  if (content.gender) score += 10;
  if (content.bio && String(content.bio).trim().length >= 20) score += 20;
  if (Array.isArray(content.photos) && content.photos.length > 0) score += 20;
  if (Array.isArray(content.interests) && content.interests.length >= 3) score += 10;
  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

/**
 * Key material for member pseudonymity and pubkey encryption at rest.
 *
 * Both keys used to be hardcoded development constants that were returned
 * unconditionally, despite comments claiming they came from Worker secrets.
 * Because this repository is public, that made member IDs reversible by
 * anyone (HMAC under a published key) and the `encrypted_pubkey` column
 * readable by anyone who obtained the database — the two controls the
 * storage privacy audit says protect members.
 *
 * They are now loaded from secrets at init, and the protocol refuses to
 * start without them unless dev keys are explicitly opted into.
 */

const DEV_INDEX_KEY = 'opendating-index-key-v1-dev-only-00000000000000';
const DEV_DATA_KEY = 'opendating-data-key-v1-dev-only-000000';

let _indexKey: Uint8Array | null = null;
let _dataKeyRaw: Uint8Array | null = null;
let _usingDevKeys = false;

export interface MembershipKeyEnv {
  OD_INDEX_KEY_V1?: string;
  OD_DATA_KEY_V1?: string;
  /** Explicit opt-in to the published development keys. Never set in production. */
  OD_ALLOW_DEV_KEYS?: string;
  [key: string]: string | undefined;
}

/**
 * Initialise key material from the environment.
 *
 * Throws when secrets are absent and dev keys have not been opted into, so a
 * misconfigured deploy fails loudly at startup rather than silently writing
 * member records that anyone can de-anonymise.
 */
export function initMembershipKeys(env: MembershipKeyEnv): void {
  const indexSecret = env.OD_INDEX_KEY_V1;
  const dataSecret = env.OD_DATA_KEY_V1;
  const allowDev = env.OD_ALLOW_DEV_KEYS === 'true';

  if (indexSecret && dataSecret) {
    if (indexSecret.length < 32 || dataSecret.length < 32) {
      throw new Error(
        'OD_INDEX_KEY_V1 and OD_DATA_KEY_V1 must each be at least 32 characters.',
      );
    }
    _indexKey = new TextEncoder().encode(indexSecret);
    _dataKeyRaw = new TextEncoder().encode(dataSecret);
    _usingDevKeys = false;
    return;
  }

  if (!allowDev) {
    throw new Error(
      'OD_INDEX_KEY_V1 and OD_DATA_KEY_V1 are required. Generate them with ' +
        '`npm run opendating:keys:generate` and set them with `wrangler secret put`. ' +
        'For local development only, set OD_ALLOW_DEV_KEYS=true.',
    );
  }

  console.warn(
    '[OpenDating] SECURITY: using published development key material. ' +
      'Member IDs are reversible and stored pubkeys are readable. ' +
      'Never run this configuration with real users.',
  );
  _indexKey = new TextEncoder().encode(DEV_INDEX_KEY);
  _dataKeyRaw = new TextEncoder().encode(DEV_DATA_KEY);
  _usingDevKeys = true;
}

/** True when the process is running on the published development keys. */
export function usingDevKeys(): boolean {
  return _usingDevKeys;
}

/** Test helper — clears loaded key material. */
export function resetMembershipKeys(): void {
  _indexKey = null;
  _dataKeyRaw = null;
  _usingDevKeys = false;
}

function indexKey(): Uint8Array {
  if (!_indexKey) {
    throw new Error('Membership keys not initialised — call initMembershipKeys(env) first.');
  }
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

async function encryptString(plaintext: string, dataKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
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

async function decryptString(encryptedHex: string, dataKey: CryptoKey): Promise<string> {
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
  if (!_dataKeyRaw) {
    throw new Error('Membership keys not initialised — call initMembershipKeys(env) first.');
  }
  // AES-GCM needs exactly 32 bytes; initMembershipKeys enforces the minimum.
  return crypto.subtle.importKey(
    'raw',
    _dataKeyRaw.slice(0, 32),
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
    const pubkeyDecrypted = await decryptString(row.encrypted_pubkey as string, dk);

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
    const encryptedPubkey = await encryptString(pubkey, dk);

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

  /**
   * Store the member's profile content.
   *
   * The content blob is encrypted at rest under the data key; only the few
   * fields discovery filters on (age, gender, intent) are denormalised into
   * columns, so a database dump exposes coarse buckets rather than bios,
   * names, and photos.
   *
   * This replaces the old `updateProfileEventId`, which took an event id and
   * silently discarded it — profiles had no content at all as a result.
   */
  async updateProfileContent(
    pubkey: string,
    content: ProfileContentInput,
  ): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const dk = await this.ensureDataKey();
    const encrypted = await encryptString(JSON.stringify(content), dk);

    const age = typeof content.age === 'number' ? content.age : null;
    const gender = typeof content.gender === 'string' ? content.gender : null;
    const intent =
      typeof content.relationship_intent === 'string' ? content.relationship_intent : null;

    const session = this.db.withSession('first-primary');
    await session.prepare(
      `INSERT INTO od_profiles
         (member_id, profile_version, encrypted_profile_payload, age, gender_category,
          relationship_intent, visibility_state, completeness, created_at, updated_at)
       VALUES (?, 1, ?, ?, ?, ?, 'discoverable', ?, ?, ?)
       ON CONFLICT(member_id) DO UPDATE SET
         profile_version = od_profiles.profile_version + 1,
         encrypted_profile_payload = excluded.encrypted_profile_payload,
         age = excluded.age,
         gender_category = excluded.gender_category,
         relationship_intent = excluded.relationship_intent,
         completeness = excluded.completeness,
         updated_at = excluded.updated_at`
    ).bind(
      memberId, encrypted, age, gender, intent,
      profileCompleteness(content), now, now,
    ).run();
  }

  /**
   * Recover a member's real pubkey from their pseudonymous id.
   *
   * Member ids are one-way (HMAC), so this is the only path back. It exists
   * because acting on a candidate is impossible without it: a like is
   * addressed to `target_pubkey` and a direct message is NIP-44 encrypted to
   * that key. Callers must only use it for members the viewer holds a grant
   * for — it is the boundary where pseudonymity is deliberately traded for a
   * usable product, so widening its use widens who is identifiable.
   */
  async getPubkeyByMemberId(memberId: string): Promise<string | null> {
    const session = this.db.withSession('first-unconstrained');
    const row = await session.prepare(
      `SELECT encrypted_pubkey FROM od_members WHERE member_id = ? AND status = 'active'`
    ).bind(memberId).first() as Record<string, unknown> | null;

    if (typeof row?.encrypted_pubkey !== 'string') return null;
    try {
      const dk = await this.ensureDataKey();
      return await decryptString(row.encrypted_pubkey, dk);
    } catch {
      return null;
    }
  }

  /** Read back a member's own decrypted profile content. */
  async getProfileContent(pubkey: string): Promise<ProfileContentInput | null> {
    return this.getProfileContentByMemberId(this.getMemberId(pubkey));
  }

  /**
   * Decrypt a member's profile content by member id — used by discovery to
   * build the cards granted viewers see.
   */
  async getProfileContentByMemberId(
    memberId: string,
  ): Promise<ProfileContentInput | null> {
    const session = this.db.withSession('first-unconstrained');
    const row = await session.prepare(
      'SELECT encrypted_profile_payload FROM od_profiles WHERE member_id = ?'
    ).bind(memberId).first() as Record<string, unknown> | null;

    const blob = row?.encrypted_profile_payload;
    if (typeof blob !== 'string' || blob.length === 0) return null;

    try {
      const dk = await this.ensureDataKey();
      return JSON.parse(await decryptString(blob, dk)) as ProfileContentInput;
    } catch {
      // A profile written under a rotated or different key is unreadable.
      // Treat it as absent rather than failing the whole candidate page.
      return null;
    }
  }

  /**
   * Batch-recover pubkeys for a page of candidates.
   *
   * One D1 round trip instead of N — the hot path in discovery. Decryption
   * is still per-row (AES-GCM) but that is CPU-bound and parallelisable.
   */
  async getPubkeysByMemberIds(memberIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (memberIds.length === 0) return result;

    const placeholders = memberIds.map(() => '?').join(',');
    const session = this.db.withSession('first-unconstrained');
    const rows = await session.prepare(
      `SELECT member_id, encrypted_pubkey FROM od_members
        WHERE member_id IN (${placeholders}) AND status = 'active'`
    ).bind(...memberIds).all();

    const dk = await this.ensureDataKey();
    for (const row of (rows.results ?? []) as unknown as { member_id: string; encrypted_pubkey: string }[]) {
      try {
        const pubkey = await decryptString(row.encrypted_pubkey, dk);
        result.set(row.member_id, pubkey);
      } catch { /* skip unreadable rows */ }
    }
    return result;
  }

  /**
   * Batch-decrypt profile content for a page of candidates.
   *
   * One D1 round trip instead of N. Decryption per row, CPU-bound.
   */
  async getProfileContentsByMemberIds(
    memberIds: string[],
  ): Promise<Map<string, ProfileContentInput>> {
    const result = new Map<string, ProfileContentInput>();
    if (memberIds.length === 0) return result;

    const placeholders = memberIds.map(() => '?').join(',');
    const session = this.db.withSession('first-unconstrained');
    const rows = await session.prepare(
      `SELECT member_id, encrypted_profile_payload FROM od_profiles
        WHERE member_id IN (${placeholders})`
    ).bind(...memberIds).all();

    const dk = await this.ensureDataKey();
    for (const row of (rows.results ?? []) as unknown as { member_id: string; encrypted_profile_payload: string }[]) {
      const blob = row.encrypted_profile_payload;
      if (typeof blob !== 'string' || blob.length === 0) continue;
      try {
        result.set(row.member_id, JSON.parse(await decryptString(blob, dk)) as ProfileContentInput);
      } catch { /* skip unreadable rows */ }
    }
    return result;
  }

  /**
   * Mirror a member's filterable attributes into the discovery index.
   *
   * `od_discovery_index` is the denormalised table discovery scans, so it has
   * to be refreshed whenever profile content, visibility, or location change.
   * Geo cells are left untouched here — only the discovery service knows them,
   * and it writes them on location update.
   */
  async syncDiscoveryIndex(pubkey: string): Promise<void> {
    const memberId = this.getMemberId(pubkey);
    const now = Math.floor(Date.now() / 1000);
    const session = this.db.withSession('first-primary');

    const row = await session.prepare(
      `SELECT p.age, p.gender_category, p.relationship_intent, p.visibility_state,
              m.status, m.trust_tier
         FROM od_members m LEFT JOIN od_profiles p ON p.member_id = m.member_id
        WHERE m.member_id = ?`
    ).bind(memberId).first() as Record<string, unknown> | null;

    if (!row) return;

    // Only an active member with a discoverable profile is visible. Paused,
    // suspended, and banned members must drop out of discovery immediately.
    const visible =
      row.status === 'active' && row.visibility_state === 'discoverable' ? 1 : 0;

    await session.prepare(
      `INSERT INTO od_discovery_index
         (member_id, age, gender_category, intent_category, visible, trust_tier,
          activity_bucket, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'recently', ?)
       ON CONFLICT(member_id) DO UPDATE SET
         age = excluded.age,
         gender_category = excluded.gender_category,
         intent_category = excluded.intent_category,
         visible = excluded.visible,
         trust_tier = excluded.trust_tier,
         activity_bucket = excluded.activity_bucket,
         updated_at = excluded.updated_at`
    ).bind(
      memberId,
      (row.age as number | null) ?? null,
      (row.gender_category as string | null) ?? null,
      (row.relationship_intent as string | null) ?? null,
      visible,
      (row.trust_tier as number | null) ?? 0,
      now,
    ).run();
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
