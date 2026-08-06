/**
 * OpenDating Message Type Registry
 *
 * Maps message type strings to their expected payload shapes.
 * Infrastructure-independent.
 */
import type { OpenDatingEnvelope } from './envelope.js';

// ---------------------------------------------------------------------------
// Payload types (using type aliases with index signatures for TS strict mode)
// ---------------------------------------------------------------------------

export type SystemPingPayload = Record<string, never>; // Empty object

export type SystemPongPayload = {
  server_time: number;
  protocol_version: string;
};

export type SystemCapabilitiesPayload = Record<string, never>; // Empty object

export type SystemCapabilitiesResultPayload = {
  versions: string[];
  services: Array<{
    role: string;
    pubkey: string;
    supported_types?: string[];
  }>;
  features: string[];
};

// ---------------------------------------------------------------------------
// Typed envelopes
// ---------------------------------------------------------------------------

export type SystemPingRequest = OpenDatingEnvelope & { type: 'system.ping'; payload: SystemPingPayload };
export type SystemPongResponse = OpenDatingEnvelope & { type: 'system.pong'; payload: SystemPongPayload };
export type SystemCapabilitiesRequest = OpenDatingEnvelope & { type: 'system.capabilities'; payload: SystemCapabilitiesPayload };
export type SystemCapabilitiesResultResponse = OpenDatingEnvelope & { type: 'system.capabilities.result'; payload: SystemCapabilitiesResultPayload };

// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------

export function isValidPingPayload(p: unknown): p is SystemPingPayload {
  return typeof p === 'object' && p !== null && Object.keys(p as object).length === 0;
}

export function isValidPongPayload(p: unknown): p is SystemPongPayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.server_time === 'number' && typeof o.protocol_version === 'string';
}

export function isValidCapabilitiesPayload(p: unknown): p is SystemCapabilitiesPayload {
  return typeof p === 'object' && p !== null && Object.keys(p as object).length === 0;
}

export function isValidCapabilitiesResultPayload(p: unknown): p is SystemCapabilitiesResultPayload {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return Array.isArray(o.versions) && Array.isArray(o.services) && Array.isArray(o.features);
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export type PayloadValidator = (payload: unknown) => boolean;

export const MESSAGE_VALIDATORS: Record<string, PayloadValidator> = {
  // System
  'system.ping': isValidPingPayload,
  'system.pong': isValidPongPayload,
  'system.capabilities': isValidCapabilitiesPayload,
  'system.capabilities.result': isValidCapabilitiesResultPayload,
  'system.error': (p: unknown): boolean =>
    typeof p === 'object' && p !== null && typeof (p as Record<string, unknown>).code === 'string',
  // Profile
  'profile.create': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.create.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.update': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.update.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.get': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.get.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.pause': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.pause.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.resume': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.resume.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.delete': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'profile.delete.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  // Discovery
  'discovery.update_location': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'discovery.update_location.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'discovery.get_candidates': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'discovery.get_candidates.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'discovery.update_preferences': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'discovery.update_preferences.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  // Intents + Matches
  'intent.like': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'intent.like.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'intent.revoke': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'intent.revoke.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'match.list': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'match.list.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  // Blocks
  'block.create': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'block.create.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'block.list': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'block.list.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'unmatch.create': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'unmatch.create.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  // Reports + Moderation
  'report.create': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'report.create.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'moderation.action': (p: unknown): boolean => typeof p === 'object' && p !== null,
  'moderation.action.result': (p: unknown): boolean => typeof p === 'object' && p !== null,
};

export function isKnownMessageType(type: string): boolean {
  return type in MESSAGE_VALIDATORS;
}

export function getPayloadValidator(type: string): PayloadValidator | undefined {
  return MESSAGE_VALIDATORS[type];
}
