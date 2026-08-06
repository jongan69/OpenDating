# OpenDating Reference Implementation Architecture

> **This document describes the REFERENCE IMPLEMENTATION on Nosflare/Cloudflare.**
> **It contains infrastructure-specific details. See PROTOCOL.md for the implementation-independent spec.**

## Integration with Nosflare

```
┌─────────────────────────────────────────┐
│          Generic Nostr Relay             │
│                                          │
│  AUTH / EVENT / REQ / WS / Storage       │
│                                          │
│  Extension Registry ←────────────────┐   │
│                                       │   │
└───────────────────────────────────────┼───┘
                                        │
                          extensionRegistry.register()
                                        │
┌───────────────────────────────────────┼───┐
│        OpenDating Extension           │   │
│                                       │   │
│   canHandleEvent() ──→ kind 1059 +    │   │
│                        service pubkey │   │
│                                       │   │
│   handleEvent() ──→ decrypt → validate│   │
│                     → route → respond │   │
└───────────────────────────────────────┘───┘
```

## Directory Structure

```
src/protocols/opendating/
├── index.ts                  Entry point, initialization
├── extension.ts              RelayExtension implementation
│
├── protocol/                 Protocol model (NO Cloudflare imports)
│   ├── constants.ts          Protocol ID, version, service roles
│   ├── version.ts            Version compatibility logic
│   ├── envelope.ts           Envelope construction/validation
│   ├── message-types.ts      Message type registry + validators
│   ├── errors.ts             Standard error codes
│   ├── capabilities.ts       Capability reporting
│   └── validation.ts         Runtime request validation
│
├── crypto/                   Cryptographic operations
│   ├── encryption.ts         NIP-44 encrypt/decrypt, key gen, signing
│   ├── gift-wrap.ts          NIP-59 gift wrap construction
│   └── service-signer.ts     Service keypair management
│
├── transport/                Request/response transport
│   ├── context.ts            OpenDating transport context
│   └── router.ts             Request routing + validation pipeline
│
├── services/                 Service implementations
│   ├── interface.ts          OpenDatingService interface
│   ├── registry.ts           Service registry
│   └── system/
│       └── service.ts        System service (ping, capabilities)
│
├── identities/               Service identity management
│   ├── types.ts              Identity types
│   ├── registry.ts           Identity registry
│   └── loader.ts             Secret-based identity loading
│
└── storage/                  Persistence
    ├── interfaces.ts         ODIdempotencyStore
    └── d1/
        └── idempotency.ts    D1 implementation
```

## Request Processing Pipeline

```
1. Client sends kind 1059 gift wrap via WebSocket
2. Generic relay validates Nostr event (sig, auth, policy)
3. Extension registry called: canHandleEvent()
4. OpenDating extension checks: kind=1059 AND recipient=service
5. Extension handleEvent() invoked:
   a. Decrypt gift wrap outer layer (NIP-44, service key)
   b. Parse Kind 13 seal
   c. Decrypt seal inner layer (NIP-44, service key)
   d. Parse Kind 78 rumor
   e. Verify sender = seal.pubkey
   f. Parse OpenDating envelope from rumor.content
   g. Build transport context (auth, sender, service, requestId)
   h. routeRequest():
      - Validate envelope
      - Check version
      - Check freshness
      - Check NIP-42 auth == NIP-59 sender
      - Resolve service by recipient pubkey
      - Check service supports message type
      - Check idempotency
      - Dispatch to service.handle()
   i. Build response gift wrap (service signs, encrypts to user)
   j. Publish response via processEvent()
6. Extension returns {handled: true, storeNormally: false}
```

## Configuration

### Service Keys

Service private keys are Cloudflare Worker secrets:

```bash
wrangler secret put OD_SYSTEM_SERVICE_PRIVKEY
```

Keys are loaded at worker startup via `loadServiceIdentitiesFromEnv()`.

### Database

OpenDating adds one table via migration `0005_opendating_core.sql`:

```sql
od_idempotency (
  service_pubkey, sender_pubkey, request_id,
  request_type, created_at, expires_at
)
```

### NIP-11

OpenDating advertises in the relay info document:

```json
{
  "opendating": {
    "versions": ["0.1"],
    "services": {
      "system": { "pubkey": "<hex>" }
    }
  }
}
```

## Cloudflare Free-Tier Profile

Each `system.ping` operation involves:
- 1 D1 idempotency lookup (reads from read replica)
- 1 D1 idempotency write (primary)
- 1 event publish (response gift wrap)
- Bounded crypto (NIP-44 decrypt + encrypt)
- No full-table scans, no service scans
