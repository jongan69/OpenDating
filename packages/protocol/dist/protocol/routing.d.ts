/**
 * Canonical request routing metadata for protocol 0.1.
 *
 * Clients use this registry to select the advertised service identity and to
 * reject a response whose type does not match the request it claims to answer.
 */
import type { OpenDatingServiceRole } from './constants.js';
export interface RequestRoute {
    role: OpenDatingServiceRole;
    resultType: string;
}
export declare const REQUEST_ROUTES: {
    readonly 'system.ping': {
        readonly role: "system";
        readonly resultType: "system.pong";
    };
    readonly 'system.capabilities': {
        readonly role: "system";
        readonly resultType: "system.capabilities.result";
    };
    readonly 'profile.create': {
        readonly role: "profile";
        readonly resultType: "profile.create.result";
    };
    readonly 'profile.update': {
        readonly role: "profile";
        readonly resultType: "profile.update.result";
    };
    readonly 'profile.get': {
        readonly role: "profile";
        readonly resultType: "profile.get.result";
    };
    readonly 'profile.pause': {
        readonly role: "profile";
        readonly resultType: "profile.pause.result";
    };
    readonly 'profile.resume': {
        readonly role: "profile";
        readonly resultType: "profile.resume.result";
    };
    readonly 'profile.delete': {
        readonly role: "profile";
        readonly resultType: "profile.delete.result";
    };
    readonly 'visibility.update': {
        readonly role: "profile";
        readonly resultType: "visibility.update.result";
    };
    readonly 'discovery.update_location': {
        readonly role: "discovery";
        readonly resultType: "discovery.update_location.result";
    };
    readonly 'discovery.get_candidates': {
        readonly role: "discovery";
        readonly resultType: "discovery.get_candidates.result";
    };
    readonly 'discovery.update_preferences': {
        readonly role: "discovery";
        readonly resultType: "discovery.update_preferences.result";
    };
    readonly 'intent.like': {
        readonly role: "matcher";
        readonly resultType: "intent.like.result";
    };
    readonly 'intent.revoke': {
        readonly role: "matcher";
        readonly resultType: "intent.revoke.result";
    };
    readonly 'match.list': {
        readonly role: "matcher";
        readonly resultType: "match.list.result";
    };
    readonly 'block.create': {
        readonly role: "dm_policy";
        readonly resultType: "block.create.result";
    };
    readonly 'block.remove': {
        readonly role: "dm_policy";
        readonly resultType: "block.remove.result";
    };
    readonly 'block.list': {
        readonly role: "dm_policy";
        readonly resultType: "block.list.result";
    };
    readonly 'unmatch.create': {
        readonly role: "dm_policy";
        readonly resultType: "unmatch.create.result";
    };
    readonly 'report.create': {
        readonly role: "moderation";
        readonly resultType: "report.create.result";
    };
    readonly 'moderation.action': {
        readonly role: "moderation";
        readonly resultType: "moderation.action.result";
    };
    readonly 'verification.list': {
        readonly role: "verification";
        readonly resultType: "verification.list.result";
    };
    readonly 'account.delete': {
        readonly role: "deletion";
        readonly resultType: "account.delete.result";
    };
};
export type OpenDatingRequestType = keyof typeof REQUEST_ROUTES;
export declare function getRequestRoute(type: string): RequestRoute | undefined;
//# sourceMappingURL=routing.d.ts.map