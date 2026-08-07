export declare function generateKeypair(): {
    privateKey: string;
    publicKey: string;
};
/**
 * Compute the NIP-44 v2 conversation key.
 *   shared_x = secp256k1 ECDH (unhashed x-coordinate)
 *   conversation_key = HKDF-extract(SHA-256, IKM=shared_x, salt="nip44-v2")
 */
export declare function getConversationKey(privateKeyHex: string, publicKeyHex: string): Uint8Array;
/**
 * Calculate the padded length per NIP-44 v2 padding algorithm.
 * Powers-of-two with minimum 32 bytes.
 */
export declare function calcPaddedLen(unpaddedLen: number): number;
/**
 * NIP-44 v2 encrypt a plaintext string.
 *
 * @returns Base64-encoded payload string
 */
export declare function nip44Encrypt(plaintext: string, privateKeyHex: string, publicKeyHex: string): string;
/**
 * NIP-44 v2 decrypt a payload string.
 *
 * @param payload - Base64-encoded NIP-44 v2 payload
 * @returns Decrypted plaintext string
 */
export declare function nip44Decrypt(payload: string, privateKeyHex: string, publicKeyHex: string): string;
/**
 * Compute a Nostr event ID per NIP-01.
 * sha256(JSON.stringify([0, pubkey, created_at, kind, tags, content]))
 */
export declare function getEventHash(event: {
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
}): string;
/**
 * Sign a Nostr event with a private key.
 * Returns id and sig.
 */
export declare function signEvent(event: {
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
}, privateKeyHex: string): {
    id: string;
    sig: string;
};
export declare function bytesToHex(bytes: Uint8Array): string;
export declare function hexToBytes(hex: string): Uint8Array;
export declare function bytesToBase64(bytes: Uint8Array): string;
export declare function base64ToBytes(base64: string): Uint8Array;
//# sourceMappingURL=encryption.d.ts.map