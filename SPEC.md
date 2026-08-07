# OpenDating Mobile App Integration Spec v0.1.0

> **For the mobile app developer.** You do NOT need to read the backend source code.
> Everything you need to integrate is documented here.

---

## 1. Backend Deployment

| Item | Value |
|------|-------|
| **Protocol** | `opendating` / `0.1` |
| **Relay URL** | `wss://relay.example.com` *(replace with deployed URL)* |
| **HTTP Info** | `https://relay.example.com` — `Accept: application/nostr+json` |
| **NPM Package** | `opendating-protocol@0.1.0` |
| **Repository** | `github.com/jongan69/OpenDating` |
| **Release Tag** | `opendating-v0.1.0` |

---

## 2. NPM Package

```bash
npm install opendating-protocol
```

```typescript
import {
  // Constants
  OPENDATING_PROTOCOL,
  OPENDATING_VERSION,
  SUPPORTED_VERSIONS,
  OD_ERROR_CODES,

  // Envelope
  createEnvelope,
  createErrorEnvelope,
  validateEnvelope,
  checkRequestFreshness,

  // Crypto (NIP-44 v2 + NIP-59)
  generateKeypair,
  nip44Encrypt,
  nip44Decrypt,
  buildGiftWrap,
  getEventHash,
  signEvent,
  bytesToHex,
  hexToBytes,

  // Service keys
  derivePublicKey,
  validateServiceKey,

  // Types
  type OpenDatingEnvelope,
  type GiftWrapResult,
} from 'opendating-protocol';

// Crypto subpath
import { getConversationKey } from 'opendating-protocol/crypto';
```

**What this package does NOT include**: Cloudflare, D1, Durable Objects, relay internals, server secrets. It's pure protocol + crypto.

---

## 3. Service Identities

Obtain service pubkeys from the relay's NIP-11 document:

```bash
curl -H "Accept: application/nostr+json" https://relay.example.com
```

Look for the `opendating` field:

```json
{
  "opendating": {
    "protocol_versions": ["0.1"],
    "roles": {
      "system":     { "pubkey": "<hex>" },
      "profile":    { "pubkey": "<hex>" },
      "discovery":  { "pubkey": "<hex>" },
      "matcher":    { "pubkey": "<hex>" },
      "dm_policy":  { "pubkey": "<hex>" },
      "moderation": { "pubkey": "<hex>" }
    },
    "features": {
      "match_only_dms": true,
      "private_profiles": true,
      "coarse_location": true,
      "private_reports": true,
      "vanish": true
    }
  }
}
```

Cache these pubkeys. They change only on redeployment.

---

## 4. Connection + Authentication

### Connect

```typescript
import { generateKeypair } from 'opendating-protocol';

// Generate or import user keypair
const user = generateKeypair();
// STORE user.privateKey SECURELY (OS keychain). Never send to relay.

const ws = new WebSocket('wss://relay.example.com');

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
  setTimeout(() => reject(new Error('timeout')), 5000);
});
```

### NIP-42 AUTH

```
1. Relay sends: ["AUTH", "<challenge-hex>"]
2. Client creates kind-22242 event:
   {
     kind: 22242,
     content: "",
     tags: [
       ["relay", "wss://relay.example.com"],
       ["challenge", "<challenge-hex>"]
     ],
     created_at: Math.floor(Date.now() / 1000),
     pubkey: user.publicKey
   }
3. Sign with user.privateKey
4. Send: ["AUTH", <signed-event>]
5. Relay responds: ["OK", <event-id>, true, ""]
```

The challenge is single-use, expires after 60 seconds, and is bound to the relay URL.

---

## 5. Request Lifecycle

Every private OpenDating operation follows this pattern:

```
1. Build envelope
2. NIP-59 gift-wrap it to the target service
3. Publish EVENT to relay
4. Relay returns OK (transport ack)
5. Subscribe to your own gift wraps to receive response
6. Decrypt response
```

### Send a Request

