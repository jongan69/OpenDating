/**
 * Global test setup.
 *
 * Membership key material now fails closed: the protocol refuses to start
 * without OD_INDEX_KEY_V1 / OD_DATA_KEY_V1 unless dev keys are explicitly
 * opted into. Tests take that opt-in so member IDs stay deterministic across
 * runs, which is what the conformance vectors depend on.
 */
import { initMembershipKeys } from '../src/protocols/opendating/storage/d1/membership.js';

initMembershipKeys({ OD_ALLOW_DEV_KEYS: 'true' });
