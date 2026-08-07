import { describe, it, expect } from 'vitest';
import {
  GEO_TIERS,
  clampAge,
  grantToken,
  publicProfile,
} from '../../../src/protocols/opendating/services/discovery/service.js';
import { validateProfileContent } from '../../../src/protocols/opendating/services/profile/service.js';
import { profileCompleteness } from '../../../src/protocols/opendating/storage/d1/membership.js';

describe('clampAge', () => {
  it('falls back when the value is missing or not a number', () => {
    expect(clampAge(undefined, 18)).toBe(18);
    expect(clampAge(null, 99)).toBe(99);
    expect(clampAge('30', 18)).toBe(18);
    expect(clampAge(NaN, 25)).toBe(25);
    expect(clampAge(Infinity, 25)).toBe(25);
  });

  // The floor is legal, not cosmetic: a client asking for 13-year-olds must
  // not be able to widen the query.
  it('never lets a preference reach below 18', () => {
    expect(clampAge(13, 18)).toBe(18);
    expect(clampAge(0, 18)).toBe(18);
    expect(clampAge(-5, 18)).toBe(18);
  });

  it('caps the upper bound and rounds', () => {
    expect(clampAge(500, 99)).toBe(120);
    expect(clampAge(30.6, 18)).toBe(31);
  });
});

describe('grantToken', () => {
  it('is opaque and fixed length', () => {
    const token = grantToken('viewer', 'candidate', 1000);
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(token).not.toContain('viewer');
    expect(token).not.toContain('candidate');
  });

  // Binding to the pair is what stops one member replaying another's grant.
  it('differs per viewer, per candidate, and per issue time', () => {
    const base = grantToken('v1', 'c1', 1000);
    expect(grantToken('v2', 'c1', 1000)).not.toBe(base);
    expect(grantToken('v1', 'c2', 1000)).not.toBe(base);
    expect(grantToken('v1', 'c1', 1001)).not.toBe(base);
  });

  it('is deterministic for identical inputs', () => {
    expect(grantToken('v', 'c', 42)).toBe(grantToken('v', 'c', 42));
  });
});

describe('publicProfile', () => {
  it('exposes the fields a card needs', () => {
    const out = publicProfile({
      display_name: 'Alex',
      age: 28,
      gender: 'woman',
      bio: 'Coffee and hiking',
      interests: ['coffee', 'hiking'],
      relationship_intent: 'long_term',
      photos: [{ id: '1', url: 'https://example.com/a.jpg', order: 0 }],
    });

    expect(out.display_name).toBe('Alex');
    expect(out.age).toBe(28);
    expect(out.bio).toBe('Coffee and hiking');
    expect(out.photos).toHaveLength(1);
  });

  // An allowlist, so anything a later change stores stays private by default.
  it('drops fields that are not explicitly published', () => {
    const out = publicProfile({
      display_name: 'Alex',
      // Fields a future feature might store alongside the profile.
      exact_location: '51.5074,-0.1278',
      phone: '+15551234567',
      email: 'alex@example.com',
      internal_notes: 'flagged',
    } as never);

    expect(out).not.toHaveProperty('exact_location');
    expect(out).not.toHaveProperty('phone');
    expect(out).not.toHaveProperty('email');
    expect(out).not.toHaveProperty('internal_notes');
    expect(Object.keys(out).sort()).toEqual([
      'age', 'bio', 'display_name', 'gender', 'interests',
      'photos', 'prompts', 'relationship_intent',
    ]);
  });

  it('caps list lengths so one profile cannot bloat a page', () => {
    const out = publicProfile({
      display_name: 'A',
      interests: Array.from({ length: 100 }, (_, i) => `i${i}`),
      photos: Array.from({ length: 50 }, (_, i) => ({ id: `${i}`, url: 'u', order: i })),
      prompts: Array.from({ length: 20 }, () => ({ question: 'q', answer: 'a' })),
    });

    expect((out.interests as unknown[]).length).toBe(30);
    expect((out.photos as unknown[]).length).toBe(9);
    expect((out.prompts as unknown[]).length).toBe(5);
  });

  it('tolerates a profile with nothing but a name', () => {
    const out = publicProfile({ display_name: 'Solo' });
    expect(out.interests).toEqual([]);
    expect(out.photos).toEqual([]);
    expect(out.display_name).toBe('Solo');
  });
});

