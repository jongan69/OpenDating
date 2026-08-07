# OpenDating Client Integration Guide v0.1

> For developers building an independent OpenDating client.
> You do NOT need to read the relay source code.

## 1. Connection

Connect to the relay via WebSocket:

```typescript
const relay = new WebSocket('wss://relay.example.com');
```

Wait for the connection to open before sending any messages.

## 2. Identity

OpenDating uses standard Nostr secp256k1 keypairs:

```typescript
import { generateKeypair } from '@opendating/protocol';

const user = generateKeypair();
// user.privateKey — 64-char hex. Store securely. Never send to the relay.
// user.publicKey — 64-char hex. Your identity.
```

## 3. Authentication (NIP-42)

Every OpenDating operation requires NIP-42 authentication:

1. Connect via WebSocket
2. Relay sends `["AUTH", "<challenge>"]`
3. Sign a kind 22242 event:

```json
{
  "kind": 22242,
  "content": "",
  "tags": [
    ["relay", "wss://relay.example.com"],
    ["challenge", "<challenge>"]
  ],
  "created_at": <now>
}
```

4. Send `["AUTH", <signed_event>]`
5. Relay responds `["OK", <event_id>, true, ""]`

All subsequent private operations require this authenticated connection.

## 4. Capabilities Discovery

### NIP-11

```bash
curl -H "Accept: application/nostr+json" https://relay.example.com
```

Look for the `opendating` field:

```json
{
  "opendating": {
    "protocol_versions": ["0.1"],
    "roles": {
      "system": { "pubkey": "<hex>" },
      "profile": { "pubkey": "<hex>" },
      "discovery": { "pubkey": "<hex>" },
      "matcher": { "pubkey": "<hex>" },
      "moderation": { "pubkey": "<hex>" }
    }
  }
}
```

### Runtime

Send `system.capabilities` to the system service pubkey for runtime discovery.

## 5. Request Lifecycle

Every OpenDating request follows this pattern:

```
1. Build OpenDating envelope
2. JSON.stringify(envelope)
3. Create kind-78 rumor (unsigned)
4. NIP-44 encrypt rumor → seal (kind 13, signed by sender)
5. NIP-44 encrypt seal → gift wrap (kind 1059, signed by ephemeral key, p-tag = service pubkey)
6. Publish: ["EVENT", <gift_wrap>]
7. Relay returns: ["OK", <event_id>, true, ""]
8. Relays routes to OpenDating extension
9. Service processes and responds (gift wrap back to your pubkey)
10. Subscribe to your own gift wraps to receive the response
```

### Building a Request

```typescript
import { createEnvelope, buildGiftWrap, OPENDATING_PROTOCOL } from '@opendating/protocol';

const envelope = createEnvelope('system.ping', crypto.randomUUID(), {});
const { giftWrap } = await buildGiftWrap(
  78,                            // rumor kind
  JSON.stringify(envelope),      // rumor content
  userPrivateKey,                // sender private key
  userPublicKey,                 // sender public key
  systemServicePubkey,           // recipient (service)
);

ws.send(JSON.stringify(['EVENT', giftWrap]));
```

### Receiving a Response

Subscribe to your own gift wraps:

```json
["REQ", "my-responses", {"kinds": [1059], "#p": ["<your-pubkey>"], "since": <now>}]
```

When you receive a gift wrap:
1. Decrypt outer layer: `nip44Decrypt(giftWrap.content, yourPrivKey, giftWrap.pubkey)`
2. Parse the seal (kind 13)
3. Decrypt seal: `nip44Decrypt(seal.content, yourPrivKey, seal.pubkey)`
4. Parse the rumor (kind 78)
5. Parse the OpenDating envelope from `rumor.content`
6. Verify `envelope.request_id` matches your original request

## 6. Membership & Profile

### Create Profile

```typescript
const env = createEnvelope('profile.create', crypto.randomUUID(), {});
// Encrypt and send to profile service pubkey
```

### Update Profile

```typescript
const env = createEnvelope('profile.update', crypto.randomUUID(), {
  profile_event_id: '<kind-30078-event-id>',
});
```

### Pause Profile

```typescript
const env = createEnvelope('profile.pause', crypto.randomUUID(), {});
```

### Resume Profile

```typescript
const env = createEnvelope('profile.resume', crypto.randomUUID(), {});
```

### Delete Profile

```typescript
const env = createEnvelope('profile.delete', crypto.randomUUID(), {});
```

## 7. Discovery

### Update Location (coarse only)

The client should:
1. Get GPS (device-local)
2. Compute geohash with precision ≤ 5
3. Send only the geohash prefix

```typescript
const env = createEnvelope('discovery.update_location', crypto.randomUUID(), {
  geohash_prefix: 'dhvqx',  // 5-char geohash (~5km precision)
  country_code: 'US',
});
```

