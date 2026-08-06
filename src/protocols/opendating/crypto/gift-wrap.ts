/**
 * NIP-59 Gift Wrap Construction — Official Specification Compliance
 *
 * Implements the exact NIP-59 flow:
 *   1. Rumor (kind N, unsigned, deterministic event ID per NIP-01)
 *   2. Seal (kind 13, signed by sender, empty tags, NIP-44 encrypted rumor)
 *   3. Gift Wrap (kind 1059, signed by ephemeral key, p-tag for recipient,
 *      NIP-44 encrypted seal using ephemeral→recipient conversation key)
 *
 * Timestamps: rumor uses actual time; seal and wrap use randomized past
 * timestamps for metadata hiding (per NIP-59 recommendation).
 */
import { generateKeypair, nip44Encrypt, signEvent, getEventHash } from './encryption.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import type { NostrEvent } from '../../../types.js';

// ---------------------------------------------------------------------------
// Metadata-hiding timestamp helpers
// ---------------------------------------------------------------------------

/** Maximum random past offset in seconds (2 days per NIP-59 recommendation) */
const MAX_PAST_OFFSET_SEC = 2 * 24 * 60 * 60;

/**
 * Generate a randomized timestamp in the past.
 * Per NIP-59: "timestamps SHOULD be tweaked to thwart time-analysis attacks"
 */
function randomPastTimestamp(now: number): number {
  // Random offset between 0 and MAX_PAST_OFFSET_SEC
  const offsetBytes = randomBytes(4);
  const offset = new DataView(offsetBytes.buffer).getUint32(0) % MAX_PAST_OFFSET_SEC;
  return now - offset;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GiftWrapResult {
  /** The gift wrap event (kind 1059) ready to publish */
  giftWrap: NostrEvent;
  /** The ephemeral wrapper keypair */
  wrapperKeypair: { privateKey: string; publicKey: string };
}

export interface UnwrapResult {
  /** The inner rumor event (unsigned, kind depends on application) */
  rumor: NostrEvent;
  /** The seal event (kind 13, signed by sender) */
  seal: NostrEvent;
  /** The sender's pubkey (from the seal) */
  senderPubkey: string;
}

// ---------------------------------------------------------------------------
// Construction: Build a gift wrap (NIP-59)
// ---------------------------------------------------------------------------

/**
 * Wrap an application message as a NIP-59 gift wrap.
 *
 * @param rumorKind - The Nostr event kind for the inner rumor (e.g., 78)
 * @param rumorContent - The content of the rumor (e.g., JSON string)
 * @param senderPrivKeyHex - Sender's private key (hex)
 * @param senderPubKeyHex - Sender's public key (hex)
 * @param recipientPubKeyHex - Recipient's public key (hex)
 */
export async function buildGiftWrap(
  rumorKind: number,
  rumorContent: string,
  senderPrivKeyHex: string,
  senderPubKeyHex: string,
  recipientPubKeyHex: string,
): Promise<GiftWrapResult> {
  const now = Math.floor(Date.now() / 1000);

  // 1. Create UNSIGNED rumor (NIP-59: "a rumor is an unsigned event")
  const rumorUnsigned = {
    pubkey: senderPubKeyHex,
    created_at: now,  // Canonical time — the real one
    kind: rumorKind,
    tags: [] as string[][],
    content: rumorContent,
  };
  const rumorId = getEventHash(rumorUnsigned);
  const rumor: NostrEvent = {
    ...rumorUnsigned,
    id: rumorId,
    sig: '',  // Unsigned — no signature
  };

  // 2. Create seal (kind 13)
  // NIP-59: seal is NIP-44 encrypted rumor, signed by sender, empty tags
  const sealContent = nip44Encrypt(
    JSON.stringify(rumor),
    senderPrivKeyHex,
    recipientPubKeyHex,
  );

  const sealCreatedAt = randomPastTimestamp(now);
  const sealUnsigned = {
    pubkey: senderPubKeyHex,
    created_at: sealCreatedAt,
    kind: 13,
    tags: [] as string[][],  // NIP-59: tags MUST always be empty in kind 13
    content: sealContent,
  };
  const { id: sealId, sig: sealSig } = signEvent(sealUnsigned, senderPrivKeyHex);
  const seal: NostrEvent = {
    ...sealUnsigned,
    id: sealId,
    sig: sealSig,
  };

  // 3. Create ephemeral wrapper keypair (fresh random one-time key)
  const wrapperKeypair = generateKeypair();

  // 4. Create gift wrap (kind 1059)
  // NIP-59: wrap NIP-44 encrypts the seal using ephemeral→recipient key
  const wrapContent = nip44Encrypt(
    JSON.stringify(seal),
    wrapperKeypair.privateKey,
    recipientPubKeyHex,
  );

  const wrapCreatedAt = randomPastTimestamp(now);
  const wrapUnsigned = {
    pubkey: wrapperKeypair.publicKey,
    created_at: wrapCreatedAt,
    kind: 1059,
    tags: [['p', recipientPubKeyHex]],  // Route to recipient
    content: wrapContent,
  };
  const { id: wrapId, sig: wrapSig } = signEvent(wrapUnsigned, wrapperKeypair.privateKey);

  return {
    giftWrap: {
      ...wrapUnsigned,
      id: wrapId,
      sig: wrapSig,
    },
    wrapperKeypair,
  };
}

/**
 * Build a gift-wrapped response from service to user.
 * Same NIP-59 flow using the service's private key as sender.
 */
export async function buildServiceResponseGiftWrap(
  rumorKind: number,
  responseContent: string,
  servicePrivKeyHex: string,
  servicePubKeyHex: string,
  userPubKeyHex: string,
): Promise<GiftWrapResult> {
  return buildGiftWrap(rumorKind, responseContent, servicePrivKeyHex, servicePubKeyHex, userPubKeyHex);
}
