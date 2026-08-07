// ---------------------------------------------------------------------------
// Payload validation
// ---------------------------------------------------------------------------
export function isValidPingPayload(p) {
    return typeof p === 'object' && p !== null && Object.keys(p).length === 0;
}
export function isValidPongPayload(p) {
    if (typeof p !== 'object' || p === null)
        return false;
    const o = p;
    return typeof o.server_time === 'number' && typeof o.protocol_version === 'string';
}
export function isValidCapabilitiesPayload(p) {
    return typeof p === 'object' && p !== null && Object.keys(p).length === 0;
}
export function isValidCapabilitiesResultPayload(p) {
    if (typeof p !== 'object' || p === null)
        return false;
    const o = p;
    return Array.isArray(o.versions) && Array.isArray(o.services) && Array.isArray(o.features);
}
export const MESSAGE_VALIDATORS = {
    // System
    'system.ping': isValidPingPayload,
    'system.pong': isValidPongPayload,
    'system.capabilities': isValidCapabilitiesPayload,
    'system.capabilities.result': isValidCapabilitiesResultPayload,
    'system.error': (p) => typeof p === 'object' && p !== null && typeof p.code === 'string',
    // Profile
    'profile.create': (p) => typeof p === 'object' && p !== null,
    'profile.create.result': (p) => typeof p === 'object' && p !== null,
    'profile.update': (p) => typeof p === 'object' && p !== null,
    'profile.update.result': (p) => typeof p === 'object' && p !== null,
    'profile.get': (p) => typeof p === 'object' && p !== null,
    'profile.get.result': (p) => typeof p === 'object' && p !== null,
    'profile.pause': (p) => typeof p === 'object' && p !== null,
    'profile.pause.result': (p) => typeof p === 'object' && p !== null,
    'profile.resume': (p) => typeof p === 'object' && p !== null,
    'profile.resume.result': (p) => typeof p === 'object' && p !== null,
    'profile.delete': (p) => typeof p === 'object' && p !== null,
    'profile.delete.result': (p) => typeof p === 'object' && p !== null,
    // Discovery
    'discovery.update_location': (p) => typeof p === 'object' && p !== null,
    'discovery.update_location.result': (p) => typeof p === 'object' && p !== null,
    'discovery.get_candidates': (p) => typeof p === 'object' && p !== null,
    'discovery.get_candidates.result': (p) => typeof p === 'object' && p !== null,
    'discovery.update_preferences': (p) => typeof p === 'object' && p !== null,
    'discovery.update_preferences.result': (p) => typeof p === 'object' && p !== null,
    // Intents + Matches
    'intent.like': (p) => typeof p === 'object' && p !== null,
    'intent.like.result': (p) => typeof p === 'object' && p !== null,
    'intent.revoke': (p) => typeof p === 'object' && p !== null,
    'intent.revoke.result': (p) => typeof p === 'object' && p !== null,
    'match.list': (p) => typeof p === 'object' && p !== null,
    'match.list.result': (p) => typeof p === 'object' && p !== null,
    // Blocks
    'block.create': (p) => typeof p === 'object' && p !== null,
    'block.create.result': (p) => typeof p === 'object' && p !== null,
    'block.list': (p) => typeof p === 'object' && p !== null,
    'block.list.result': (p) => typeof p === 'object' && p !== null,
    'unmatch.create': (p) => typeof p === 'object' && p !== null,
    'unmatch.create.result': (p) => typeof p === 'object' && p !== null,
    // Reports + Moderation
    'report.create': (p) => typeof p === 'object' && p !== null,
    'report.create.result': (p) => typeof p === 'object' && p !== null,
    'moderation.action': (p) => typeof p === 'object' && p !== null,
    'moderation.action.result': (p) => typeof p === 'object' && p !== null,
    // Visibility
    'visibility.update': (p) => typeof p === 'object' && p !== null,
    'visibility.update.result': (p) => typeof p === 'object' && p !== null,
    // Block remove
    'block.remove': (p) => typeof p === 'object' && p !== null,
    'block.remove.result': (p) => typeof p === 'object' && p !== null,
    // Report received ack
    'report.received': (p) => typeof p === 'object' && p !== null,
    // Verification
    'verification.list': (p) => typeof p === 'object' && p !== null,
    'verification.list.result': (p) => typeof p === 'object' && p !== null,
    // Account delete
    'account.delete': (p) => typeof p === 'object' && p !== null,
    'account.delete.result': (p) => typeof p === 'object' && p !== null,
    // Service-level
    'service.ack': (p) => typeof p === 'object' && p !== null,
    'service.error': (p) => typeof p === 'object' && p !== null && typeof p.code === 'string',
};
export function isKnownMessageType(type) {
    return type in MESSAGE_VALIDATORS;
}
export function getPayloadValidator(type) {
    return MESSAGE_VALIDATORS[type];
}
//# sourceMappingURL=message-types.js.map