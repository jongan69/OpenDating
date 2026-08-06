# OpenDating Protocol Specification

> **Version**: 0.1
> **Status**: EXPERIMENTAL
> **Protocol Identifier**: `opendating`

**This document contains NO Cloudflare, Worker, D1, or infrastructure-specific requirements.**

## 1. Protocol Identifier

The machine-readable protocol identifier is:

```
opendating
```

Do not use `open-dating`, `dating`, or `nostr-dating` interchangeably.

## 2. Version

Current version: `0.1`

- `0.x` = experimental, breaking changes expected
- `1.x` = stable interoperability commitment

Services advertise supported versions. Clients select the highest
mutually supported version.

## 3. Envelope

Every OpenDating application message uses this envelope:

```json
{
  "protocol": "opendating",
  "version": "0.1",
  "type": "system.ping",
  "request_id": "<cryptographically random>",
  "created_at": 1786050000,
  "payload": {}
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `protocol` | string | Must be `"opendating"` |
| `version` | string | Protocol version (e.g., `"0.1"`) |
| `type` | string | Dot-notation message type |
| `request_id` | string | Cryptographically random ID (min 8 chars) |
| `created_at` | integer | Unix timestamp in seconds |
| `payload` | object | Message-type-specific payload |

### Payload Size

Maximum decrypted payload: 16 KB.

Larger content (media, etc.) uses separate blob systems, not giant service messages.

## 4. Nostr Event Kinds

### Transport

| Kind | Purpose |
|------|---------|
| 1059 | NIP-59 Gift Wrap (outer transport) |
| 13 | NIP-59 Seal (encrypted inner wrapper) |
| 78 | Application Rumor (inner signed message) |

### Future

| Kind | Purpose |
|------|---------|
| 30078 | Application state (parameterized replaceable) — planned |

## 5. NIP-59 Transport

```
OpenDating Envelope (JSON)
    ↓ JSON stringify
Kind 78 Rumor (signed by sender)
    ↓ NIP-44 encrypt to recipient
Kind 13 Seal (signed by sender)
    ↓ NIP-44 encrypt to recipient with ephemeral key
Kind 1059 Gift Wrap (signed by ephemeral key)
    ↓ publish to Nostr relay
```

### Sender Identity

The verified sender is the pubkey that signed the Kind 13 Seal.

The authenticated NIP-42 connection pubkey MUST equal the verified sender pubkey
unless a future delegation standard is implemented.

### Sensitive Metadata

All OpenDating request metadata belongs INSIDE the encrypted content.
Only the outer recipient `p` tag is visible to the relay.

## 6. Service Identities

Services have secp256k1 Nostr keypairs. The public key is their identity.
The private key signs responses and decrypts incoming requests.

### Service Roles

| Role | Purpose | Status |
|------|---------|--------|
| `system` | Protocol-level operations | ✅ V0.1 |
| `profile` | User profiles | Planned |
| `discovery` | Candidate discovery | Planned |
| `matcher` | Like/match logic | Planned |
| `dm_policy` | Messaging policy | Planned |
| `moderation` | Reports and blocks | Planned |
| `verification` | Identity verification | Planned |
| `media` | Image/media handling | Planned |

## 7. Request Lifecycle

1. Client constructs OpenDating envelope
2. Client creates Kind 78 rumor, signs it
3. Client creates Kind 13 seal, encrypts rumor to service
4. Client creates Kind 1059 gift wrap with ephemeral key
5. Client publishes to relay via WebSocket (NIP-42 authenticated)
6. Relay validates and accepts the event
7. OpenDating extension decrypts, validates, routes
8. Service processes request
9. Service creates response envelope
10. Service gift-wraps response to user
11. Response published through relay

## 8. Response Lifecycle

Responses follow the same NIP-59 flow but from service to user:

- Service signs the rumor
- Service encrypts for the requesting user
- Response `request_id` correlates to original request

## 9. Error Semantics

All errors use the `system.error` message type:

```json
{
  "protocol": "opendating",
  "version": "0.1",
  "type": "system.error",
  "request_id": "<original request_id>",
  "created_at": 1786050001,
  "payload": {
    "code": "unsupported_version",
    "message": "Unsupported protocol version"
  }
}
```

### Standard Error Codes

| Code | Meaning |
|------|---------|
| `invalid_envelope` | Malformed envelope |
| `unsupported_version` | Protocol version not supported |
| `unsupported_type` | Message type not recognized |
| `expired_request` | created_at too old |
| `future_request` | created_at too far ahead |
| `duplicate_request` | request_id already processed |
| `sender_auth_mismatch` | NIP-42 auth ≠ NIP-59 sender |
| `unknown_service` | Recipient not a known service |
| `service_unavailable` | Service temporarily unavailable |
| `internal_error` | Unexpected processing error |
| `rate_limited` | Rate limit exceeded |
| `unauthorized` | Not authorized |

## 10. Idempotency

Request IDs provide idempotency. Same (service, sender, request_id) processed once.

Idempotency records expire after 24 hours.

## 11. Freshness

Requests must be:
- No more than 5 minutes old
- No more than 60 seconds in the future

## 12. Service Discovery

V0.1 uses NIP-11 relay info document:

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

The `system.capabilities` request provides runtime discovery.

Long-term: Nostr-native service manifests so different providers can
advertise services independently.