```typescript
import { createEnvelope, buildGiftWrap } from 'opendating-protocol';

async function sendRequest(
  type: string,
  payload: Record<string, unknown>,
  servicePubkey: string,
  userPrivKey: string,
  userPubKey: string,
  ws: WebSocket,
): Promise<string> {
  const envelope = createEnvelope(type, crypto.randomUUID(), payload);

  const { giftWrap } = await buildGiftWrap(
    78,                            // rumor kind
    JSON.stringify(envelope),
    userPrivKey,
    userPubKey,
    servicePubkey,
  );

  ws.send(JSON.stringify(['EVENT', giftWrap]));
  return envelope.request_id;
}
```

### Receive a Response

Subscribe to gift wraps addressed to you:

```json
["REQ", "od-responses", {"kinds": [1059], "#p": ["<your-pubkey>"], "since": <now>}]
```

When you receive `["EVENT", "od-responses", <gift-wrap>]`:

```typescript
import { nip44Decrypt } from 'opendating-protocol';

function decryptResponse(giftWrap: any, userPrivKey: string): any {
  // 1. Decrypt outer layer
  const sealJson = nip44Decrypt(giftWrap.content, userPrivKey, giftWrap.pubkey);
  const seal = JSON.parse(sealJson);  // kind 13

  // 2. Decrypt inner layer
  const rumorJson = nip44Decrypt(seal.content, userPrivKey, seal.pubkey);
  const rumor = JSON.parse(rumorJson);  // kind 78

  // 3. Parse envelope
  const envelope = JSON.parse(rumor.content);

  // 4. Verify request_id matches
  return envelope;
}
```

---

## 6. All Message Types

### System Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `system.ping` | → | `{}` | `system.pong` with `server_time`, `protocol_version` |
| `system.capabilities` | → | `{}` | `system.capabilities.result` with `versions`, `services`, `features` |

### Profile Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `profile.create` | → | `{}` | `profile.create.result` with `member_id`, `status` |
| `profile.update` | → | `{profile_event_id?}` | `profile.update.result` |
| `profile.get` | → | `{}` | `profile.get.result` with full profile |
| `profile.pause` | → | `{}` | `profile.pause.result` |
| `profile.resume` | → | `{}` | `profile.resume.result` |
| `profile.delete` | → | `{}` | `profile.delete.result` |
| `visibility.update` | → | `{visibility}` | `visibility.update.result` |

### Discovery Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `discovery.update_location` | → | `{geohash_prefix, country_code?}` | result |
| `discovery.get_candidates` | → | `{radius_miles, age_min, age_max, genders, relationship_intents, limit}` | `discovery.get_candidates.result` with `candidates[]` |
| `discovery.update_preferences` | → | `{max_distance_km, min_age, max_age, intent}` | result |

**CRITICAL**: Never send raw lat/lng. Compute geohash on-device with max precision 5 chars (~5km). Send only the prefix.

Candidate response:
```json
{
  "candidates": [{
    "pubkey": "<hex>",
    "profile": { /* candidate-visible profile fields */ },
    "distance_bucket": "5-10mi",
    "candidate_grant": "<opaque-token>"
  }],
  "cursor": "<pagination>",
  "remaining_today": 30
}
```

Distance is ALWAYS a coarse bucket: `nearby`, `within 5 mi`, `5-10 mi`, `10-25 mi`, `25-50 mi`, `50+ mi`.

### Matcher Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `intent.like` | → | `{target_pubkey, candidate_grant}` | `intent.like.result` with `match_created: bool` |
| `intent.revoke` | → | `{target_pubkey}` | `intent.revoke.result` |
| `match.list` | → | `{}` | `match.list.result` with `matches[]` |

Match notification is pushed as a gift wrap with type `match.created`.

### DM Policy Service (Blocking)

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `block.create` | → | `{target_pubkey}` | `block.create.result` |
| `block.remove` | → | `{target_pubkey}` | `block.remove.result` |
| `block.list` | → | `{}` | `block.list.result` |
| `unmatch.create` | → | `{target_pubkey}` | `unmatch.create.result` |

