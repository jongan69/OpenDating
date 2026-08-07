/**
 * @opendating/protocol/crypto
 *
 * NIP-44 v2 + NIP-59 crypto submodule.
 */
export { generateKeypair, getConversationKey, nip44Encrypt, nip44Decrypt, getEventHash, signEvent, bytesToHex, hexToBytes, bytesToBase64, base64ToBytes, } from './encryption.js';
export { buildGiftWrap, buildServiceResponseGiftWrap } from './gift-wrap.js';
export type { GiftWrapResult, UnwrapResult } from './gift-wrap.js';
export { derivePublicKey, validateServiceKey, createServiceKeypair, } from './service-signer.js';
export type { ServiceKeypair } from './service-signer.js';
//# sourceMappingURL=index.d.ts.map