describe('validateProfileContent', () => {
  it('accepts a well-formed profile', () => {
    expect(validateProfileContent({ display_name: 'Alex', age: 28 })).toBeNull();
  });

  it('requires a display name', () => {
    expect(validateProfileContent({})).toMatch(/display_name/);
    expect(validateProfileContent({ display_name: '   ' })).toMatch(/display_name/);
  });

  it('rejects under-18 profiles outright', () => {
    expect(validateProfileContent({ display_name: 'A', age: 17 })).toMatch(/at least 18/);
    expect(validateProfileContent({ display_name: 'A', age: 0 })).toMatch(/at least 18/);
  });

  it('rejects non-integer or absurd ages', () => {
    expect(validateProfileContent({ display_name: 'A', age: 24.5 })).toMatch(/whole number/);
    expect(validateProfileContent({ display_name: 'A', age: 500 })).toMatch(/120 or under/);
  });

  it('rejects oversized fields', () => {
    expect(validateProfileContent({ display_name: 'x'.repeat(81) })).toMatch(/80 characters/);
    expect(validateProfileContent({ display_name: 'A', bio: 'x'.repeat(2001) })).toMatch(/2000 characters/);
    expect(
      validateProfileContent({ display_name: 'A', interests: Array(31).fill('x') }),
    ).toMatch(/at most 30/);
    expect(
      validateProfileContent({ display_name: 'A', photos: Array(10).fill({}) }),
    ).toMatch(/at most 9/);
  });

  it('rejects non-objects', () => {
    expect(validateProfileContent(null)).toMatch(/must be an object/);
    expect(validateProfileContent([])).toMatch(/must be an object/);
    expect(validateProfileContent('nope')).toMatch(/must be an object/);
  });
});

describe('profileCompleteness', () => {
  it('scores an empty profile at zero and a full one at 100', () => {
    expect(profileCompleteness({})).toBe(0);
    expect(
      profileCompleteness({
        display_name: 'Alex',
        age: 28,
        gender: 'woman',
        bio: 'x'.repeat(25),
        photos: [{ id: '1', url: 'u', order: 0 }],
        interests: ['a', 'b', 'c'],
      }),
    ).toBe(100);
  });

  it('does not credit a too-short bio or a thin interest list', () => {
    expect(profileCompleteness({ display_name: 'A', bio: 'hi' })).toBe(25);
    expect(profileCompleteness({ display_name: 'A', interests: ['a'] })).toBe(25);
  });

  it('never exceeds 100', () => {
    expect(
      profileCompleteness({
        display_name: 'A', age: 30, gender: 'man', bio: 'x'.repeat(100),
        photos: Array(9).fill({ id: '1', url: 'u', order: 0 }),
        interests: Array(20).fill('x'),
      }),
    ).toBeLessThanOrEqual(100);
  });
});

describe('GEO_TIERS', () => {
  // Widening order is load-bearing: searching p3 first would serve someone
  // 50km away before their neighbour.
  it('searches tightest cell first', () => {
    expect(GEO_TIERS.map((t) => t.precision)).toEqual([5, 4, 3]);
  });

  it('never searches finer than precision 5', () => {
    for (const tier of GEO_TIERS) {
      expect(tier.precision).toBeLessThanOrEqual(5);
    }
  });

  it('gives every tier plain-language distance copy', () => {
    for (const tier of GEO_TIERS) {
      expect(tier.bucket.length).toBeGreaterThan(0);
      expect(tier.bucket).not.toMatch(/geohash|cell|p[345]/i);
    }
  });
});
