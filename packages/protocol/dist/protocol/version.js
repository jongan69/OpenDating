/**
 * OpenDating Protocol Version Compatibility
 *
 * Centralized version checking. Do not scatter string comparisons.
 */
import { OPENDATING_PROTOCOL, OPENDATING_VERSION, SUPPORTED_VERSIONS } from './constants.js';
/**
 * Check if a protocol version string is supported.
 */
export function isSupportedVersion(version) {
    return SUPPORTED_VERSIONS.includes(version);
}
/**
 * Check if a protocol identifier matches OpenDating.
 */
export function isOpenDatingProtocol(protocol) {
    return protocol === OPENDATING_PROTOCOL;
}
/**
 * Get the highest mutually supported version between client and server.
 * Returns null if no compatible version exists.
 */
export function negotiateVersion(clientVersions) {
    const serverVersions = SUPPORTED_VERSIONS;
    for (const sv of serverVersions) {
        if (clientVersions.includes(sv)) {
            return sv;
        }
    }
    return null;
}
/**
 * Get the current implementation version.
 */
export function getServerVersion() {
    return OPENDATING_VERSION;
}
//# sourceMappingURL=version.js.map