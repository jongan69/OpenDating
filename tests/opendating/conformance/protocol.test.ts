/**
 * OpenDating Protocol Conformance Tests
 *
 * Tests the protocol layer independently (no Cloudflare infrastructure needed).
 */
import { describe, it, expect } from 'vitest';
import {
  OPENDATING_PROTOCOL,
  OPENDATING_VERSION,
  SUPPORTED_VERSIONS,
} from '../../../src/protocols/opendating/protocol/constants.js';
import { isSupportedVersion, isOpenDatingProtocol, negotiateVersion } from '../../../src/protocols/opendating/protocol/version.js';
import { createEnvelope, validateEnvelope, checkRequestFreshness } from '../../../src/protocols/opendating/protocol/envelope.js';
import { validateODRequest } from '../../../src/protocols/opendating/protocol/validation.js';
import { OD_ERROR_CODES } from '../../../src/protocols/opendating/protocol/errors.js';

describe('protocol constants', () => {
  it('should use canonical protocol identifier', () => {
    expect(OPENDATING_PROTOCOL).toBe('opendating');
  });

  it('should use version 0.1', () => {
    expect(OPENDATING_VERSION).toBe('0.1');
  });

  it('should support only 0.1', () => {
    expect(SUPPORTED_VERSIONS).toEqual(['0.1']);
  });
});

describe('version negotiation', () => {
  it('should accept known version', () => {
    expect(isSupportedVersion('0.1')).toBe(true);
  });

  it('should reject unknown version', () => {
    expect(isSupportedVersion('99.0')).toBe(false);
    expect(isSupportedVersion('1.0')).toBe(false);
    expect(isSupportedVersion('')).toBe(false);
  });

  it('should identify OpenDating protocol', () => {
    expect(isOpenDatingProtocol('opendating')).toBe(true);
    expect(isOpenDatingProtocol('open-dating')).toBe(false);
    expect(isOpenDatingProtocol('nostr-dating')).toBe(false);
  });

  it('should negotiate highest mutually supported version', () => {
    expect(negotiateVersion(['0.1'])).toBe('0.1');
    expect(negotiateVersion(['1.0', '0.1'])).toBe('0.1');
    expect(negotiateVersion(['99.0'])).toBeNull();
  });
});

describe('envelope', () => {
  it('should create valid envelope', () => {
    const env = createEnvelope('system.ping', 'test-request-1', {});
    expect(env.protocol).toBe('opendating');
    expect(env.version).toBe('0.1');
    expect(env.type).toBe('system.ping');
    expect(env.request_id).toBe('test-request-1');
    expect(env.created_at).toBeGreaterThan(0);
    expect(env.payload).toEqual({});
  });

  it('should validate a valid envelope', () => {
    const env = createEnvelope('system.ping', 'test-12345678', {});
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
  });

  it('should reject envelope with wrong protocol', () => {
    const result = validateEnvelope({ protocol: 'wrong', version: '0.1', type: 'x', request_id: 'a', created_at: 1, payload: {} });
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('invalid_envelope');
  });

  it('should reject envelope with missing fields', () => {
    expect(validateEnvelope({}).valid).toBe(false);
    expect(validateEnvelope(null).valid).toBe(false);
    expect(validateEnvelope('string').valid).toBe(false);
  });

  it('should reject envelope with missing request_id', () => {
    const result = validateEnvelope({
      protocol: 'opendating', version: '0.1', type: 'x',
      request_id: '', created_at: 1, payload: {},
    });
    expect(result.valid).toBe(false);
  });

  it('should reject oversized envelope', () => {
    const env = createEnvelope('system.ping', 'req-1', { data: 'x'.repeat(20000) });
    const result = validateEnvelope(env, { maxSizeBytes: 100 });
    expect(result.valid).toBe(false);
  });
});

describe('request freshness', () => {
  it('should accept fresh request', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(checkRequestFreshness(now)).toBeNull();
    expect(checkRequestFreshness(now - 60)).toBeNull();
  });

  it('should reject expired request', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(checkRequestFreshness(now - 400, 300)).not.toBeNull();
  });

  it('should reject future request', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(checkRequestFreshness(now + 120, 300, 60)).not.toBeNull();
  });
});

describe('full request validation', () => {
  it('should accept valid system.ping', () => {
    const env = createEnvelope('system.ping', 'a'.repeat(16));
    const result = validateODRequest(env);
    expect(result.valid).toBe(true);
  });

  it('should reject unsupported version', () => {
    const env = { ...createEnvelope('system.ping', 'a'.repeat(16)), version: '99.0' };
    const result = validateODRequest(env);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('unsupported_version');
  });

  it('should reject unsupported message type', () => {
    const env = createEnvelope('dating.profile.create', 'a'.repeat(16));
    const result = validateODRequest(env);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe('unsupported_type');
  });

  it('should reject short request_id', () => {
    const env = createEnvelope('system.ping', 'short');
    const result = validateODRequest(env);
    expect(result.valid).toBe(false);
  });
});

describe('error codes', () => {
  it('should have all required error codes', () => {
    const required = [
      'invalid_envelope', 'unsupported_version', 'unsupported_type',
      'expired_request', 'future_request', 'duplicate_request',
      'sender_auth_mismatch', 'unknown_service', 'service_unavailable',
      'internal_error', 'rate_limited', 'unauthorized',
    ];
    for (const code of required) {
      expect(OD_ERROR_CODES).toHaveProperty(code.toUpperCase().replace(/_/g, '_').toUpperCase());
    }
  });

  it('should have unique error codes', () => {
    const codes = Object.values(OD_ERROR_CODES);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
