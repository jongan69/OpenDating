/**
 * NIP-44 v2 Encryption — Official Specification Compliance
 *
 * Implements the exact NIP-44 v2 construction:
 *   - secp256k1 ECDH (unhashed shared_x)
 *   - HKDF-extract (SHA-256, salt="nip44-v2") → conversation_key
 *   - HKDF-expand (SHA-256, info=nonce, L=76) → chacha_key | chacha_nonce | hmac_key
 *   - NIP-44 padding (powers-of-two, min 32 bytes)
 *   - ChaCha20 encryption (counter 0)
 *   - HMAC-SHA256 MAC over (nonce || ciphertext)
 *   - Base64 format: [version:0x02][nonce:32][ciphertext][mac:32]
 *
 * Uses @noble libraries + Web Crypto for key generation only.
 * Do not invent encryption. Do not use AES-GCM for NIP-44.
 */
import { schnorr } from '@noble/curves/secp256k1';
import { extract, expand } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { chacha20 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const NIP44_VERSION = 0x02;
const NIP44_SALT = new TextEncoder().encode('nip44-v2');
const CONVERSATION_KEY_LEN = 32;
const NONCE_LEN = 32;
const MAC_LEN = 32;
const CHACHA_KEY_LEN = 32;
const CHACHA_NONCE_LEN = 12;
const HMAC_KEY_LEN = 32;
const MESSAGE_KEYS_LEN = 76; // chacha_key(32) + chacha_nonce(12) + hmac_key(32)
const MIN_PLAINTEXT_LEN = 1;
const MIN_PADDED_LEN = 32;
// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------
export function generateKeypair() {
    const priv = randomBytes(32);
    const pub = schnorr.getPublicKey(priv);
    return {
        privateKey: bytesToHex(priv),
        publicKey: bytesToHex(pub),
    };
}
// ---------------------------------------------------------------------------
// Conversation key (NIP-44 v2 §1)
// ---------------------------------------------------------------------------
/**
 * Compute the NIP-44 v2 conversation key.
 *   shared_x = secp256k1 ECDH (unhashed x-coordinate)
 *   conversation_key = HKDF-extract(SHA-256, IKM=shared_x, salt="nip44-v2")
 */
export function getConversationKey(privateKeyHex, publicKeyHex) {
    const priv = hexToBytes(privateKeyHex);
    const pub = hexToBytes(publicKeyHex);
    // Convert schnorr x-only public key to full curve point using lift_x (BIP340)
    const pubKeyBigInt = bytesToBigInt(pub);
    const pubPoint = schnorr.utils.lift_x(pubKeyBigInt);
    // ECDH: private key bytes as scalar × public point → shared point
    const privScalar = bytesToBigInt(priv);
    const sharedPoint = pubPoint.multiply(privScalar);
    // Extract unhashed x-coordinate (32 bytes)
    const sharedX = sharedPoint.toRawBytes(true).slice(1, 33);
    // HKDF-extract
    return extract(sha256, sharedX, NIP44_SALT);
}
/** Convert Uint8Array to bigint (big-endian) */
function bytesToBigInt(bytes) {
    let hex = '0x';
    for (const b of bytes) {
        hex += b.toString(16).padStart(2, '0');
    }
    return BigInt(hex);
}
/**
 * Derive message keys from conversation_key and nonce.
 *   hkdf_expand(SHA-256, PRK=conversation_key, info=nonce, L=76)
 *   → chacha_key(0..32) | chacha_nonce(32..44) | hmac_key(44..76)
 */
function getMessageKeys(conversationKey, nonce) {
    const expanded = expand(sha256, conversationKey, nonce, MESSAGE_KEYS_LEN);
    return {
        chachaKey: expanded.slice(0, CHACHA_KEY_LEN),
        chachaNonce: expanded.slice(CHACHA_KEY_LEN, CHACHA_KEY_LEN + CHACHA_NONCE_LEN),
        hmacKey: expanded.slice(CHACHA_KEY_LEN + CHACHA_NONCE_LEN),
    };
}
// ---------------------------------------------------------------------------
// Padding (NIP-44 v2 §2)
// ---------------------------------------------------------------------------
/**
 * Calculate the padded length per NIP-44 v2 padding algorithm.
 * Powers-of-two with minimum 32 bytes.
 */
export function calcPaddedLen(unpaddedLen) {
    if (unpaddedLen < MIN_PLAINTEXT_LEN) {
        throw new Error('Plaintext must be at least 1 byte');
    }
    if (unpaddedLen <= MIN_PADDED_LEN) {
        return MIN_PADDED_LEN;
    }
    const nextPower = 1 << (Math.floor(Math.log2(unpaddedLen - 1)) + 1);
    const chunk = nextPower <= 256 ? MIN_PADDED_LEN : nextPower / 8;
    return chunk * (Math.floor((unpaddedLen - 1) / chunk) + 1);
}
/**
 * Pad plaintext per NIP-44 v2.
 * Short format (< 65536): [u16 length BE][plaintext][zero_bytes]
 * Long format (>= 65536): [0x00, 0x00][u32 length BE][plaintext][zero_bytes]
 */
function pad(plaintext) {
    const unpaddedLen = plaintext.length;
    const paddedLen = calcPaddedLen(unpaddedLen);
    const result = new Uint8Array(paddedLen);
    if (unpaddedLen < 65536) {
        // Short format: 2-byte big-endian length prefix
        result[0] = (unpaddedLen >> 8) & 0xff;
        result[1] = unpaddedLen & 0xff;
        result.set(plaintext, 2);
        // Zero-fill rest (already zero from new Uint8Array)
    }
    else {
        // Long format: 2 zero bytes + 4-byte big-endian length prefix
        result[0] = 0;
        result[1] = 0;
        result[2] = (unpaddedLen >> 24) & 0xff;
        result[3] = (unpaddedLen >> 16) & 0xff;
        result[4] = (unpaddedLen >> 8) & 0xff;
        result[5] = unpaddedLen & 0xff;
        result.set(plaintext, 6);
    }
    return result;
}
/**
 * Unpad plaintext per NIP-44 v2.
 */
function unpad(padded) {
    if (padded.length < 2) {
        throw new Error('Padded data too short');
    }
    let unpaddedLen;
    let offset;
    if (padded[0] === 0 && padded[1] === 0) {
        // Long format: 6-byte prefix
        if (padded.length < 6) {
            throw new Error('Padded data too short for long format');
        }
        unpaddedLen = (padded[2] << 24) | (padded[3] << 16) | (padded[4] << 8) | padded[5];
        offset = 6;
    }
    else {
        // Short format: 2-byte prefix
        unpaddedLen = (padded[0] << 8) | padded[1];
        offset = 2;
    }
    if (unpaddedLen < MIN_PLAINTEXT_LEN || unpaddedLen > padded.length - offset) {
        throw new Error('Invalid padding length');
    }
    return padded.slice(offset, offset + unpaddedLen);
}
// ---------------------------------------------------------------------------
// Encrypt / Decrypt (NIP-44 v2 §2, §4)
// ---------------------------------------------------------------------------
/**
 * NIP-44 v2 encrypt a plaintext string.
 *
 * @returns Base64-encoded payload string
 */
export function nip44Encrypt(plaintext, privateKeyHex, publicKeyHex) {
    const conversationKey = getConversationKey(privateKeyHex, publicKeyHex);
    const nonce = randomBytes(NONCE_LEN);
    const keys = getMessageKeys(conversationKey, nonce);
    // Pad and encrypt
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const padded = pad(plaintextBytes);
    const ciphertext = chacha20(keys.chachaKey, keys.chachaNonce, padded);
    // HMAC-SHA256 over (nonce || ciphertext)
    const aad = new Uint8Array(nonce.length + ciphertext.length);
    aad.set(nonce);
    aad.set(ciphertext, nonce.length);
    const mac = hmac(sha256, keys.hmacKey, aad);
    // Format: [version][nonce][ciphertext][mac]
    const payload = new Uint8Array(1 + NONCE_LEN + ciphertext.length + MAC_LEN);
    payload[0] = NIP44_VERSION;
    payload.set(nonce, 1);
    payload.set(ciphertext, 1 + NONCE_LEN);
    payload.set(mac, 1 + NONCE_LEN + ciphertext.length);
    return bytesToBase64(payload);
}
/**
 * NIP-44 v2 decrypt a payload string.
 *
 * @param payload - Base64-encoded NIP-44 v2 payload
 * @returns Decrypted plaintext string
 */
export function nip44Decrypt(payload, privateKeyHex, publicKeyHex) {
    // Quick size check before base64 decode
    if (!payload || payload.length < 128) {
        throw new Error('nip44: payload too short');
    }
    if (payload[0] === '#') {
        throw new Error('nip44: unknown encoding version');
    }
    const data = base64ToBytes(payload);
    if (data.length < 97) {
        throw new Error('nip44: decoded data too short');
    }
    // Parse format
    const version = data[0];
    if (version !== NIP44_VERSION) {
        throw new Error(`nip44: unknown version ${version}`);
    }
    const nonce = data.slice(1, 1 + NONCE_LEN);
    const ciphertext = data.slice(1 + NONCE_LEN, data.length - MAC_LEN);
    const mac = data.slice(data.length - MAC_LEN);
    // Recompute keys
    const conversationKey = getConversationKey(privateKeyHex, publicKeyHex);
    const keys = getMessageKeys(conversationKey, nonce);
    // Verify MAC (constant-time via noble)
    const aad = new Uint8Array(nonce.length + ciphertext.length);
    aad.set(nonce);
    aad.set(ciphertext, nonce.length);
    const expectedMac = hmac(sha256, keys.hmacKey, aad);
    if (!constantTimeEqual(mac, expectedMac)) {
        throw new Error('nip44: MAC verification failed');
    }
    // Decrypt
    const padded = chacha20(keys.chachaKey, keys.chachaNonce, ciphertext);
    // Unpad
    const plaintext = unpad(padded);
    return new TextDecoder().decode(plaintext);
}
// ---------------------------------------------------------------------------
// Nostr event ID (for unsigned rumors)
// ---------------------------------------------------------------------------
/**
 * Compute a Nostr event ID per NIP-01.
 * sha256(JSON.stringify([0, pubkey, created_at, kind, tags, content]))
 */
export function getEventHash(event) {
    const serialized = JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]);
    return bytesToHex(sha256(new TextEncoder().encode(serialized)));
}
// ---------------------------------------------------------------------------
// Nostr event signing (schnorr)
// ---------------------------------------------------------------------------
/**
 * Sign a Nostr event with a private key.
 * Returns id and sig.
 */
export function signEvent(event, privateKeyHex) {
    const id = getEventHash(event);
    const sig = bytesToHex(schnorr.sign(hexToBytes(id), privateKeyHex));
    return { id, sig };
}
// ---------------------------------------------------------------------------
// Timing-safe comparison
// ---------------------------------------------------------------------------
function constantTimeEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
    }
    return diff === 0;
}
// ---------------------------------------------------------------------------
// Encoding utilities
// ---------------------------------------------------------------------------
export function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
export function hexToBytes(hex) {
    if (hex.length % 2 !== 0)
        throw new Error('Invalid hex string');
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
export function bytesToBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}
export function base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}
//# sourceMappingURL=encryption.js.map