**Never send raw latitude/longitude.**

### Get Candidates

```typescript
const env = createEnvelope('discovery.get_candidates', crypto.randomUUID(), {
  radius_miles: 25,
  age_min: 24,
  age_max: 40,
  genders: ['woman'],
  relationship_intents: ['long_term'],
  limit: 20,
});
```

### Response

```json
{
  "type": "discovery.get_candidates.result",
  "payload": {
    "candidates": [
      {
        "pubkey": "<hex>",
        "profile": { /* candidate-visible profile */ },
        "distance_bucket": "5-10mi",
        "candidate_grant": "<opaque-token>"
      }
    ],
    "cursor": "<pagination>",
    "remaining_today": 30
  }
}
```

Distance is returned as coarse buckets: `nearby`, `within 5 mi`, `5-10 mi`, `10-25 mi`, `25-50 mi`, `50+ mi`. Never exact.

## 8. Likes

### Like Someone

```typescript
const env = createEnvelope('intent.like', crypto.randomUUID(), {
  target_pubkey: '<their-pubkey>',
  candidate_grant: '<from-discovery>',
});
// Send to matcher service pubkey
```

The like is encrypted. The target learns nothing.

### Revoke a Like

```typescript
const env = createEnvelope('intent.revoke', crypto.randomUUID(), {
  target_pubkey: '<their-pubkey>',
});
```

## 9. Matches

When both parties like each other, the matcher sends `match.created` notifications
to each party via NIP-59 gift wraps.

```typescript
const env = createEnvelope('match.list', crypto.randomUUID(), {});
// Response contains match_id, other_member, state, created_at
```

Match IDs are deterministic from the two pubkeys.

## 10. Messaging (NIP-17)

Use standard NIP-17:

```typescript
// Alice sends to Bob
const rumor = {
  pubkey: alicePubkey,
  created_at: now,
  kind: 14,  // NIP-17 text DM
  tags: [['p', bobPubkey]],
  content: nip44Encrypt('Hello!', alicePrivKey, bobPubkey),
};
```

The relay enforces match-only messaging: the sender must have an active, unblocked match
with the recipient. Unmatched senders receive `restricted: od:not-matched`.

## 11. Blocking

```typescript
// Block
const env = createEnvelope('block.create', crypto.randomUUID(), {
  target_pubkey: '<their-pubkey>',
});

// List blocks
const env = createEnvelope('block.list', crypto.randomUUID(), {});

// Remove block
const env = createEnvelope('block.remove', crypto.randomUUID(), {
  target_pubkey: '<their-pubkey>',
});
```

Blocking is immediate and server-enforced:
- Target removed from discovery
- Active match terminated
- Pending likes revoked
- Future DMs denied
- Target not notified

## 12. Unmatching

```typescript
const env = createEnvelope('unmatch.create', crypto.randomUUID(), {
  target_pubkey: '<their-pubkey>',
});
```

## 13. Reporting

```typescript
const env = createEnvelope('report.create', crypto.randomUUID(), {
  subject_pubkey: '<their-pubkey>',
  report_type: 'harassment',  // harassment|scam|catfish|underage|inappropriate_content|other
  description_encrypted: '<NIP-44 encrypted description>',
  evidence_event_ids: ['<event-id-1>', '<event-id-2>'],
});
```

For NIP-17 message evidence: include the seal event (kind 13) and rumor event (kind 78).
The moderation service can cryptographically verify the sender's signature.

## 14. Verification

```typescript
const env = createEnvelope('verification.list', crypto.randomUUID(), {});
// Response contains active verification claims with issuers and expiration
```

## 15. Account Deletion

```typescript
const env = createEnvelope('account.delete', crypto.randomUUID(), {});
```

This triggers full cleanup: profile, discovery, intents, matches, blocks, media.

For NIP-62 vanish: the relay also prevents reingestion of deleted events.

## 16. Error Codes

| Prefix | Meaning |
|--------|---------|
| `auth-required:` | Authenticate first |
| `restricted: od:not-matched` | No active match |
| `restricted: od:blocked` | Blocked by recipient |
| `restricted: od:membership-required` | Create profile first |
| `restricted: od:verification-required` | Verification needed |
| `invalid: od:profile-schema` | Invalid profile data |
| `invalid: od:expired-request` | Request too old |
| `invalid: od:unsupported-version` | Protocol version mismatch |
| `rate-limited: od:discovery` | Discovery quota exceeded |
| `rate-limited: od:likes` | Like quota exceeded |

## 17. Protocol Package

Install the protocol package:

```bash
npm install @opendating/protocol
```

This provides all constants, types, validators, and helpers without any
Cloudflare or relay implementation dependencies.