### Moderation Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `report.create` | → | `{subject_pubkey, report_type, description_encrypted?, evidence_event_ids?}` | `report.create.result` |

Valid `report_type` values: `harassment`, `scam`, `catfish`, `underage`, `inappropriate_content`, `other`.

### Deletion Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `account.delete` | → | `{}` | `account.delete.result` |

### Verification Service

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `verification.list` | → | `{}` | `verification.list.result` |

### Service-level

| Type | Dir | Payload | Response |
|------|-----|---------|----------|
| `service.ack` | ← | `{}` | Generic success |
| `service.error` | ← | `{code, message}` | Error response |

---

## 7. NIP-17 Messaging (Match-Only DMs)

Once matched, use standard NIP-17:

```typescript
import { nip44Encrypt, getEventHash, signEvent } from 'opendating-protocol';

async function sendDM(
  text: string,
  senderPriv: string,
  senderPub: string,
  recipientPub: string,
  ws: WebSocket,
) {
  const now = Math.floor(Date.now() / 1000);

  // Create rumor (kind 14 = NIP-17 text DM)
  const rumor = {
    pubkey: senderPub,
    created_at: now,
    kind: 14,
    tags: [['p', recipientPub]],
    content: nip44Encrypt(text, senderPriv, recipientPub),
  };

  // Wrap in gift wrap (kind 1059) signed by ephemeral key
  // Use buildGiftWrap from opendating-protocol
  const { giftWrap } = await buildGiftWrap(
    14,
    rumor.content,
    senderPriv,
    senderPub,
    recipientPub,
  );

  ws.send(JSON.stringify(['EVENT', giftWrap]));
}
```

**Relay enforcement**: The relay checks that sender has an active, unblocked match with recipient. Unmatched senders get `restricted: od:not-matched`.

---

## 8. Blocking Flow (Client-Side)

When user blocks someone:

```typescript
// 1. Immediate local block (UI hides everything)
localBlockList.add(targetPubkey);

// 2. Server enforcement (encrypted to dm_policy service)
await sendRequest('block.create', { target_pubkey }, dmPolicyPubkey, ...);

// 3. Portable private list (NIP-51)
// Store encrypted block list locally + sync to relay
```

Block is immediate and server-enforced. The blocked user:
- Cannot discover you
- Cannot like you
- Cannot DM you (gets `restricted: od:blocked`)
- Is NOT notified

---

## 9. Reporting with Evidence

To report a message:

```typescript
// Alice decrypts the abusive message locally
const decryptedRumor = nip44Decrypt(giftWrap.content, alicePriv, giftWrap.pubkey);

// Alice submits the seal + rumor as evidence
await sendRequest('report.create', {
  subject_pubkey: abuserPubkey,
  report_type: 'harassment',
  description_encrypted: nip44Encrypt('description...', alicePriv, moderationPubkey),
  evidence_event_ids: [giftWrap.id],
}, moderationPubkey, ...);
```

The moderation service can cryptographically verify the seal signature matches the sender's pubkey, proving authorship without browsing all DMs.

---

## 10. Error Codes

### Relay-level (Nostr OK message)

| Prefix | Meaning |
|--------|---------|
| `auth-required:` | Authenticate first |
| `restricted:` | Authorization denied |
| `rate-limited:` | Rate limit hit |
| `invalid:` | Invalid event/data |
| `blocked:` | Blocked by policy |

### OpenDating-specific

| Code | Meaning |
|------|---------|
| `restricted: od:not-matched` | No active match |
| `restricted: od:blocked` | Blocked by recipient |
| `restricted: od:membership-required` | Create profile first |
| `restricted: od:verification-required` | Verification needed |
| `invalid: od:profile-schema` | Invalid profile |
| `invalid: od:expired-request` | Request too old (5 min max) |
| `invalid: od:unsupported-version` | Protocol version mismatch |
| `rate-limited: od:discovery` | Daily discovery limit |
| `rate-limited: od:likes` | Daily like limit |

