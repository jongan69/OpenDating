import { describe, it, expect, afterEach } from 'vitest';
import {
  LOADABLE_SERVICE_ROLES,
  loadServiceIdentitiesFromEnv,
  secretNameForRole,
} from '../../../src/protocols/opendating/identities/loader.js';
import { serviceIdentityRegistry } from '../../../src/protocols/opendating/identities/registry.js';
import { generateKeypair } from '../../../src/protocols/opendating/crypto/encryption.js';
import {
  initMembershipKeys,
  resetMembershipKeys,
  usingDevKeys,
} from '../../../src/protocols/opendating/storage/d1/membership.js';

function envWithRoles(roles: readonly string[]): Record<string, string> {
  const env: Record<string, string> = {};
  for (const role of roles) {
    env[secretNameForRole(role)] = generateKeypair().privateKey;
  }
  return env;
}

afterEach(() => {
  // The suite's global setup installs dev keys; restore them for other files.
  initMembershipKeys({ OD_ALLOW_DEV_KEYS: 'true' });
});

describe('secretNameForRole', () => {
  it('maps a role to its secret name', () => {
    expect(secretNameForRole('system')).toBe('OD_SYSTEM_SERVICE_PRIVKEY');
    expect(secretNameForRole('dm_policy')).toBe('OD_DM_POLICY_SERVICE_PRIVKEY');
  });
});

describe('loadServiceIdentitiesFromEnv', () => {
  it('loads every role that has a secret set', () => {
    const signers = loadServiceIdentitiesFromEnv(envWithRoles(LOADABLE_SERVICE_ROLES));
    expect(signers.map((s) => s.role).sort()).toEqual([...LOADABLE_SERVICE_ROLES].sort());
  });

  // The whole roster used to be hardcoded to `system`, which is why the
  // deployed relay advertised one service and the app could do nothing.
  it('loads more than just the system service', () => {
    const signers = loadServiceIdentitiesFromEnv(envWithRoles(LOADABLE_SERVICE_ROLES));
    expect(signers.length).toBeGreaterThan(1);
    expect(signers.some((s) => s.role === 'discovery')).toBe(true);
    expect(signers.some((s) => s.role === 'matcher')).toBe(true);
  });

  it('supports a partial rollout', () => {
    const signers = loadServiceIdentitiesFromEnv(envWithRoles(['system', 'profile']));
    expect(signers.map((s) => s.role).sort()).toEqual(['profile', 'system']);
  });

  it('returns nothing when no secrets are set', () => {
    expect(loadServiceIdentitiesFromEnv({})).toEqual([]);
  });

  it('skips a malformed key without losing the valid ones', () => {
    const env = envWithRoles(['system', 'discovery']);
    env.OD_PROFILE_SERVICE_PRIVKEY = 'not-a-valid-key';

    const signers = loadServiceIdentitiesFromEnv(env);
    const roles = signers.map((s) => s.role);

    expect(roles).toContain('system');
    expect(roles).toContain('discovery');
    expect(roles).not.toContain('profile');
  });

  it('registers loaded signers so gift wraps can be routed to them', () => {
    const signers = loadServiceIdentitiesFromEnv(envWithRoles(['matcher']));
    expect(serviceIdentityRegistry.isServicePubkey(signers[0].pubkey)).toBe(true);
  });

  it('does not advertise roles with no service implementation', () => {
    // `verification` and `media` exist in the protocol but have no service
    // class; advertising them would promise what the relay cannot serve.
    expect(LOADABLE_SERVICE_ROLES).not.toContain('verification' as never);
    expect(LOADABLE_SERVICE_ROLES).not.toContain('media' as never);
  });
});

describe('initMembershipKeys', () => {
  it('accepts real secrets', () => {
    initMembershipKeys({
      OD_INDEX_KEY_V1: 'a'.repeat(40),
      OD_DATA_KEY_V1: 'b'.repeat(40),
    });
    expect(usingDevKeys()).toBe(false);
  });

  // These keys are what make member IDs unguessable and stored pubkeys
  // unreadable. Defaulting to the published dev values silently — which is
  // what the code used to do — voids both controls.
  it('refuses to start with no keys and no explicit dev opt-in', () => {
    resetMembershipKeys();
    expect(() => initMembershipKeys({})).toThrow(/OD_INDEX_KEY_V1/);
  });

  it('refuses a partially configured pair', () => {
    resetMembershipKeys();
    expect(() => initMembershipKeys({ OD_INDEX_KEY_V1: 'a'.repeat(40) })).toThrow();
    expect(() => initMembershipKeys({ OD_DATA_KEY_V1: 'b'.repeat(40) })).toThrow();
  });

  it('rejects keys that are too short to be meaningful', () => {
    resetMembershipKeys();
    expect(() =>
      initMembershipKeys({ OD_INDEX_KEY_V1: 'short', OD_DATA_KEY_V1: 'alsoshort' }),
    ).toThrow(/32 characters/);
  });

  it('allows dev keys only when opted into explicitly', () => {
    resetMembershipKeys();
    initMembershipKeys({ OD_ALLOW_DEV_KEYS: 'true' });
    expect(usingDevKeys()).toBe(true);
  });

  it('prefers real secrets over the dev opt-in', () => {
    initMembershipKeys({
      OD_INDEX_KEY_V1: 'a'.repeat(40),
      OD_DATA_KEY_V1: 'b'.repeat(40),
      OD_ALLOW_DEV_KEYS: 'true',
    });
    expect(usingDevKeys()).toBe(false);
  });
});
