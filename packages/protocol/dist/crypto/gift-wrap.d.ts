/** Nostr event type (self-contained — no relay deps) */
export interface NostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}
export interface GiftWrapResult {
    /** The gift wrap event (kind 1059) ready to publish */
    giftWrap: NostrEvent;
    /** The ephemeral wrapper keypair */
    wrapperKeypair: {
        privateKey: string;
        publicKey: string;
    };
}
export interface UnwrapResult {
    /** The inner rumor event (unsigned, kind depends on application) */
    rumor: NostrEvent;
    /** The seal event (kind 13, signed by sender) */
    seal: NostrEvent;
    /** The sender's pubkey (from the seal) */
    senderPubkey: string;
}
/**
 * Wrap an application message as a NIP-59 gift wrap.
 *
 * @param rumorKind - The Nostr event kind for the inner rumor (e.g., 78)
 * @param rumorContent - The content of the rumor (e.g., JSON string)
 * @param senderPrivKeyHex - Sender's private key (hex)
 * @param senderPubKeyHex - Sender's public key (hex)
 * @param recipientPubKeyHex - Recipient's public key (hex)
 */
export declare function buildGiftWrap(rumorKind: number, rumorContent: string, senderPrivKeyHex: string, senderPubKeyHex: string, recipientPubKeyHex: string): Promise<GiftWrapResult>;
/**
 * Build a gift-wrapped response from service to user.
 * Same NIP-59 flow using the service's private key as sender.
 */
export declare function buildServiceResponseGiftWrap(rumorKind: number, responseContent: string, servicePrivKeyHex: string, servicePubKeyHex: string, userPubKeyHex: string): Promise<GiftWrapResult>;
//# sourceMappingURL=gift-wrap.d.ts.map