export interface ServiceKeypair {
    privateKey: string;
    publicKey: string;
}
export declare function derivePublicKey(privateKeyHex: string): string;
export declare function validateServiceKey(privateKeyHex: string): string | null;
export declare function createServiceKeypair(privateKeyHex: string): ServiceKeypair;
//# sourceMappingURL=service-signer.d.ts.map