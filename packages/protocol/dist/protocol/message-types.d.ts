/**
 * OpenDating Message Type Registry
 *
 * Maps message type strings to their expected payload shapes.
 * Infrastructure-independent.
 */
import type { OpenDatingEnvelope } from './envelope.js';
export type SystemPingPayload = Record<string, never>;
export type SystemPongPayload = {
    server_time: number;
    protocol_version: string;
};
export type SystemCapabilitiesPayload = Record<string, never>;
export type SystemCapabilitiesResultPayload = {
    versions: string[];
    services: Array<{
        role: string;
        pubkey: string;
        supported_types?: string[];
    }>;
    features: string[];
};
export type SystemPingRequest = OpenDatingEnvelope & {
    type: 'system.ping';
    payload: SystemPingPayload;
};
export type SystemPongResponse = OpenDatingEnvelope & {
    type: 'system.pong';
    payload: SystemPongPayload;
};
export type SystemCapabilitiesRequest = OpenDatingEnvelope & {
    type: 'system.capabilities';
    payload: SystemCapabilitiesPayload;
};
export type SystemCapabilitiesResultResponse = OpenDatingEnvelope & {
    type: 'system.capabilities.result';
    payload: SystemCapabilitiesResultPayload;
};
export declare function isValidPingPayload(p: unknown): p is SystemPingPayload;
export declare function isValidPongPayload(p: unknown): p is SystemPongPayload;
export declare function isValidCapabilitiesPayload(p: unknown): p is SystemCapabilitiesPayload;
export declare function isValidCapabilitiesResultPayload(p: unknown): p is SystemCapabilitiesResultPayload;
export type PayloadValidator = (payload: unknown) => boolean;
export declare const MESSAGE_VALIDATORS: Record<string, PayloadValidator>;
export declare function isKnownMessageType(type: string): boolean;
export declare function getPayloadValidator(type: string): PayloadValidator | undefined;
//# sourceMappingURL=message-types.d.ts.map