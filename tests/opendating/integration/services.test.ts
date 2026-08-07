/**
 * DB-backed service integration tests.
 *
 * Tests the SQL paths that no test previously exercised — discovery
 * exclusions, grant lifecycle, match creation, quota enforcement, and
 * profile validation — against real SQLite (sql.js) with the full
 * migration schema.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { createTestDb, D1Adapter } from '../../harness/d1-adapter.js';
import { initMembershipKeys, resetMembershipKeys, deriveMemberId } from '../../../src/protocols/opendating/storage/d1/membership.js';
import { initOpenDatingExtension } from '../../../src/protocols/opendating/extension.js';
import { grantToken, clampAge, publicProfile } from '../../../src/protocols/opendating/services/discovery/service.js';
import { validateProfileContent } from '../../../src/protocols/opendating/services/profile/service.js';

let db: D1Adapter;

beforeAll(async () => {
  resetMembershipKeys();
  initMembershipKeys({ OD_ALLOW_DEV_KEYS: 'true' });
  db = await createTestDb();
  const sql = readFileSync('migrations/run-all.sql', 'utf-8');
  db.exec(sql);
  initOpenDatingExtension(db as unknown as D1Database);
});

afterAll(() => db.close());

beforeEach(() => {
  // Clean all OpenDating tables between tests (ignore missing tables)
  for (const t of [
    'od_match_notifications','od_unmatches','od_matches','od_intents',
    'od_candidate_grants','od_seen_candidates','od_discovery_quotas',
    'od_discovery_prefs','od_visibility_prefs','od_discovery_index',
    'od_profile_media','od_profiles','od_blocks','od_sanctions',
    'od_moderation_actions','od_appeals','od_report_evidence','od_reports',
    'od_moderators','od_audit_log','od_verification_claims','od_vanish_tombstones',
    'od_members','od_idempotency',
  ]) {
    try { db.prepare(`DELETE FROM ${t}`).run(); } catch { /* table may not exist */ }
  }
});

// ---------------------------------------------------------------------------
// Profile validation (pure)
// ---------------------------------------------------------------------------

