/**
 * Check if a protocol version string is supported.
 */
export declare function isSupportedVersion(version: string): boolean;
/**
 * Check if a protocol identifier matches OpenDating.
 */
export declare function isOpenDatingProtocol(protocol: string): boolean;
/**
 * Get the highest mutually supported version between client and server.
 * Returns null if no compatible version exists.
 */
export declare function negotiateVersion(clientVersions: string[]): string | null;
/**
 * Get the current implementation version.
 */
export declare function getServerVersion(): string;
//# sourceMappingURL=version.d.ts.map