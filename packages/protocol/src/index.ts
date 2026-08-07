/**
 * @opendating/protocol
 *
 * OpenDating protocol — types, constants, validators, crypto helpers.
 * Zero Cloudflare/Worker/D1/Durable Object dependencies.
 *
 * @version 0.1.0
 */
export {
  OPENDATING_PROTOCOL,
  OPENDATING_VERSION,
  SUPPORTED_VERSIONS,
  OD_KIND_RUMOR,
  OD_KIND_GIFT_WRAP,
  OD_FEATURES,
} from './protocol/constants.js';
export type { OpenDatingServiceRole, OpenDatingMessageType, OpenDatingFeature } from './protocol/constants.js';

export {
  isSupportedVersion,
  isOpenDatingProtocol,
  negotiateVersion,
  getServerVersion,
} from './protocol/version.js';

export {
  createEnvelope,
  createErrorEnvelope,
  validateEnvelope,
  checkRequestFreshness,
} from './protocol/envelope.js';
export type {
  OpenDatingEnvelope,
  OpenDatingRequest,
  OpenDatingResponse,
  OpenDatingErrorResponse,
  EnvelopeValidationResult,
} from './protocol/envelope.js';

export {
  MESSAGE_VALIDATORS,
  isKnownMessageType,
  getPayloadValidator,
} from './protocol/message-types.js';
export type {
  SystemPingPayload,
  SystemPongPayload,
  SystemCapabilitiesPayload,
  SystemCapabilitiesResultPayload,
  PayloadValidator,
} from './protocol/message-types.js';

export { OD_ERROR_CODES, OD_ERROR_MESSAGES } from './protocol/errors.js';
export type { ODErrorCode } from './protocol/errors.js';

export { buildCapabilities, buildNip11Advertisement } from './protocol/capabilities.js';

export { validateODRequest } from './protocol/validation.js';
export type { ODValidationResult } from './protocol/validation.js';

export {
  generateKeypair,
  getConversationKey,
  nip44Encrypt,
  nip44Decrypt,
  getEventHash,
  signEvent,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
} from './crypto/encryption.js';

export { buildGiftWrap, buildServiceResponseGiftWrap } from './crypto/gift-wrap.js';
export type { GiftWrapResult, UnwrapResult } from './crypto/gift-wrap.js';

export {
  derivePublicKey,
  validateServiceKey,
  createServiceKeypair,
} from './crypto/service-signer.js';
export type { ServiceKeypair } from './crypto/service-signer.js';