### Service-level (encrypted in response)

```json
{
  "type": "service.error",
  "payload": {
    "code": "unsupported_version",
    "message": "Unsupported protocol version: 99.0"
  }
}
```

---

## 11. Location Rules (MUST FOLLOW)

```typescript
// ❌ NEVER do this:
const payload = { lat: 27.9506, lng: -82.4572 };

// ✅ ALWAYS do this:
import geohash from 'some-geohash-lib';
const coarse = geohash.encode(lat, lng).substring(0, 5); // "dhvqx" — ~5km precision
const payload = { geohash_prefix: coarse, country_code: 'US' };
```

- **Geohash precision**: max 5 characters
- **Displayed distance**: always a bucket, never exact
- **Location history**: never stored by backend
- **Location update rate**: client should only update when location materially changes

---

## 12. Idempotency

Every request has a `request_id` (UUID). The backend prevents double-execution.
Always generate a fresh `request_id` per request using `crypto.randomUUID()`.

---

## 13. Session Management

- NIP-42 auth persists through WebSocket hibernation
- Reconnect requires re-authentication
- Subscribe to `kinds:[1059]` with `#p` = your pubkey to receive service responses
- Close subscriptions with `["CLOSE", "<sub-id>"]` when done

---

## 14. Privacy Checklist

Before shipping the mobile app, verify:

- [ ] nsec never leaves device
- [ ] Exact GPS never sent to backend (geohash only, max precision 5)
- [ ] DM plaintext never reaches backend (NIP-44 E2EE)
- [ ] Likes encrypted to matcher service only
- [ ] Blocks stored locally first, then synced via private list
- [ ] Reports encrypted to moderation service
- [ ] Profile media authorized via short-lived tokens (not public URLs)
- [ ] Sensitive fields inside encrypted content, not Nostr tags

---

## 15. Quick Start (Client Demo)

```typescript
import { generateKeypair, createEnvelope, buildGiftWrap, OPENDATING_VERSION } from 'opendating-protocol';

// 1. Identity
const user = generateKeypair();

// 2. Connect
const ws = new WebSocket('wss://relay.example.com');
await new Promise(r => ws.onopen = r);

// 3. AUTH (handle challenge, sign kind 22242, send AUTH)

// 4. Ping
const ping = createEnvelope('system.ping', crypto.randomUUID(), {});
const { giftWrap } = await buildGiftWrap(78, JSON.stringify(ping), user.privateKey, user.publicKey, systemPubkey);
ws.send(JSON.stringify(['EVENT', giftWrap]));

// 5. Create profile
const profile = createEnvelope('profile.create', crypto.randomUUID(), {});
// ... gift-wrap + send to profile service pubkey

// 6. Discover
const discovery = createEnvelope('discovery.get_candidates', crypto.randomUUID(), {
  radius_miles: 25,
  age_min: 24, age_max: 40,
  genders: ['woman'],
  relationship_intents: ['long_term'],
  limit: 20,
});
// ... gift-wrap + send to discovery service pubkey
```

Full demo: `examples/client-demo/demo.ts`

---

## 16. Reference Files in this Repository

| File | Purpose |
|------|---------|
| `docs/opendating/PROTOCOL.md` | Full protocol specification (implementation-independent) |
| `docs/opendating/CLIENT-INTEGRATION.md` | Detailed integration guide |
| `docs/opendating/SECURITY.md` | Security model |
| `docs/opendating/PRIVACY.md` | Privacy analysis |
| `docs/opendating/STORAGE-PRIVACY-AUDIT.md` | What data is stored and how |
| `docs/opendating/BACKEND-V0.1-RELEASE.md` | Release notes |
| `examples/client-demo/demo.ts` | Runnable client demo |
| `packages/protocol/` | npm package source |
| `schemas/opendating/0.1/` | JSON Schema files |