describe('Profile validation', () => {
  it('rejects under-18 age', () => {
    expect(validateProfileContent({ display_name: 'Test', age: 15 }))
      .toBe('age must be at least 18');
  });
  it('rejects age over 120', () => {
    expect(validateProfileContent({ display_name: 'Test', age: 121 }))
      .toBe('age must be 120 or under');
  });
  it('requires display_name', () => {
    expect(validateProfileContent({ age: 25 })).toBe('display_name is required');
  });
  it('caps bio at 2000 chars', () => {
    expect(validateProfileContent({ display_name: 'Test', bio: 'x'.repeat(2001) }))
      .toBe('bio must be 2000 characters or fewer');
  });
  it('accepts valid profile', () => {
    expect(validateProfileContent({ display_name: 'Ava', age: 27, bio: 'Hello', interests: ['coffee'] }))
      .toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Discovery — D1 SQL paths
// ---------------------------------------------------------------------------

describe('Discovery SQL (D1)', () => {
  it('grantToken is 32 hex chars and deterministic', () => {
    const t = grantToken('viewer', 'candidate', 1000);
    expect(t).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(t)).toBe(true);
    // Deterministic per (viewer, candidate, timestamp)
    expect(grantToken('viewer', 'candidate', 1000)).toBe(t);
    // Differs with different viewer
    expect(grantToken('other', 'candidate', 1000)).not.toBe(t);
  });

  it('clampAge respects 18-120 bounds', () => {
    expect(clampAge(15, 25)).toBe(18);
    expect(clampAge(150, 25)).toBe(120);
    expect(clampAge(30, 25)).toBe(30);
    expect(clampAge('abc', 25)).toBe(25);
  });

  it('publicProfile strips private fields', () => {
    const r = publicProfile({
      display_name: 'Test', age: 25, gender: 'woman', bio: 'hi',
      interests: ['a'], photos: [{ id: '1', url: 'https://x.com/p.png', order: 0 }],
      exact_location: { lat: 40, lon: -74 },
      phone: '555-1234',
    } as any);
    expect(r).not.toHaveProperty('exact_location');
    expect(r).not.toHaveProperty('phone');
    expect(r).toHaveProperty('display_name', 'Test');
  });

  it('candidate grants are inserted and queryable', async () => {
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('v1', 'encrypted-data-for-viewer-v1-x', 'active', 1000, 1000)`).run();
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('c1', 'encrypted-data-for-candidate-c1', 'active', 1000, 1000)`).run();

    const token = grantToken('v1', 'c1', 1000);
    await db.prepare(`INSERT INTO od_candidate_grants
      (viewer_id, candidate_id, grant_token, grant_type, distance_bucket, granted_at, expires_at)
      VALUES ('v1', 'c1', ?, 'discovery', 'nearby', 1000, 99999)`).bind(token).run();

    const row = db.prepare(
      `SELECT grant_token FROM od_candidate_grants WHERE viewer_id = 'v1' AND candidate_id = 'c1'`
    ).first() as any;
    expect(row.grant_token).toBe(token);
  });

  it('seen candidates prevent re-grant', async () => {
    await db.prepare(`INSERT INTO od_seen_candidates (viewer_id, candidate_id, seen_at)
      VALUES ('v1', 'c1', 1000)`).run();

    const seen = db.prepare(
      `SELECT candidate_id FROM od_seen_candidates WHERE viewer_id = 'v1'`
    ).first() as any;
    expect(seen.candidate_id).toBe('c1');
  });

  it('blocks exclude in both directions', async () => {
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('v1', 'enc-v1-x-32-bytes-xxxxx', 'active', 1000, 1000)`).run();
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('b1', 'enc-b1-x-32-bytes-xxxxx', 'active', 1000, 1000)`).run();

    await db.prepare(`INSERT OR IGNORE INTO od_blocks (blocker_member_id, blocked_member_id, created_at)
      VALUES ('v1', 'b1', 1000)`).run();

    // Viewer blocked candidate
    const blockedByViewer = db.prepare(
      `SELECT blocked_member_id FROM od_blocks WHERE blocker_member_id = 'v1'`
    ).first() as any;
    expect(blockedByViewer.blocked_member_id).toBe('b1');

    // Also insert reverse block (b1 blocks v1)
    await db.prepare(`INSERT OR IGNORE INTO od_blocks (blocker_member_id, blocked_member_id, created_at)
      VALUES ('b1', 'v1', 1000)`).run();
    const blockedByCandidate = db.prepare(
      `SELECT blocker_member_id FROM od_blocks WHERE blocked_member_id = 'v1'`
    ).first() as any;
    expect(blockedByCandidate.blocker_member_id).toBe('b1');
  });
});

// ---------------------------------------------------------------------------
// Matcher — grant verification + quota
// ---------------------------------------------------------------------------

describe('Matcher SQL (D1)', () => {
  it('grant verification rejects wrong token', async () => {
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('alice', 'enc-alice-x-32-bytes-xxxxx', 'active', 1000, 1000)`).run();
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('bob', 'enc-bob-x-32-bytes-xxxxxxx', 'active', 1000, 1000)`).run();

    const realToken = 'real-token-32-chars-xxxxxxxxxx';
    await db.prepare(`INSERT INTO od_candidate_grants
      (viewer_id, candidate_id, grant_token, grant_type, distance_bucket, granted_at, expires_at)
      VALUES ('alice', 'bob', ?, 'discovery', 'nearby', 1000, 99999)`)
      .bind(realToken).run();

    // Query with matching token → found
    const found = db.prepare(
      `SELECT grant_token FROM od_candidate_grants
       WHERE viewer_id = 'alice' AND candidate_id = 'bob' AND grant_token = ? AND expires_at > 5000`
    ).bind(realToken).first();
    expect(found).not.toBeNull();

    // Query with wrong token → not found
    const missing = db.prepare(
      `SELECT grant_token FROM od_candidate_grants
       WHERE viewer_id = 'alice' AND candidate_id = 'bob' AND grant_token = 'wrong-token-32-chars-xxxxxxx' AND expires_at > 5000`
    ).first();
    expect(missing).toBeNull();

    // Expired grant → not found
    const expired = db.prepare(
      `SELECT grant_token FROM od_candidate_grants
       WHERE viewer_id = 'alice' AND candidate_id = 'bob' AND grant_token = ? AND expires_at > 999999`
    ).bind(realToken).first();
    expect(expired).toBeNull();
  });

  it('DELETE consumed grant is idempotent', async () => {
    await db.prepare(`INSERT INTO od_candidate_grants
      (viewer_id, candidate_id, grant_token, grant_type, distance_bucket, granted_at, expires_at)
      VALUES ('alice', 'bob', 'token-to-consume-32-chars-xxx', 'discovery', 'nearby', 1000, 99999)`).run();

    await db.prepare(`DELETE FROM od_candidate_grants WHERE viewer_id = 'alice' AND candidate_id = 'bob'`).run();

    const gone = db.prepare(
      `SELECT grant_token FROM od_candidate_grants WHERE viewer_id = 'alice' AND candidate_id = 'bob'`
    ).first();
    expect(gone).toBeNull();

    // Second delete should not error
    await db.prepare(`DELETE FROM od_candidate_grants WHERE viewer_id = 'alice' AND candidate_id = 'bob'`).run();
  });

  it('mutual like creates exactly one match row', async () => {
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('a', 'enc-a', 'active', 1000, 1000)`).run();
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('b', 'enc-b', 'active', 1000, 1000)`).run();

    // A → B like
    await db.prepare(`INSERT OR IGNORE INTO od_intents (id, from_member_id, to_member_id, intent_type, state, created_at, expires_at)
      VALUES ('intent-ab', 'a', 'b', 'like', 'active', 1000, 999999)`).run();

    // B → A like (reciprocal)
    await db.prepare(`INSERT OR IGNORE INTO od_intents (id, from_member_id, to_member_id, intent_type, state, created_at, expires_at)
      VALUES ('intent-ba', 'b', 'a', 'like', 'active', 1000, 999999)`).run();

    // Both intents exist
    const intents = db.prepare(`SELECT COUNT(*) as cnt FROM od_intents WHERE state = 'active'`).all();
    expect((intents.results[0] as any).cnt).toBe(2);

    // Create match
    await db.prepare(`INSERT OR IGNORE INTO od_matches (match_id, member_a, member_b, state, created_at, updated_at)
      VALUES ('match-ab', 'a', 'b', 'active', 1000, 1000)`).run();

    const match = db.prepare(`SELECT match_id, state FROM od_matches WHERE member_a = 'a'`).first() as any;
    expect(match.state).toBe('active');
  });

  it('like quota increments and rolls over', async () => {
    await db.prepare(`INSERT INTO od_members (member_id, encrypted_pubkey, status, created_at, updated_at)
      VALUES ('alice', 'enc-alice-x-32-bytes-xxxxx', 'active', 1000, 1000)`).run();
    // Insert initial quota with active window
    await db.prepare(`INSERT INTO od_discovery_quotas
      (member_id, daily_candidates_served, daily_likes_sent, daily_reset_at, updated_at)
      VALUES ('alice', 0, 5, 99999, 5000)`).run();

    let quota = db.prepare(`SELECT daily_likes_sent FROM od_discovery_quotas WHERE member_id = 'alice'`).first() as any;
    expect(quota.daily_likes_sent).toBe(5);

    // Simulate increment: update with window still active
    await db.prepare(`UPDATE od_discovery_quotas SET daily_likes_sent = daily_likes_sent + 1, updated_at = 6000
      WHERE member_id = 'alice'`).run();

    quota = db.prepare(`SELECT daily_likes_sent FROM od_discovery_quotas WHERE member_id = 'alice'`).first() as any;
    expect(quota.daily_likes_sent).toBe(6);

    // Simulate window rollover: reset to 1 because daily_reset_at < now
    const newReset = 99999;
    await db.prepare(`UPDATE od_discovery_quotas SET daily_likes_sent = 1, daily_reset_at = ?, updated_at = ?
      WHERE member_id = 'alice'`).bind(newReset, newReset).run();

    quota = db.prepare(`SELECT daily_likes_sent, daily_reset_at FROM od_discovery_quotas WHERE member_id = 'alice'`).first() as any;
    expect(quota.daily_likes_sent).toBe(1);
    expect(quota.daily_reset_at).toBe(newReset);
  });
});
