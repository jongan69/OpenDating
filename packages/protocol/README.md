# @opendating/protocol

OpenDating protocol — types, constants, validators, crypto helpers.

**Zero Cloudflare/Worker/D1/Durable Object dependencies.**

## Install

```bash
npm install @opendating/protocol
```

## Usage

```typescript
import {
  OPENDATING_PROTOCOL,
  OPENDATING_VERSION,
  createEnvelope,
  buildGiftWrap,
  generateKeypair,
  nip44Encrypt,
  nip44Decrypt,
  OD_ERROR_CODES,
} from '@opendating/protocol';

// Generate a user keypair
const user = generateKeypair();

// Build a system.ping request
const envelope = createEnvelope('system.ping', crypto.randomUUID(), {});

// Wrap it for a service
const { giftWrap } = await buildGiftWrap(
  78,
  JSON.stringify(envelope),
  user.privateKey,
  user.publicKey,
  servicePubkey,
);

// Publish to relay
ws.send(JSON.stringify(['EVENT', giftWrap]));
```

## Crypto submodule

```typescript
import {
  getConversationKey,
  nip44Encrypt,
  nip44Decrypt,
  signEvent,
} from '@opendating/protocol/crypto';
```

## Contents

- `constants.ts` — Protocol ID, version, service roles, features
- `version.ts` — Version compatibility + negotiation
- `envelope.ts` — Envelope construction, validation, freshness
- `message-types.ts` — Message type registry with payload validators
- `errors.ts` — Standard error codes + messages
- `capabilities.ts` — Capability reporting + NIP-11 advertisement
- `validation.ts` — Runtime request validation
- `crypto/encryption.ts` — NIP-44 v2 (ChaCha20 + HMAC-SHA256, verified against official vectors)
- `crypto/gift-wrap.ts` — NIP-59 gift wrap construction (unsigned rumors, randomized timestamps)
- `crypto/service-signer.ts` — Keypair management + validation

## NOT included

- Cloudflare Workers / D1 / Durable Objects / R2
- Relay implementation
- Backend service logic
- Moderation infrastructure
- Server secrets

## License

MIT
