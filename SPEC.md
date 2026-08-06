# OpenDating Protocol + Reference Relay
## Product Requirements Document
### Version 0.1 — Experimental

**Status:** Draft / implementation specification  
**Reference implementation:** Nosflare fork, TypeScript, Cloudflare Workers, Durable Objects, D1, R2  
**Protocol working name:** OpenDating  
**Target:** Open-source dating protocol built on Nostr  
**Initial deployment model:** One Cloudflare deployment providing multiple logically independent OpenDating service roles  
**Long-term deployment model:** Multiple interchangeable relays, discovery providers, matchmakers, verification providers, moderation providers, and clients implementing the same protocol

---

# 1. Executive Summary

OpenDating is an open dating protocol built on top of Nostr.

The objective is **not** to create “Tinder running on a Nostr relay.”

The objective is to define an interoperable dating layer in which:

- users own their identity;
- clients are replaceable;
- relay operators are replaceable;
- matching providers are replaceable;
- discovery algorithms are replaceable;
- verification providers are replaceable;
- moderation providers can be trusted selectively;
- private dating activity is not broadcast publicly;
- basic dating and safety functionality does not depend on payment;
- another developer can build a completely different dating client without permission;
- another operator can deploy an independent compatible backend without copying implementation-specific Cloudflare architecture.

The initial project will convert Nosflare into the **reference OpenDating relay/backend**, while deliberately keeping the OpenDating protocol independent from Nosflare and Cloudflare.

Nosflare already supplies a strong Cloudflare-native foundation: a TypeScript Nostr relay, D1 persistence, multi-region Durable Objects for WebSockets, WebSocket Hibernation, NIP-42 authentication, rate limiting and existing Nostr event processing. 

The resulting system should feel operationally like a modern centralized dating app while preserving the ability for the ecosystem itself to decentralize.

The north star is:

> **A dating network no single company owns, without sacrificing the privacy and safety controls that dating requires.**

---

# 2. Fundamental Architecture Decision

A Nostr event being signed **MUST NOT imply that the event is public**.

Traditional Nostr applications frequently use relays as openly queryable event stores. Dating cannot safely use that model for all data.

OpenDating therefore distinguishes between:

1. public Nostr information;
2. candidate-visible dating information;
3. service-private dating information;
4. peer-to-peer private information;
5. highly restricted moderation information.

The generic Nostr relay is the transport layer.

OpenDating services consume and produce Nostr events over that transport.

Initially those services run inside one Cloudflare deployment:

```text
┌─────────────────────────────────────────────┐
│              Mobile Client                  │
│                                             │
│  identity · onboarding · discovery · chat   │
└─────────────────────┬───────────────────────┘
                      │
                      │ Nostr WebSocket
                      │ NIP-42 / EVENT / REQ
                      ▼
┌─────────────────────────────────────────────┐
│           OpenDating Reference Relay        │
│                                             │
│            Generic Nostr Layer              │
│                    │                        │
│       ┌────────────┴─────────────┐          │
│       │ OpenDating Event Router │          │
│       └────────────┬─────────────┘          │
│                    │                        │
│   ┌────────────────┼─────────────────────┐  │
│   │                │                     │  │
│   ▼                ▼                     ▼  │
│ Profile        Discovery              Matcher│
│ Service        Service                Service│
│                                             │
│   ▼                ▼                     ▼  │
│ Safety         Verification             Media│
│ Service        Service                  Service│
│                                             │
│                D1 + R2                      │
└─────────────────────────────────────────────┘
```

Later, without changing the wire protocol:

```text
                      Nostr
                        │
       ┌────────────────┼─────────────────┐
       │                │                 │
       ▼                ▼                 ▼
 Generic Relay    Discovery Relay    DM Relay
       ▲                ▲                 ▲
       │                │                 │
       └──────────┬─────┴─────┬───────────┘
                  │           │
                  ▼           ▼
              Matcher A    Matcher B
                  │
          ┌───────┼─────────┐
          ▼       ▼         ▼
      Verifier  Safety   Other Clients
```

**The logical architecture MUST support the second diagram even while V0.1 physically deploys the first.**

---

# 3. Product Goals

## 3.1 Protocol goals

OpenDating MUST:

- use ordinary Nostr transport wherever practical;
- reuse existing NIPs instead of replacing them;
- avoid custom WebSocket message types unless absolutely unavoidable;
- keep Cloudflare implementation details outside the protocol;
- support multiple independent implementations;
- permit users to use multiple providers simultaneously;
- permit clients to change providers;
- explicitly version every OpenDating schema;
- provide conformance tests;
- document privacy and security semantics, not merely JSON schemas;
- eventually be implementable from the specification without reading the reference source code.

## 3.2 User goals

A user must be able to:

- create or import a Nostr identity;
- create a dating profile;
- configure who they want to discover;
- control who can discover them;
- discover geographically relevant candidates;
- like or pass on candidates privately;
- mutually match;
- exchange encrypted messages;
- unmatch;
- block;
- report;
- pause discovery;
- delete their OpenDating profile;
- request deletion from supporting relays;
- move to another compatible client without creating an entirely new identity.

## 3.3 Safety goals

The reference implementation MUST be designed around a hostile dating threat model.

Safety defaults should specifically account for forms of harassment, stalking, unsolicited sexual content and coercive behavior that disproportionately affect women and other higher-risk users, while making the protections available to every user.

Safety functionality MUST NOT be paywalled.

At minimum:

- no unsolicited DMs;
- no public likes;
- no public block graph;
- no public reports;
- no exact location exposure;
- no arbitrary profile enumeration;
- immediate blocking;
- immediate unmatching;
- report-after-unmatch;
- moderator tooling;
- anti-spam and anti-Sybil controls;
- configurable verification requirements;
- account-level moderation restrictions;
- encrypted evidence handling;
- moderator audit logs.

Modern dating products increasingly expose verification, message-safety prompts, explicit-image protection, date sharing, blocking, reporting and unmatching as core safety tools. These should define the competitive safety benchmark even where some are post-MVP.

---

# 4. Non-Goals for V0.1

V0.1 will NOT attempt to provide:

- fully trustless matchmaking;
- private-set-intersection cryptography;
- zero-knowledge age verification;
- DAO moderation;
- cryptocurrency monetization;
- premium boosts;
- pay-to-message;
- voice or video calling;
- AI romantic compatibility;
- global reputation scores;
- biometric verification operated directly by the reference relay;
- government ID document storage;
- public dating profiles on arbitrary Nostr relays;
- exact real-time location;
- decentralized legal enforcement;
- guaranteed deletion from every Nostr relay or recipient device;
- prevention of screenshots or manual copying;
- a universal moderation policy every Nostr relay must follow.

Those can be considered later without compromising the V0.1 architecture.

---

# 5. Normative Language

The specification SHALL use:

- **MUST / MUST NOT** for interoperability, privacy or security requirements;
- **SHOULD / SHOULD NOT** when implementations may differ but a strong default exists;
- **MAY** for optional behavior.

Implementation-specific decisions should be labeled **REFERENCE IMPLEMENTATION**.

This distinction should be maintained from the first commit so the eventual protocol specification can be extracted cleanly.

---

# 6. Existing Nostr Standards to Reuse

OpenDating SHOULD build on existing standards rather than invent equivalent mechanisms.

## Required foundation

### NIP-01
Basic Nostr events, signatures, `EVENT`, `REQ`, `CLOSE` and relay behavior.

### NIP-11
Relay information document.

NIP-11 explicitly allows clients to ignore extra fields they do not understand, which provides a clean place for the reference relay to advertise OpenDating capabilities during V0.x.

### NIP-42
Relay authentication.

All private OpenDating operations MUST require NIP-42 authentication. NIP-42 specifically exists so relays can authenticate users before granting access to restricted resources.

### NIP-44
Encryption primitives.

Do not invent custom encryption.

### NIP-59
Gift wrapping.

NIP-59 can encapsulate any Nostr event while obscuring the real sender and most metadata from public observers. This makes it the preferred transport for OpenDating service requests such as profile updates, discovery requests, likes and reports.

### NIP-17
Private DMs.

NIP-17 already defines NIP-44/NIP-59 encrypted direct messaging. Relays are specifically encouraged to use NIP-42 and return gift wraps only to the authenticated `p`-tagged recipient.

### NIP-51
Private lists.

NIP-51 permits list items to be stored privately using NIP-44. OpenDating SHOULD use this where appropriate for portable private user lists such as mutes/blocks rather than inventing a public block graph.

### NIP-56
Reports.

OpenDating reports SHOULD preserve NIP-56 semantics where possible.

Importantly, NIP-56 explicitly warns relays against automatically moderating users solely from raw report counts because those reports can be gamed. OpenDating MUST honor that constraint.

### NIP-62
Request to Vanish.

Supporting relays SHOULD implement full OpenDating cleanup when receiving a valid NIP-62 request. NIP-62 instructs supporting relays to delete the user's events and gift wraps addressed to that user and prevent re-ingestion of deleted events.

## Experimental development

### NIP-78

Before permanent OpenDating event kinds exist, V0.x SHOULD use NIP-78's `kind:30078` and `kind:78` namespaces for experimental application-specific structures.

NIP-78 intentionally provides application-specific data kinds. It is appropriate for prototyping but explicitly does not itself establish interoperability, so permanent OpenDating kinds should only be proposed after schemas stabilize.

## Optional future integrations

- NIP-85 — trust calculations/assertions;
- NIP-98 — Nostr-authenticated HTTP requests for private media;
- NIP-B7/Blossom — public or encrypted content-addressed media;
- NIP-13 — optional proof-of-work anti-spam;
- NIP-46 / NIP-55 — external signers;
- NIP-49 — encrypted Nostr key backup.

### Explicit warning about NIP-70

NIP-70 **does not make an event private**.

The `["-"]` tag controls who is allowed to publish an event to a relay; it does not create read authorization. OpenDating MUST NOT use NIP-70 as a substitute for private storage or NIP-42 access control.

---

# 7. OpenDating Privacy Model

Every piece of information MUST belong to a privacy class.

| Class | Name | Example | Visibility |
|---|---|---|---|
| P0 | Public | relay capabilities, optional generic Nostr identity | anyone |
| P1 | Candidate Restricted | dating profile, profile photos, coarse distance, badges | authorized candidates only |
| P2 | Service Private | location cell, discovery preferences, likes, pending matches, blocks | selected OpenDating service |
| P3 | Peer Private | NIP-17 messages and encrypted attachments | conversation participants |
| P4 | Safety Restricted | reports, evidence, moderator notes | authorized safety personnel/services only |

No developer should add a new field without assigning it one of these classes.

---

# 8. Data That MUST NEVER Be Publicly Published by OpenDating

The reference implementation MUST NOT publicly publish:

- exact coordinates;
- GPS history;
- street address;
- workplace location;
- home location;
- raw date of birth;
- government ID;
- verification selfie;
- biometric template;
- phone contacts;
- phone number unless explicitly user-shared;
- email unless explicitly user-shared;
- likes;
- passes;
- rejection history;
- block graph;
- report history;
- moderation evidence;
- safety notes;
- match history;
- exact last-active timestamps;
- discovery preferences;
- sexual-orientation preferences unless explicitly chosen for profile display;
- message plaintext;
- nsec/private keys.

---

# 9. Privacy Limitations That MUST Be Explained Honestly

OpenDating cannot stop:

- someone a user matched with from taking screenshots;
- an authorized candidate from manually copying a profile;
- a malicious recipient from publishing information they legitimately received;
- a malicious external relay from violating OpenDating recommendations;
- all metadata observation by the user's chosen relay/provider;
- users from lying about self-declared information;
- global copies of information that a user deliberately published publicly.

NIP-09 itself warns that deletion requests cannot guarantee deletion from every relay and client.

The product MUST never promise impossible global erasure.

The objective is instead to:

> **prevent casual public discovery, bulk scraping and protocol-level amplification of sensitive dating information.**

---

# 10. Threat Model

The architecture MUST explicitly defend against the following actors.

## T1 — Unauthenticated scraper

Attempts:

- enumerate all dating profiles;
- collect photographs;
- map dating membership;
- enumerate gift wraps.

Mitigation:

- NIP-42;
- no public discovery index;
- no raw profile `REQ`;
- candidate batches only;
- short-lived media access;
- request quotas.

## T2 — Authenticated scraper

Creates a valid Nostr identity and attempts large-scale discovery.

Mitigation:

- discovery quotas;
- candidate batch limits;
- rate limits;
- trust tiers;
- randomized candidate ordering;
- candidate grants;
- coarse location;
- no exact candidate counts;
- abuse detection.

## T3 — Stalker or known acquaintance

Attempts to locate a specific user or triangulate their location.

Mitigation:

- no exact coordinates;
- no exact distance;
- distance buckets;
- profile visibility restrictions;
- private blocks;
- verified-only discovery mode;
- origin-change rate limits;
- no search-by-name endpoint in MVP;
- no raw geographic query interface.

## T4 — Abusive match

Obtains a legitimate match, then harasses or threatens the recipient.

Mitigation:

- instant unmatch;
- instant block;
- report after unmatch;
- cryptographic DM evidence;
- transport-level DM denial after block;
- safety escalation;
- account restrictions.

## T5 — Bot/Sybil operator

Creates thousands of Nostr keys.

Mitigation:

- NIP-42;
- connection/IP/device-level rate signals;
- optional PoW;
- account-age/social signals;
- verification;
- per-account quotas;
- per-network abuse limits;
- behavior-based restrictions.

Nostr keys prove control of a key, **not humanity**.

## T6 — Malicious report brigading

Attempts to mass-report an innocent user.

Mitigation:

- reports are evidence, not votes;
- raw count cannot automatically produce irreversible bans;
- reporter reputation may influence triage;
- evidence quality considered;
- manual review for serious permanent actions.

## T7 — Curious relay operator

Attempts to learn user behavior.

Mitigation:

- NIP-59 for service requests;
- peer E2EE for DMs;
- no message plaintext;
- no exact coordinates;
- minimal logs;
- application-level encryption for highly sensitive DB fields;
- ability to choose other providers later.

OpenDating cannot hide all network metadata from the user's chosen provider.

## T8 — Compromised database

Attacker obtains D1 contents.

Mitigation:

- no exact GPS;
- no nsecs;
- pseudonymous internal member IDs;
- encrypted sensitive JSON;
- separate encryption keys;
- minimized retention;
- private media in separate object storage.

## T9 — Malicious moderator

Attempts to browse private information unnecessarily.

Mitigation:

- least-privilege RBAC;
- evidence only accessible within relevant cases;
- moderator audit logs;
- no arbitrary DM browsing;
- strong operator authentication;
- severe-action review policies.

## T10 — Underage user

Attempts to enter an 18+ network.

Mitigation:

- mandatory 18+ declaration;
- age-verification provider interface;
- suspected-underage reporting path;
- immediate restriction while high-confidence safety review is pending;
- no raw DOB stored by the relay.

## T11 — Catfish / impersonator / scammer

Mitigation:

- photo/human verification interface;
- Nostr social history;
- NIP-05 as a weak identity signal only;
- signed verification assertions;
- impersonation reporting;
- scam reporting;
- account-risk controls.

---

# 11. Protocol Service Model

OpenDating defines **roles**, not one mandatory server.

V0.1 roles:

```text
relay
profile
discovery
matcher
dm-policy
moderation
verification
media
```

The reference implementation hosts all roles.

Each role MUST have an independent Nostr service keypair from day one.

Example:

```text
OD_PROFILE_SERVICE_PUBKEY
OD_DISCOVERY_SERVICE_PUBKEY
OD_MATCHER_SERVICE_PUBKEY
OD_MODERATION_SERVICE_PUBKEY
OD_VERIFICATION_SERVICE_PUBKEY
OD_MEDIA_SERVICE_PUBKEY
```

Private keys MUST be Cloudflare Worker secrets.

They MUST NOT live in:

```text
config.ts
wrangler.toml
git
D1
logs
```

Separate service identities are required even when one Worker controls all of them.

This allows:

```text
V0.1

one Worker
 ├ profile key
 ├ discovery key
 ├ matcher key
 ├ moderation key
 └ verification key
```

to become:

```text
V1+

Profile Operator A
Discovery Operator B
Matcher Operator C
Moderation Operator D
Verifier E
```

without changing event semantics.

---

# 12. Service Discovery

The reference relay SHOULD extend NIP-11 with an `opendating` field.

NIP-11 requires clients to ignore unknown additional fields, making this backwards compatible.

Example:

```json
{
  "name": "OpenDating Reference Relay",
  "supported_nips": [1, 11, 17, 42, 44, 51, 56, 59, 62, 78],
  "opendating": {
    "protocol_versions": ["0.1"],
    "roles": {
      "profile": {
        "pubkey": "<hex>",
        "relay": "wss://dating.example.com"
      },
      "discovery": {
        "pubkey": "<hex>",
        "relay": "wss://dating.example.com"
      },
      "matcher": {
        "pubkey": "<hex>",
        "relay": "wss://dating.example.com"
      },
      "moderation": {
        "pubkey": "<hex>",
        "relay": "wss://dating.example.com"
      }
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

A Nostr-native service manifest SHOULD later be added so roles can be discovered without relying on the HTTP relay document.

---

# 13. Experimental Wire Protocol

V0.x MUST NOT prematurely reserve arbitrary permanent event kinds.

Use:

```text
kind 30078
```

for addressable/state-like application documents.

Use:

```text
kind 78
```

for experimental commands/responses where multiple events may exist.

Sensitive OpenDating events MUST normally exist **inside NIP-59 envelopes**, not as publicly queryable raw `kind:78/30078` events.

---

# 14. Common OpenDating Envelope

All OpenDating application events MUST share a common inner schema:

```json
{
  "protocol": "opendating",
  "version": "0.1",
  "type": "discovery.query",
  "request_id": "random-128-bit-id",
  "created_at": 1786050000,
  "payload": {}
}
```

Required:

```text
protocol
version
type
request_id
created_at
payload
```

Properties:

- `request_id` MUST be random and unique;
- services MUST support idempotency;
- duplicate requests MUST NOT create duplicate likes/matches/reports;
- unknown major protocol versions MUST be rejected;
- unknown optional fields SHOULD be ignored;
- clients MUST place sensitive values inside encrypted content rather than outer tags.

---

# 15. Transport Pattern

A normal private service interaction:

```text
Alice
  │
  │ OpenDating rumor
  │ NIP-44
  │ NIP-59 seal + gift wrap
  ▼
Relay
  │
  │ outer p = Discovery Service
  ▼
Discovery Service
  │
  │ decrypt
  │ authenticate semantics
  │ process
  ▼
D1
```

Response:

```text
Discovery Service
  │
  │ encrypted candidate result
  │ NIP-59
  ▼
Relay
  │
  │ outer p = Alice
  ▼
Alice
```

The ordinary Nostr relay sends `OK` when the outer event is accepted.

That is only a **transport acknowledgement**.

Domain operations MUST return a separate OpenDating acknowledgement/result where appropriate.

---

# 16. OpenDating V0.1 Message Types

At minimum:

```text
profile.upsert
profile.pause
profile.resume
profile.delete

visibility.update

location.update

discovery.query
discovery.result

intent.like
intent.revoke

match.created
match.list
match.state

unmatch

block.add
block.remove

report.submit
report.received

verification.list
verification.result

account.delete

service.ack
service.error
```

Later:

```text
media.consent
date.share
date.checkin
call.signal
account.migrate
provider.preference
```

---

# 17. Authentication

Every OpenDating WebSocket session MUST support NIP-42.

OpenDating-specific operations MUST require successful NIP-42 authentication.

The reference implementation SHOULD:

- issue a random challenge per socket;
- bind challenge to the exact relay URL;
- expire unconsumed challenges after approximately 60 seconds;
- allow each challenge to be used only once;
- preserve authenticated session state through Durable Object hibernation;
- require reauthentication after reconnect;
- never persist the AUTH event as an ordinary relay event.

Nosflare already persists authenticated pubkeys/challenge state with the Durable Object WebSocket attachment mechanism. 

---

# 18. Authorization

Authentication answers:

> “Which key controls this connection?”

Authorization answers:

> “What is this key allowed to do?”

They MUST remain separate.

Reference member states:

```text
onboarding
active
paused
limited
quarantined
suspended
banned
deleted
```

Authorization examples:

```text
active:
  profile ✓
  discovery ✓
  like ✓
  DM matched users ✓

paused:
  profile retained
  discovery hidden
  existing matches/chat optionally ✓

limited:
  discovery ✓
  outbound likes reduced/disabled

quarantined:
  profile hidden
  no new likes
  no new matches
  existing account access ✓

suspended:
  no dating operations

banned:
  writes denied
```

---

# 19. Identity and Key Handling

The mobile client MUST:

- generate or import a standard Nostr identity;
- never send nsec to OpenDating infrastructure;
- store locally generated secrets using OS secure credential storage;
- support export/backup;
- support external signers where practical.

The backend MUST only ever receive public keys and signed/encrypted material.

Loss of the Nostr private key can mean loss of identity and encrypted-message recovery.

That limitation MUST be disclosed.

---

# 20. User Onboarding

MVP onboarding MUST collect:

```text
18+ confirmation
display/first name
age
gender identity
who the user wants to see
relationship intent
bio
interests
2–6 profile photos
location permission or manually selected location
distance preference
age preference
```

Optional:

```text
pronouns
orientation display
profile prompts
NIP-05
social links
```

Raw birthdate SHOULD remain device-local.

The profile service receives:

```text
age: 27
```

not:

```text
dob: 1999-03-14
```

unless a future verification provider requires DOB outside the relay.

Verified age should eventually come from a signed verification claim such as:

```text
age_over_18 = true
```

rather than broadcasting DOB.

---

# 21. Dating Profile Model

Candidate-visible profile:

```json
{
  "profile_version": 4,
  "display_name": "Alice",
  "age": 27,
  "gender": ["woman"],
  "pronouns": ["she/her"],
  "relationship_intents": ["long_term"],
  "bio": "...",
  "prompts": [
    {
      "prompt_id": "perfect_sunday",
      "answer": "..."
    }
  ],
  "interests": [
    "running",
    "coffee",
    "travel"
  ],
  "media": [
    {
      "media_id": "...",
      "order": 0,
      "type": "image"
    }
  ],
  "location_label": "Tampa Bay",
  "verification_claims": [
    "human_verified"
  ]
}
```

The following MUST be stored separately and MUST NOT be included in the candidate-visible profile unless explicitly chosen:

```text
exact search preferences
who-can-see-me settings
location cell
raw verification data
moderation state
blocks
likes
reports
internal trust signals
```

---

# 22. Profile Visibility

The user MUST have:

```text
active
paused
```

MVP.

Later:

```text
incognito
verified-only
matches-only
```

Reference safe defaults:

```text
profile discoverable only through authorized candidate queries
no public profile endpoint
no search-by-name
no global member directory
no direct "fetch arbitrary profile by npub" unless viewer is authorized
```

---

# 23. Location Privacy

Location is one of the highest-risk dating data types.

## Hard rule

**Exact GPS MUST NOT leave the device for normal discovery.**

The mobile client should:

```text
GPS
 ↓
coarse spatial cell
 ↓
send spatial cell
```

not:

```text
GPS
 ↓
latitude / longitude
 ↓
server
```

## Reference spatial representation

Use:

```text
scheme: geohash
maximum precision: 5
```

Example:

```json
{
  "scheme": "geohash",
  "cell": "dhvqx",
  "precision": 5
}
```

The exact implementation MAY evolve, but the protocol MUST identify the spatial scheme and precision.

Clients MAY intentionally add stable short-term location fuzz before calculating the cell.

---

# 24. Location Update Rules

The reference service SHOULD:

- accept a new cell only when location materially changes;
- rate-limit rapid origin switching;
- distinguish normal travel from repeated manual triangulation attempts;
- never expose stored cell identifiers to another candidate;
- never return raw coordinates;
- never return exact distance;
- never expose location history.

Location history SHOULD NOT be retained.

Only the most recent location cell is required.

---

# 25. Candidate Distance

Return coarse values:

```text
nearby
within 5 mi
5–10 mi
10–25 mi
25–50 mi
50+ mi
```

or an equivalent locale-aware unit.

Do NOT return:

```text
2.13 miles away
```

This substantially reduces triangulation value while preserving useful dating UX.

Users MAY choose:

```text
hide distance entirely
```

---

# 26. Location Anti-Triangulation

The service MUST implement defenses including:

- minimum useful search radius;
- rate-limited origin changes;
- coarse stored location;
- coarse returned distance;
- no exact sorting by distance;
- randomized ordering within similar score bands;
- no raw geographic profile queries;
- no arbitrary `#g` location enumeration;
- candidate-query quotas;
- low-density privacy handling.

If very few users exist in a geographic cell, the service SHOULD broaden location presentation rather than revealing uniquely identifying proximity.

---

# 27. Discovery Service

Discovery is a service, not a generic Nostr `REQ`.

The client sends:

```json
{
  "protocol": "opendating",
  "version": "0.1",
  "type": "discovery.query",
  "request_id": "...",
  "payload": {
    "origin_cell": "dhvqx",
    "radius_miles": 25,
    "age_min": 24,
    "age_max": 32,
    "genders": ["woman"],
    "relationship_intents": ["long_term"],
    "limit": 20,
    "exclude": ["..."]
  }
}
```

This entire event is encrypted to the discovery provider.

The generic relay MUST NOT translate these fields into publicly queryable Nostr tags.

---

# 28. Discovery Hard Eligibility

Before scoring, every candidate MUST pass:

```text
candidate is active
candidate is 18+
viewer is active
not same user
no block in either direction
no moderation exclusion
candidate allows viewer's category
viewer allows candidate's category
age preferences compatible
gender/orientation compatibility
relationship-intent compatibility where required
within coarse geographic policy
verification requirement satisfied
candidate has complete profile
```

Eligibility MUST happen before ranking.

---

# 29. Bilateral Discovery

A user should not merely specify:

> “Who do I want to see?”

They should also be able to specify:

> “Who am I willing to be shown to?”

This is particularly important for privacy and harassment reduction.

Examples:

```text
Only show me to users 24–40
Only show me to verified users
Only show me to users within 30 miles
Only show me to compatible relationship intents
```

These restrictions are P2 service-private data.

---

# 30. Candidate Result

A discovery response SHOULD contain no more than 20 candidates.

Example:

```json
{
  "type": "discovery.result",
  "request_id": "...",
  "payload": {
    "candidates": [
      {
        "pubkey": "...",
        "profile": {},
        "distance_bucket": "5-10mi",
        "candidate_grant": "...",
        "service_hints": {
          "matcher": [],
          "dm_relays": []
        }
      }
    ],
    "cursor": "opaque-value"
  }
}
```

The result itself is NIP-59 wrapped to the requesting user.

---

# 31. Candidate Grants

The reference discovery service SHOULD issue a short-lived candidate grant.

Purpose:

> prove to a matcher that the sender was legitimately authorized to interact with this candidate.

This prevents attackers from obtaining a list of arbitrary pubkeys and bypassing discovery policy by directly constructing likes.

Conceptually:

```text
viewer
target
discovery_provider
issued_at
expires_at
permission = like
```

V0.1 MAY use an opaque service token.

For cross-provider interoperability, the protocol SHOULD evolve toward a short-lived service-signed Nostr object that independent matchers can verify.

Expiration recommendation:

```text
15–60 minutes
```

---

# 32. Discovery Ranking

Ranking is an implementation policy and MUST NOT become a mandatory protocol algorithm.

Reference implementation SHOULD optimize for compatibility and healthy exposure rather than maximum swiping time.

Suggested score components:

```text
relationship-intent compatibility    25
distance bucket                      20
shared interests                     15
profile completeness                 10
recent activity bucket               10
verification/trust signals           10
exposure balancing                   10
```

Then randomize candidates within narrow score bands.

Do NOT initially use:

- attractiveness rankings;
- hidden desirability/Elo ratings;
- wealth ranking;
- paid boosts;
- engagement-maximization loops.

The protocol should eventually permit alternate discovery algorithms.

---

# 33. Free-Tier Discovery Optimization

D1 charges by rows read/written, so discovery MUST be index-driven. Current free D1 includes 5 million rows read/day, 100,000 rows written/day and 5 GB storage.

Do NOT store a database row for every impression.

Do NOT store a server-side row for every pass.

Instead:

### Passes

Keep normal passes primarily client-local.

The encrypted discovery request can send a bounded recent exclusion set.

Optional portable pass history MAY later be stored as an encrypted compact list snapshot.

### Likes

Likes MUST be persisted because matching requires them.

### Exposure

Maintain approximate aggregate exposure counts per profile rather than per-viewer impression logs.

This dramatically lowers write volume.

---

# 34. Likes

Likes are P2 service-private data.

A like MUST NEVER appear as a publicly queryable event.

Flow:

```text
Alice
  │
  │ NIP-59 intent.like → Matcher
  ▼
Matcher
  │
  ├ validate Alice
  ├ validate candidate grant
  ├ check block state
  ├ store A → B
  │
  └ check B → A
```

Payload:

```json
{
  "type": "intent.like",
  "request_id": "...",
  "payload": {
    "intent_id": "...",
    "target_pubkey": "...",
    "candidate_grant": "...",
    "expires_at": 1790000000
  }
}
```

Pending likes SHOULD expire.

Reference default:

```text
90 days
```

---

# 35. Passes

A pass does not need to become a global Nostr event.

Reference implementation:

```text
normal pass → local device state
```

Only explicit actions requiring cross-device persistence should be synchronized.

This minimizes:

- sensitive rejection history;
- D1 writes;
- provider knowledge;
- storage.

---

# 36. Mutual Matching

When:

```text
A likes B
AND
B likes A
```

the matcher creates a match.

No party learns about a one-way like before reciprocity.

The matcher sends:

```text
match.created → Alice
match.created → Bob
```

through separate NIP-59 gift wraps.

Match object:

```json
{
  "match_id": "...",
  "participants": [
    "<alice>",
    "<bob>"
  ],
  "created_at": 1786051000,
  "matcher": "<matcher-pubkey>",
  "dm_relays": [
    "wss://..."
  ]
}
```

---

# 37. Match ID

For cross-provider deduplication, match IDs SHOULD eventually be deterministic using the reciprocal intent IDs.

Conceptually:

```text
SHA256(
  "opendating-match-v1"
  + sorted(intent_a_id, intent_b_id)
)
```

Multiple matchmakers observing the same reciprocal intents can therefore produce the same logical match.

V0.1 can implement this immediately.

---

# 38. Matching Trust Model

V0.1 matchmakers are trusted to correctly attest:

> both parties expressed interest.

Likes remain encrypted to the chosen matcher.

Fully trustless private-set intersection is explicitly outside MVP scope.

This trust must be transparent:

```text
This match was attested by Matcher X.
```

Clients should eventually be able to choose multiple matchmakers.

---

# 39. Future Cross-Provider Matching

Every candidate result MAY contain the target's preferred matcher services.

When Alice likes Bob:

```text
send intent to:

Alice's selected matcher(s)
+
Bob's advertised matcher(s)
```

When Bob likes Alice, his client does the same.

This gives both providers the opportunity to observe both intents.

The client deduplicates resulting matches using deterministic match IDs.

This provides meaningful decentralization without requiring advanced cryptographic private-set-intersection in V1.

---

# 40. Messaging

OpenDating MUST use NIP-17 for private messages.

NIP-17 uses NIP-44 and NIP-59 and defines:

```text
kind 14 = text DM
kind 15 = file message
kind 1059 = gift wrap
```



MVP SHOULD support:

```text
text messages only
```

File/media messages SHOULD be introduced after content-consent and explicit-image protections are implemented.

---

# 41. Match-Only Messaging

The reference OpenDating DM relay MUST enforce:

```text
authenticated sender
+
recipient
+
active match
+
no block
=
accept gift wrap
```

If not:

```text
restricted: od:not-matched
restricted: od:blocked
```

The relay does not need to decrypt the DM.

It has:

```text
authenticated sender from NIP-42
recipient from outer p tag
```

and can therefore verify pair authorization without reading message contents.

This is one of the core OpenDating safety properties.

---

# 42. NIP-17 Recipient Privacy

Gift wraps MUST only be returned to the authenticated `p`-tagged recipient.

NIP-17 and NIP-59 explicitly recommend this protection.

Generic:

```text
REQ kinds:[1059]
```

MUST NOT reveal everyone else's wraps.

---

# 43. Encrypted DM Moderation

OpenDating MUST NOT solve moderation by routinely decrypting private messages.

Instead, reporting uses **recipient-selected evidence disclosure**.

When Alice reports Bob's message:

```text
Alice locally decrypts message
        │
        ▼
Alice chooses what evidence to submit
        │
        ▼
evidence encrypted to Moderation Service
```

Where available, evidence SHOULD contain:

```text
original kind-13 seal
decrypted rumor
message ID
surrounding context selected by reporter
media hash
reporter statement
```

NIP-17 requires clients to verify that the pubkey signing the seal matches the pubkey in the inner rumor. That same relationship allows a moderation service receiving voluntarily disclosed evidence to validate message authorship.

This provides:

```text
E2E privacy during ordinary use
+
verifiable evidence after abuse
```

without mass message surveillance.

---

# 44. Evidence Strength

Moderation evidence SHOULD be classified:

```text
cryptographic
media_hash
service_attested
screenshot
user_statement
```

A cryptographically verified sender-signed seal has greater evidentiary value than an unauthenticated screenshot.

This should inform moderator triage, not automatically decide guilt.

---

# 45. Unmatching

Either participant can unmatch at any time.

Flow:

```text
Alice → matcher: unmatch
```

Immediate effects:

```text
match state = unmatched
future DMs denied
match removed from normal active list
pending media permissions revoked
```

The other participant SHOULD receive a neutral state update such as:

```text
"This match is no longer available."
```

Do not disclose whether the cause was:

```text
unmatch
block
moderation
account deletion
```

unless policy specifically requires it.

A user MUST still be able to report a previous match after unmatching.

---

# 46. Blocking

Blocking is stronger than unmatching.

A block MUST immediately:

- remove the target from discovery;
- prevent the blocker from being shown to the target by the blocker's discovery providers;
- revoke an active match;
- revoke pending likes;
- prevent new likes;
- prevent new DMs through conforming relays;
- hide existing normal UI surfaces;
- preserve the blocker's ability to report;
- not notify the blocked user.

Block graph is P2 private.

---

# 47. Portable Blocking

The client SHOULD maintain:

```text
local immediate block
+
private NIP-51 list
+
encrypted block command to user's OpenDating providers
```

This provides:

- instant client safety;
- cross-device portability;
- server enforcement;
- no public block graph.

---

# 48. Reporting

OpenDating SHOULD reuse NIP-56 report semantics inside a NIP-59 envelope.

Example conceptual flow:

```text
NIP-56 kind 1984 report
        │
        │ private
        ▼
NIP-59 gift wrap
        │
        ▼
Moderation Service
```

This preserves existing Nostr reporting semantics without publicly exposing:

```text
who reported whom
why
when
evidence
```

---

# 49. OpenDating Report Taxonomy

The reference moderation system SHOULD support:

```text
harassment
threat
stalking
location abuse
doxxing
sexual harassment
unsolicited sexual content
impersonation
catfishing
scam
extortion
hate
fetishization
suspected underage user
offline violence
spam
other
```

Map these to NIP-56's existing broad report types and/or NIP-32 labels where possible until a standardized taxonomy exists.

---

# 50. Report Workflow

```text
submitted
   ↓
validated
   ↓
triaged
   ↓
in_review
   ↓
┌──────────────┬─────────────┐
│              │             │
dismissed   actioned    escalated
│              │             │
└──────────────┴─────────────┘
               ↓
             closed
               ↓
          optional appeal
```

---

# 51. Safety Severity

Reference levels:

### P0 — Critical

Examples:

```text
credible immediate threat
credible stalking/location threat
suspected exploitation of minors
serious doxxing
```

Action:

```text
immediate protective restriction
urgent human review
```

### P1 — Severe

```text
sexual harassment
threatening behavior
repeat targeted harassment
extortion
```

### P2 — Moderate

```text
impersonation
scams
repeated unwanted conduct
```

### P3 — Low

```text
spam
profile-policy issues
minor conduct complaints
```

Severity only controls urgency.

It does not automatically determine guilt.

---

# 52. Moderation Principles

OpenDating reference moderation MUST follow:

### Evidence over popularity

Ten unverified reports are not automatically stronger than one cryptographically supported report.

### Protect the reporter

The accused MUST NOT receive:

```text
reporter identity
private evidence
reporter's written narrative
moderator notes
```

unless legally required.

### Immediate protective actions are reversible

Temporary quarantine can occur before permanent adjudication where user safety requires it.

### Permanent actions require stronger confidence

Permanent bans should not be produced solely by automatic report counts.

This aligns with NIP-56's warning that reports can be gamed.

### No moderator DM browser

Moderators cannot simply browse all conversations.

They only see evidence voluntarily included in an authorized case.

---

# 53. Moderation Actions

Supported actions:

```text
warning
outbound_like_limit
outbound_like_disabled
dm_restricted
discovery_hidden
verification_required
quarantine
temporary_suspend
permanent_ban
profile_media_remove
profile_remove
```

Each action MUST contain:

```text
action_id
target
action_type
issuer
created_at
expires_at if temporary
reason_code
case_id
appeal_status
```

Internal details remain P4.

---

# 54. Moderation Appeals

Users SHOULD be able to appeal serious actions.

Appeal flow:

```text
user submits appeal
       ↓
different moderator or senior reviewer
       ↓
uphold / modify / reverse
```

The protocol does not need to standardize the full human workflow, but reference infrastructure should support it.

---

# 55. Safety-Conformant Relay Profile

Because moderation policy should not necessarily become a NIP, OpenDating SHOULD define a separate:

```text
OpenDating Safety Profile
```

A relay claiming Safety Profile V1 MUST support:

```text
18+ network
NIP-42 authentication
private profile discovery
no exact location disclosure
match-only DMs
private blocks
immediate unmatching
private reports
report-after-unmatch
moderation workflow
moderator audit trail
account deletion
NIP-62 handling
no safety paywalls
```

This lets the ecosystem decentralize without treating:

> “anything technically allowed by Nostr”

as automatically acceptable for dating.

---

# 56. Verification Architecture

Verification is a provider role.

Do not build one centralized OpenDating identity authority into the protocol.

Potential claims:

```text
human_verified
photo_verified
age_over_18
age_range_verified
id_verified
account_established
social_graph_established
```

A verification claim contains:

```text
subject
issuer
claim
issued_at
expires_at
proof reference if appropriate
```

Clients MUST display the issuer.

Do NOT show a universal:

```text
Safety Score: 94/100
```

Verification means only what its claim says.

Even Tinder explicitly warns that photo verification is not a guarantee of identity or safety.

---

# 57. Trust and NIP-85

NIP-85 MAY later provide useful external trust signals such as account age, activity or web-of-trust calculations. It allows independent providers to publish signed assertions rather than forcing clients to compute everything themselves.

However:

```text
NIP-85 score != human verification
NIP-85 score != safety guarantee
report count != guilt
```

The reference implementation MUST keep those distinctions explicit.

---

# 58. Anti-Sybil Strategy

No single technique solves Sybil attacks.

OpenDating SHOULD combine signals.

Tier examples:

### Tier 0

```text
new Nostr key
```

### Tier 1

```text
established account history
or
valid NIP-05
or
reasonable Nostr social graph
```

### Tier 2

```text
human/photo verification
```

### Tier 3

```text
stronger optional identity/age verification
```

Relays may apply different limits by tier.

Example:

```text
Tier 0: 20 likes/day
Tier 1: 50 likes/day
Tier 2: 100 likes/day
```

Exact limits are operator policy, not protocol.

---

# 59. Rate Limiting

Rate limiting MUST use the authenticated NIP-42 pubkey where available.

Additional network/device risk signals MAY supplement it.

Separate buckets are required for:

```text
AUTH
profile updates
location updates
discovery queries
likes
gift wraps
DM sends
reports
media uploads
```

Do not use one global event limit for everything.

---

# 60. Critical Nosflare Change: Kind 1059 Rate Limits

The upstream Nosflare configuration currently excludes `kind:1059` from its normal event rate limiter. 

That is inappropriate for a dating relay.

NIP-59 explains why gift wraps are an attractive spam vector: wrapper events use random one-time keys, preventing ordinary pubkey reputation/rate-limiting unless the relay uses NIP-42 authentication.

OpenDating MUST:

```text
remove 1059 from the unlimited/excluded path
```

and rate-limit gift wraps according to the **authenticated session identity**.

This is a P0 security requirement.

---

# 61. Private Query Caching

The current Nosflare Durable Object implements local/global query caches based primarily on filters/bookmark. 

OpenDating MUST introduce cache classifications:

```text
PUBLIC_CACHEABLE
AUTH_SCOPED
PRIVATE_NO_CACHE
```

The following MUST NEVER use a shared public/global cache:

```text
kind 1059 recipient queries
dating profile responses
matches
blocks
reports
verification-private results
anything whose answer depends on authenticated identity
```

Prefer:

```text
PRIVATE_NO_CACHE
```

for privacy-critical operations.

A response produced for Alice MUST never become retrievable by Bob because they issued syntactically identical filters.

This is another P0 requirement.

---

# 62. Profile Media

Dating photos MUST NOT simply be uploaded to a public permanent bucket URL.

Reference storage:

```text
private R2 bucket
```

The client SHOULD resize/compress images before upload.

Recommended limits:

```text
2–6 images
<= 3 MB per image accepted by server
client target <= 2 MB
max dimension approximately 2048 px
JPEG / PNG / WebP
```

No video in MVP.

---

# 63. Media Upload Flow

```text
Client
  │
  │ encrypted media.ticket request
  ▼
Media Service
  │
  │ short-lived upload authorization
  ▼
Client
  │
  │ authenticated upload
  ▼
Private R2
```

Private retrieval:

```text
authorized candidate
      │
      ▼
short-lived media token
      │
      ▼
Worker
      │
      ▼
R2
```

R2 currently includes a free allocation of 10 GB-month storage plus free request allowances and zero Internet egress fees, making it practical for an MVP if image sizes are constrained.

---

# 64. Blossom Compatibility

Blossom/NIP-B7 SHOULD remain an interoperability target for portable media because it uses content-addressed blobs and server lists.

However:

**normal public Blossom retrieval is not sufficient access control for private dating photos.**

Possible future portable model:

```text
photo
 ↓
client encrypts blob
 ↓
ciphertext uploaded to Blossom
 ↓
authorized candidate receives decryption material privately
```

Do not delay MVP for this.

---

# 65. Explicit Media Safety

MVP DM:

```text
text only
```

This intentionally removes unsolicited DM images from the first version.

Post-MVP:

- encrypted NIP-17 file messages;
- recipient media consent;
- client-side explicit-image detection;
- automatic blur until recipient chooses to reveal;
- one-tap report/block;
- sender-side warning before potentially sexual content.

Bumble currently uses automatic blur controls for potentially explicit images, illustrating the safety bar a competitive dating product should eventually meet.

These classifiers SHOULD run client-side where practical so the relay does not need plaintext.

---

# 66. Message Safety Nudges

Post-MVP clients SHOULD support on-device prompts such as:

```text
"This message may be disrespectful. Send anyway?"
```

and recipient prompts such as:

```text
"Did this message bother you?"
```

Equivalent patterns are currently used by major dating products.

Again:

```text
client-side classification preferred
server plaintext inspection prohibited by default
```

---

# 67. Date Safety

Post-MVP SHOULD include an optional Share Date feature.

The user may share:

```text
match display info
planned venue
planned date/time
optional check-in time
```

with a chosen trusted contact.

Do NOT make real-time location sharing mandatory.

The protocol should permit expiring encrypted safety-share payloads.

Modern apps including Bumble and Tinder provide date-sharing features as a safety control.

---

# 68. Deletion and Vanish

Three different actions must exist:

### Delete dating profile

Stops OpenDating discovery and deletes application-specific dating state.

### NIP-09 deletion

Requests deletion of specific Nostr events.

### NIP-62 vanish

Requests supporting relay deletion of everything for the user.

When a user invokes full OpenDating deletion:

```text
profile deleted
discovery index deleted
pending intents deleted
matches closed
blocks may be removed after safe transaction
normal media deleted
service responses pruned
DM gift wraps addressed to user deleted where required
```

Safety/legal evidence MAY require separate retention according to operator policy and applicable law.

That exception MUST be transparent and purpose-limited.

---

# 69. Vanish Tombstones

NIP-62 requires supporting relays to prevent deleted events from simply being rebroadcast back into the relay.

Therefore maintain a minimal tombstone:

```text
pubkey/internal-id
vanish cutoff timestamp
request id/hash
```

Do not preserve the deleted profile itself.

---

# 70. Internal Pseudonymous IDs

The reference backend SHOULD avoid using raw pubkeys as every internal database foreign key.

Generate:

```text
member_id =
HMAC-SHA256(
  OD_INDEX_KEY,
  nostr_pubkey
)
```

Private tables can use `member_id`.

Store the actual public key only where necessary, preferably encrypted in the membership table.

Benefits:

- database breach does not immediately expose which known Nostr keys use the dating network;
- joins remain fast;
- indexes remain deterministic.

The HMAC key MUST be a Worker secret and MUST support key-version migration.

---

# 71. Application-Level Encryption at Rest

Highest-sensitivity structured data SHOULD use AES-GCM envelope encryption before D1/R2 storage.

Separate keys:

```text
OD_DATA_KEY_V1
OD_MODERATION_KEY_V1
OD_MEDIA_TOKEN_KEY_V1
OD_INDEX_KEY_V1
```

Moderation evidence SHOULD use a separate key domain from ordinary dating data.

Every encrypted row/object stores:

```text
key_version
nonce
ciphertext
```

No encryption key belongs in Git.

---

# 72. D1 Data Model

Retain generic Nosflare tables for generic Nostr behavior, but OpenDating MUST use separate domain tables.

## `od_members`

```text
member_id PK
encrypted_pubkey
status
trust_tier
created_at
updated_at
last_active_bucket
protocol_version
```

Do not store exact presence timestamps for client display.

## `od_profiles`

```text
member_id PK
profile_version
encrypted_profile_payload
age
gender_category
relationship_intent
visibility_state
completeness
created_at
updated_at
```

Only normalized discovery fields required for filtering should remain queryable.

## `od_profile_media`

```text
media_id PK
member_id
r2_object_key
sha256
mime
sort_order
moderation_state
created_at
```

## `od_discovery_index`

```text
member_id PK
geo_cell_p5
geo_cell_p4
age
gender_category
intent_category
visible
trust_tier
activity_bucket
updated_at
```

No latitude/longitude.

## `od_visibility_preferences`

```text
member_id PK
encrypted_policy
verified_only
age_min
age_max
distance_max_bucket
updated_at
```

## `od_intents`

```text
intent_id PK
sender_member_id
target_member_id
state
created_at
expires_at
matcher_id
```

Unique active constraint:

```text
sender + target
```

## `od_matches`

```text
match_id PK
member_a
member_b
state
created_at
updated_at
matcher_id
```

## `od_blocks`

```text
blocker_member_id
blocked_member_id
created_at
source

UNIQUE(blocker, blocked)
```

## `od_reports`

```text
report_id PK
reporter_member_id
target_member_id
category
severity
status
evidence_strength
created_at
updated_at
assigned_to
```

## `od_report_evidence`

```text
evidence_id PK
report_id
r2_object_key
key_version
sha256
created_at
```

## `od_moderation_actions`

```text
action_id PK
target_member_id
case_id
action_type
reason_code
created_at
expires_at
issuer
appeal_status
```

## `od_appeals`

```text
appeal_id PK
action_id
status
created_at
reviewed_at
reviewer
```

## `od_verification_claims`

```text
claim_id PK
subject_member_id
issuer_pubkey
claim
status
issued_at
expires_at
proof_reference
```

## `od_idempotency`

```text
service
request_id
member_id
result_hash
expires_at
```

## `od_vanish_tombstones`

```text
member_id
cutoff_timestamp
request_hash
created_at
```

## `od_audit_log`

```text
audit_id
actor
action
resource_type
resource_id
timestamp
metadata_redacted
```

Never put raw DM plaintext into the audit log.

---

# 73. D1 Index Strategy

The free tier makes index design part of product architecture.

Cloudflare counts rows scanned, and indexes reduce rows read.

Minimum indexes:

```text
od_discovery_index(
  geo_cell_p5,
  visible,
  age,
  activity_bucket
)

od_discovery_index(
  geo_cell_p4,
  visible,
  age
)

od_intents(
  sender_member_id,
  target_member_id
) UNIQUE

od_intents(
  target_member_id,
  state,
  created_at
)

od_matches(
  member_a,
  state
)

od_matches(
  member_b,
  state
)

od_blocks(
  blocker_member_id,
  blocked_member_id
) UNIQUE

od_blocks(
  blocked_member_id,
  blocker_member_id
)

od_reports(
  target_member_id,
  status,
  created_at
)
```

Avoid creating an index for every filter because D1 also counts index writes.

Primary SQL prefilter:

```text
geo
visibility
age
```

Then evaluate less-common compatibility fields in Worker code over a small bounded candidate set.

Target:

```text
<= 100–200 rows considered
per normal discovery query
```

Never full-table scan.

---

# 74. Free Cloudflare Constraints

The architecture should deliberately target the free tier first.

Current Workers Free limits include approximately:

```text
100,000 requests/day
10 ms CPU per HTTP request
128 MB memory
```



Current D1 Free:

```text
5,000,000 rows read/day
100,000 rows written/day
5 GB storage
```



R2 includes:

```text
10 GB-month
1M Class A operations/month
10M Class B operations/month
free Internet egress
```



Durable Object WebSocket Hibernation should remain enabled because connected clients can stay connected while the object sleeps.

---

# 75. Critical Nosflare Free-Tier Changes

The existing fork needs immediate configuration hardening.

## Disable pay-to-relay

Current upstream defaults:

```text
PAY_TO_RELAY_ENABLED = true
```



Reference OpenDating MUST set:

```text
PAY_TO_RELAY_ENABLED = false
```

Basic dating and safety cannot depend on payment.

Monetization may be layered on later without affecting protocol interoperability.

## Fix DB pruning target

Upstream currently begins pruning around 9 GB. 

Free D1 currently provides 5 GB total.

Reference free-tier defaults should target approximately:

```text
start pruning: 4.0–4.25 GB
target after prune: 3.5–3.75 GB
```

with configuration rather than hardcoded constants.

## Fix CPU configuration

The upstream `wrangler.toml` currently specifies a much larger CPU allowance than the Workers Free limit. 

Create explicit:

```text
development
free-production
paid-production
```

configuration profiles.

V0.1 MUST continuously benchmark cryptographic/event paths against the free target.

---

# 76. Database Migration Architecture

The current relay performs substantial schema creation/migration logic at runtime in `relay-worker.ts`. 

OpenDating SHOULD move toward explicit migration files:

```text
migrations/
  0001_nosflare_base.sql
  0002_opendating_members.sql
  0003_opendating_profiles.sql
  0004_opendating_matching.sql
  0005_opendating_safety.sql
```

Production requests MUST NOT perform major schema migrations.

Deployment should explicitly apply migrations.

---

# 77. Proposed Repository Structure

Refactor the fork toward:

```text
/
├── src/
│   ├── index.ts
│   │
│   ├── worker/
│   │   ├── handler.ts
│   │   ├── routes.ts
│   │   ├── nip11.ts
│   │   └── health.ts
│   │
│   ├── relay/
│   │   ├── nostr/
│   │   │   ├── events.ts
│   │   │   ├── filters.ts
│   │   │   ├── signatures.ts
│   │   │   └── errors.ts
│   │   ├── auth/
│   │   ├── websocket/
│   │   ├── subscriptions/
│   │   ├── storage/
│   │   ├── cache/
│   │   └── policy/
│   │
│   ├── opendating/
│   │   ├── protocol/
│   │   │   ├── version.ts
│   │   │   ├── message-types.ts
│   │   │   ├── envelope.ts
│   │   │   ├── schemas/
│   │   │   ├── errors.ts
│   │   │   └── capabilities.ts
│   │   │
│   │   ├── router/
│   │   │
│   │   ├── services/
│   │   │   ├── profile/
│   │   │   ├── discovery/
│   │   │   ├── matcher/
│   │   │   ├── messaging-policy/
│   │   │   ├── blocks/
│   │   │   ├── moderation/
│   │   │   ├── verification/
│   │   │   ├── media/
│   │   │   └── deletion/
│   │   │
│   │   ├── storage/
│   │   │   ├── interfaces.ts
│   │   │   └── d1/
│   │   │
│   │   ├── crypto/
│   │   └── privacy/
│   │
│   ├── admin/
│   └── shared/
│
├── packages/
│   ├── protocol/
│   └── conformance/
│
├── migrations/
│
├── schemas/
│
├── tests/
│   ├── unit/
│   ├── protocol/
│   ├── conformance/
│   ├── security/
│   ├── integration/
│   └── load/
│
├── docs/
│   ├── PROTOCOL.md
│   ├── THREAT-MODEL.md
│   ├── PRIVACY.md
│   ├── MODERATION.md
│   ├── FEDERATION.md
│   ├── SAFETY-PROFILE.md
│   └── NIP-DRAFT.md
│
└── PRD.md
```

---

# 78. Package Boundaries

## `@opendating/protocol`

MUST contain no Cloudflare imports.

Contains:

```text
schemas
message types
capabilities
versioning
validation
errors
test vectors
```

Another Go/Rust relay should be able to implement the protocol solely from this package's specification/schema equivalents.

## `@opendating/conformance`

Black-box tests any compatible relay/service.

Examples:

```text
can authenticate
cannot enumerate profiles
can create profile
can discover candidates
likes remain private
mutual likes produce match
unmatched users cannot DM
blocks immediately deny DM
reports remain private
vanish removes data
```

This package is strategically important.

---

# 79. Storage Interfaces

Business logic MUST depend on interfaces.

Example conceptual interfaces:

```text
MemberRepository
ProfileRepository
DiscoveryRepository
IntentRepository
MatchRepository
BlockRepository
ReportRepository
ModerationRepository
VerificationRepository
MediaRepository
```

Cloudflare D1 is merely the reference adapter.

Do not import:

```text
D1Database
```

throughout domain logic.

Instead:

```text
DiscoveryService
    ↓
DiscoveryRepository
    ↓
D1DiscoveryRepository
```

Later:

```text
PostgresDiscoveryRepository
SQLiteDiscoveryRepository
RedisDiscoveryRepository
```

can exist without rewriting the protocol.

---

# 80. Service Interfaces

Likewise:

```text
ProfileService
DiscoveryService
MatcherService
ModerationService
VerificationService
MediaService
```

Each receives a domain request and returns a domain result.

The OpenDating Nostr router performs:

```text
decrypt
validate envelope
resolve service
authorize
invoke service
wrap response
```

This is the main seam that allows future extraction.

---

# 81. No Custom Nostr WebSocket Commands in V0.1

Do NOT add:

```text
["DATE_MATCH", ...]
["DISCOVER", ...]
["SWIPE", ...]
```

to the Nostr protocol.

Use ordinary:

```text
EVENT
REQ
AUTH
```

with NIP-59 application events.

This maximizes compatibility with normal relay/client infrastructure.

---

# 82. Error Semantics

Use existing relay prefixes whenever possible:

```text
auth-required:
restricted:
rate-limited:
invalid:
blocked:
```

OpenDating code follows the prefix:

```text
restricted: od:not-matched
restricted: od:blocked
restricted: od:membership-required
restricted: od:verification-required

invalid: od:profile-schema
invalid: od:expired-request
invalid: od:unsupported-version

rate-limited: od:discovery
rate-limited: od:likes
```

Service-level errors are also returned in encrypted OpenDating responses.

---

# 83. Protocol Schema Distribution

Every OpenDating type MUST have:

```text
JSON Schema
TypeScript type
runtime validator
example fixture
invalid fixture
conformance test
```

JSON Schema is canonical for cross-language implementations.

Do not make TypeScript itself the specification.

---

# 84. Protocol Versioning

Every application event includes:

```text
version
```

Policy:

```text
0.x = experimental
1.x = stable
```

A service manifest advertises supported versions.

A client selects the highest mutually supported compatible version.

Breaking schema changes require a major protocol version.

---

# 85. Idempotency

Every mutating command MUST carry:

```text
request_id
```

Service stores bounded idempotency state.

Repeated:

```text
intent.like request_id=123
```

cannot create duplicate intents.

Repeated report submission with same request ID cannot create multiple cases.

---

# 86. Replay Protection

Services MUST reject:

- stale commands;
- expired candidate grants;
- expired service tokens;
- duplicate request IDs;
- invalid NIP-59 seals;
- invalid sender/rumor identity relationships;
- expired auth challenges.

Expiration windows should be command-specific.

---

# 87. Private Relay Caching Rule

A single rule should exist in code:

```text
if response authorization depends on identity:
    sharedCache = forbidden
```

This MUST be enforced centrally rather than relying on individual developers remembering it.

---

# 88. Moderation Administration

Reference implementation requires a minimal admin UI.

It MAY be:

```text
Cloudflare Pages
or
Worker-served application
```

protected by strong operator authentication.

Prefer Cloudflare Access or an equivalent identity layer rather than a shared password.

Roles:

```text
reviewer
moderator
senior_moderator
administrator
```

---

# 89. Admin Console MVP

Screens:

```text
Dashboard
Report Queue
Report Detail
User Safety History
Profile Review
Moderation Actions
Appeals
Verification Claims
System Health
Audit Log
```

Report detail may show:

```text
report category
report severity
reporter-provided evidence
cryptographic verification result
previous relevant moderation actions
target profile version
```

It MUST NOT offer:

```text
"Browse all DMs"
```

---

# 90. Moderator Audit

Every moderator action MUST record:

```text
moderator identity
action
case
timestamp
reason code
before state
after state
```

Audit records MUST be append-oriented and protected against ordinary moderator editing.

---

# 91. Privacy-Safe Analytics

Allowed aggregate metrics:

```text
new users
active users
profiles created
discovery queries
candidate impressions aggregate
likes
matches
match rate
messages sent count
blocks
unmatches
reports
report categories
moderation resolution time
verification adoption
```

Forbidden analytics:

```text
DM plaintext
exact GPS
raw contact lists
nsec
moderator evidence contents in analytics
detailed individual romantic preference dossiers
```

Prefer internal pseudonymous IDs rather than raw pubkeys in telemetry.

---

# 92. MVP User Feature Set

The backend must support a client capable of:

### Account

- create/import Nostr key;
- authenticate;
- delete account.

### Profile

- name;
- age;
- gender;
- pronouns optional;
- dating intent;
- bio;
- prompts;
- interests;
- 2–6 photos;
- coarse location.

### Discovery

- age filter;
- distance filter;
- compatible gender/preference;
- relationship intent;
- candidate pagination;
- pause discovery.

### Matching

- like;
- pass;
- mutual match;
- match list.

### Chat

- NIP-17 encrypted text messages.

### Safety

- block;
- unmatch;
- report;
- report after unmatch;
- profile pause;
- verification architecture;
- moderator review;
- deletion/vanish.

Anything beyond that is not necessary for first release.

---

# 93. Competitive Post-MVP Features

Priority order:

### P1

- photo/liveness verification;
- ID/age provider integration;
- verified-only discovery;
- verified-only inbound interactions.

### P2

- encrypted image messaging;
- explicit-image blur;
- media consent;
- on-device message safety nudges.

### P3

- Share Date;
- safety check-in;
- Block Contacts with privacy-preserving implementation.

### P4

- voice/video calls;
- multiple matcher providers;
- multiple discovery algorithms;
- cross-relay federation.

### P5

- personalized ranking;
- optional Lightning features;
- richer trust providers.

Safety features always remain free.

---

# 94. Contact Blocking

Do NOT upload an entire address book in plaintext.

If Block Contacts is implemented later:

- user opts in;
- selected contacts only where possible;
- normalize locally;
- use privacy-preserving tokenization/HMAC through a dedicated service;
- never expose raw contact lists to discovery or matcher services;
- delete source contact information immediately after tokenization where practical.

Manual blocking by Nostr identity can ship first.

---

# 95. Account Discovery

MVP MUST NOT have:

```text
Search dating users by legal name
Search dating users by phone
Search dating users by email
Global directory
```

These create unnecessary stalking surfaces.

Discovery should be compatibility-based.

---

# 96. Activity Privacy

Do not return:

```text
online now
active 3 minutes ago
last seen 8:42 PM
```

by default.

Use broad buckets:

```text
active recently
active this week
```

or omit activity entirely.

Exact activity timestamps remain internal only where technically necessary.

---

# 97. Service Retention Defaults

Reference defaults:

```text
current profile: while active
old profile versions: remove after replacement unless safety case requires snapshot
location history: none
current location cell: latest only
pending likes: 90 days
client passes: not server persisted by default
unmatched relationship state: minimal tombstone
service command gift wraps: delete shortly after successful processing
user DM wraps: configurable rolling retention
closed report evidence: bounded safety retention
deleted media: remove promptly
```

Retention MUST be documented in relay policy.

---

# 98. Generic Relay vs OpenDating Data

Do not force all generic Nostr events into OpenDating semantics.

Architecture:

```text
Nostr Core
    │
    ├ normal generic event
    │     ↓
    │ generic relay pipeline
    │
    └ OpenDating service envelope
          ↓
      OpenDating router
```

Dating logic should not infect every generic query/storage function.

---

# 99. Recommended Reference Deployment Roles

One Worker can initially expose:

```text
wss://dating.example.com
```

while internally owning:

```text
relay role
profile role
discovery role
matcher role
dm-policy role
moderation role
verification registry
media role
```

Deployment flag:

```text
OD_ROLES=
relay,profile,discovery,matcher,dm-policy,moderation,verification,media
```

Later a deployment may run:

```text
OD_ROLES=matcher
```

or:

```text
OD_ROLES=relay,dm-policy
```

No protocol rewrite should be required.

---

# 100. Environment Configuration

Reference configuration should move away from source-edited constants for sensitive/operational values.

Example:

```text
OD_ENABLED
OD_PROTOCOL_VERSION

OD_PROFILE_SERVICE_PRIVKEY
OD_DISCOVERY_SERVICE_PRIVKEY
OD_MATCHER_SERVICE_PRIVKEY
OD_MODERATION_SERVICE_PRIVKEY
OD_VERIFICATION_SERVICE_PRIVKEY

OD_DATA_KEY_V1
OD_MODERATION_KEY_V1
OD_INDEX_KEY_V1
OD_MEDIA_TOKEN_KEY_V1

OD_GEOHASH_PRECISION
OD_DISCOVERY_BATCH_SIZE
OD_MAX_DISCOVERY_REQUESTS
OD_MAX_LIKES_PER_DAY

OD_DM_RETENTION_DAYS
OD_INTENT_RETENTION_DAYS
OD_REPORT_RETENTION_DAYS

OD_FREE_TIER_MODE
```

Public nonsecret configuration may remain normal environment variables.

Secrets use Worker Secrets.

---

# 101. Cloudflare Components

## Worker

Responsibilities:

```text
HTTP routing
NIP-11
WebSocket upgrade routing
private media HTTP routes
health endpoint
admin gateway
```

## Durable Objects

Responsibilities:

```text
WebSocket lifetime
NIP-42 session state
subscriptions
connection-level rate limiting
real-time delivery
broadcast
```

Keep WebSocket Hibernation.

## D1

Responsibilities:

```text
generic relay event store
OpenDating private data
matching
discovery index
moderation state
```

## R2

Responsibilities:

```text
profile photos
encrypted moderation evidence
future encrypted message attachments
```

---

# 102. No Heavy ML in the Worker MVP

Workers Free currently has a 10 ms CPU target per HTTP request.

Do not put:

```text
large image classifiers
LLMs
face recognition
heavy recommendation ML
```

inside the first Worker.

Prefer:

```text
client-side inference
external optional provider
simple deterministic backend logic
```

The MVP should remain cheap enough to operate for free.

---

# 103. Performance Objectives

Reference engineering targets:

```text
AUTH response             < 500 ms p95
profile mutation          < 1 s p95
discovery result          < 1 s p95
like acknowledgement      < 1 s p95
mutual match notification < 2 s p95
block enforcement         next request / < 1 s
DM delivery               < 1 s p95 while online
report acknowledgement    < 2 s p95
```

These are engineering targets, not contractual SLAs.

---

# 104. Cost Objectives

During MVP:

```text
normal development use should remain $0
small closed beta should target $0
```

The system should expose usage telemetry for:

```text
Worker requests
Worker CPU
D1 rows read
D1 rows written
D1 storage
R2 storage
R2 operations
Durable Object requests
```

A development build SHOULD fail tests that introduce obvious full-table discovery scans.

---

# 105. Required Security Tests

Automated tests MUST verify:

### Authentication

- invalid signature rejected;
- wrong challenge rejected;
- wrong relay URL rejected;
- expired challenge rejected;
- replayed challenge rejected.

### Authorization

- unauthenticated discovery denied;
- suspended user denied;
- wrong recipient cannot read gift wraps.

### Profile privacy

- arbitrary generic `REQ` cannot enumerate profiles;
- direct arbitrary profile fetch denied.

### Location

- exact GPS never persisted;
- raw location cell never returned to candidate;
- distance exactness unavailable.

### Likes

- one-way like invisible to target;
- duplicate like idempotent;
- blocked users cannot like.

### Match

- unilateral like does not create match;
- reciprocal like does;
- duplicate matcher processing does not duplicate match.

### Messaging

- unmatched sender denied;
- blocked sender denied;
- authenticated matched sender accepted;
- Bob cannot retrieve Alice-to-Carol wrappers.

### Block

- takes effect immediately;
- removes discovery;
- revokes match;
- does not disclose blocker reason.

### Reports

- report is not publicly queryable;
- evidence encrypted at rest;
- fake seal evidence fails verification;
- report count alone cannot trigger permanent automatic ban.

### Deletion

- deleted user removed from discovery;
- media deleted;
- stale profile cannot be reintroduced after valid vanish cutoff.

---

# 106. Fuzz and Property Testing

Fuzz:

```text
Nostr EVENT parsing
tags
filters
NIP-42 AUTH
OpenDating envelopes
JSON schemas
unexpected Unicode
oversized payloads
invalid timestamps
duplicate fields
malformed gift wraps
```

Property tests:

```text
block(A,B) ⇒ no candidate B→A
block(A,B) ⇒ no DM B→A
match(A,B) ⇒ reciprocal intents existed
unmatch(A,B) ⇒ future DM denied
vanish(A) ⇒ A never returned by discovery
```

---

# 107. Protocol Conformance Tests

The conformance suite MUST run against a relay URL rather than importing internal implementation functions.

Example:

```bash
opendating-conformance \
  --relay wss://localhost:8787 \
  --profile-service <pubkey> \
  --matcher-service <pubkey>
```

This is what will eventually allow:

```text
Nosflare TypeScript implementation ✓
Khatru Go implementation           ✓
Rust implementation                ✓
```

to prove interoperability.

---

# 108. NIP Readiness

Do NOT immediately submit:

> “NIP-XX Dating.”

The current NIPs repository states that accepted proposals should generally be fully implemented in at least two clients and one relay when applicable, remain optional/backwards-compatible, and avoid duplicative ways of doing the same thing.

The correct progression is:

```text
OpenDating 0.1 experimental
        ↓
reference relay
        ↓
reference client
        ↓
protocol conformance suite
        ↓
second independent client
        ↓
independent/second relay implementation
        ↓
protocol revisions
        ↓
NIP proposal
```

---

# 109. Likely NIP Scope

Do NOT attempt to standardize the entire dating product.

A future NIP should standardize the smallest interoperable layer required for independent clients/providers.

Likely candidates:

### Dating Profile/Discovery Semantics

How an eligible profile is represented and requested privately.

### Private Romantic Intent

How users privately express intent to a matcher.

### Mutual Match Attestation

How a matcher signals reciprocal intent.

Existing NIPs already handle:

```text
authentication
encryption
gift wrapping
DMs
private lists
reports
deletion
```

Reuse them.

Ranking algorithms, app UI and operator moderation rules should remain outside the core NIP.

---

# 110. What Makes This NIP-Worthy

Before proposal, an independent developer who has never seen the source code should be able to read:

```text
PROTOCOL.md
schemas/
test-vectors/
```

and successfully implement:

```text
create profile
discover profile
express intent
match
message
block
report
```

against the reference relay.

If they need to inspect Cloudflare Worker code to understand the protocol, the specification is not ready.

---

# 111. Documentation Required Before V1

Create:

```text
PRD.md
PROTOCOL.md
THREAT-MODEL.md
PRIVACY.md
MODERATION.md
SAFETY-PROFILE.md
FEDERATION.md
CONFORMANCE.md
NIP-DRAFT.md
```

### `PROTOCOL.md`

Normative wire specification only.

### `THREAT-MODEL.md`

Attackers and mitigations.

### `PRIVACY.md`

Exactly who sees each data type.

### `MODERATION.md`

Reference operator policy and evidence handling.

### `SAFETY-PROFILE.md`

Minimum safety requirements for compatible relays claiming OpenDating safety conformance.

### `FEDERATION.md`

Multiple relay/provider architecture.

### `NIP-DRAFT.md`

Maintained from early development but explicitly marked:

```text
NOT A NIP
EXPERIMENTAL
```

until implementation maturity.

---

# 112. Phase 0 — Fork Hardening

Before dating features:

1. make existing Nosflare tests/baseline reproducible;
2. disable pay-to-relay;
3. change branding/config to OpenDating Reference Relay;
4. move secrets/config to environment;
5. remove `1059` from rate-limit exclusions;
6. implement authenticated-user rate limits;
7. prevent shared caching of private/auth-scoped results;
8. set free-tier D1 pruning thresholds;
9. establish explicit migrations;
10. add CI;
11. add unit/integration test harness;
12. update advertised NIPs only when actually tested.

**Definition of done:**

A standard Nostr client can still connect, AUTH, publish/query appropriate generic events, and NIP-17 recipient privacy tests pass.

---

# 113. Phase 1 — Protocol Core

Implement:

```text
@opendating/protocol
versioning
envelope
schemas
errors
service manifest
service keys
OpenDating router
NIP-59 service request helpers
idempotency
```

**Definition of done:**

A test client can send an encrypted `service.echo` request to an embedded service identity and receive an encrypted response.

---

# 114. Phase 2 — Membership + Profile

Implement:

```text
od_members
od_profiles
profile.upsert
profile.pause
profile.resume
profile.delete
private profile media
visibility settings
```

**Definition of done:**

Alice can create a profile.

Bob cannot fetch it directly.

An authorized internal candidate operation can retrieve it.

---

# 115. Phase 3 — Location + Discovery

Implement:

```text
coarse geohash
discovery index
visibility policy
bilateral eligibility
discovery.query
discovery.result
distance buckets
candidate grants
cursor pagination
anti-enumeration limits
```

**Definition of done:**

Alice receives geographically relevant eligible candidates without receiving coordinates or arbitrary profile-directory access.

---

# 116. Phase 4 — Likes + Matches

Implement:

```text
intent.like
intent.revoke
od_intents
reciprocal detection
deterministic match IDs
match.created
match.list
```

**Definition of done:**

Alice likes Bob:

```text
Bob learns nothing.
```

Bob likes Alice:

```text
both receive match.
```

---

# 117. Phase 5 — NIP-17 Messaging

Implement:

```text
match-only DM gate
NIP-17 delivery
recipient AUTH
private 1059 query
retention
```

**Definition of done:**

Matched users can talk.

Unmatched users cannot send a DM through the conforming dating relay.

Relay never learns DM plaintext.

---

# 118. Phase 6 — Block + Unmatch

Implement:

```text
block.add
block.remove
unmatch
private NIP-51 synchronization
immediate authorization revocation
cross-discovery enforcement
```

**Definition of done:**

One block action prevents:

```text
discovery
likes
match
DM
```

in both relevant directions.

---

# 119. Phase 7 — Reporting + Moderation

Implement:

```text
private NIP-56 reporting
evidence bundle
cryptographic DM evidence validation
report queue
case states
moderation actions
audit
appeals foundation
admin UI
```

**Definition of done:**

A user can report abusive encrypted content without the relay having continuously decrypted conversations.

---

# 120. Phase 8 — Deletion + Privacy Audit

Implement:

```text
profile deletion
media deletion
NIP-09
NIP-62
tombstones
data-retention jobs
privacy tests
```

Perform an explicit privacy review.

---

# 121. Phase 9 — Verification

Implement provider interface first.

Then optionally integrate:

```text
photo verification
human/liveness verification
age verification
ID verification
```

The reference relay should ideally consume claims rather than becoming the permanent owner of raw biometric/ID material.

---

# 122. Phase 10 — Federation

Extract one service from the monolith.

Recommended first extraction:

```text
Matcher Service
```

Run it as a separate Nostr-speaking service.

If that requires major client changes, the original architecture failed.

Then implement a second matcher.

---

# 123. Phase 11 — Independent Implementation

Build a minimal second implementation, potentially:

```text
Khatru / Go
```

It does not need feature parity.

It merely needs enough functionality to prove the protocol is not secretly dependent on Nosflare.

---

# 124. Phase 12 — NIP Preparation

Only after:

```text
protocol stable
reference client works
second client works
reference relay works
independent relay/service works
conformance suite passes
security model documented
privacy model documented
```

should dedicated event kinds and formal NIP text be proposed.

---

# 125. Overall MVP Definition of Done

The backend MVP is complete when all of the following are true:

- [ ] Nostr identity is the account identity.
- [ ] NIP-42 AUTH is mandatory for OpenDating private operations.
- [ ] No exact GPS is stored.
- [ ] Dating profiles cannot be globally enumerated.
- [ ] Profile media is not publicly enumerable.
- [ ] Discovery supports location, age and compatibility filters.
- [ ] Discovery has bilateral visibility.
- [ ] Candidate results expose only coarse distance.
- [ ] One-way likes remain private.
- [ ] Reciprocal likes create matches.
- [ ] NIP-17 text chat works.
- [ ] DMs require an active match.
- [ ] Gift wraps are only queryable by authorized recipients.
- [ ] Block takes effect immediately.
- [ ] Unmatch terminates DM permission.
- [ ] Reports are private.
- [ ] Users can report after unmatching.
- [ ] DM abuse can be reported with verifiable evidence.
- [ ] Raw report counts cannot automatically permanently ban users.
- [ ] Moderators cannot arbitrarily browse conversations.
- [ ] Moderation actions are audited.
- [ ] Users can pause discovery.
- [ ] Users can delete their dating profile.
- [ ] NIP-62 vanish is handled.
- [ ] Private/auth responses are never shared through global caches.
- [ ] Kind 1059 is rate-limited by authenticated identity.
- [ ] Core flows have black-box conformance tests.
- [ ] Cloudflare-specific code does not exist in `@opendating/protocol`.
- [ ] Service roles use separate Nostr keys.
- [ ] A service can theoretically move to another process without changing its wire contract.
- [ ] Core functionality remains free.

---

# 126. Project Engineering Rules

Any coding agent working on this repository MUST follow these rules:

1. Preserve protocol/implementation separation.
2. Do not introduce a REST API for a feature that can cleanly use the OpenDating Nostr service envelope.
3. Do not create public tags containing sensitive dating information.
4. Never store exact GPS.
5. Never store nsec/private user keys.
6. Never log decrypted DMs.
7. Never log moderation evidence.
8. Never disable auth to make a feature easier.
9. Never bypass blocks in a secondary code path.
10. Never expose a direct global profile enumeration query.
11. Never add an OpenDating service without a documented privacy classification.
12. Never add a schema without a version and fixture.
13. Never add a persistent table without a retention policy.
14. Never add an auth-dependent query to a shared cache.
15. Never make safety functionality conditional on payment.
16. Never implement custom cryptography when an appropriate Nostr standard/library exists.
17. Keep every logical service behind an interface.
18. Every mutation must be idempotent.
19. Every important privacy property must have a negative test proving unauthorized access fails.
20. Optimize for correctness and safety before clever decentralization.

---

# 127. Final Architectural Principle

OpenDating should begin operationally centralized enough to be buildable:

```text
one Cloudflare account
one Worker
one D1 database
one R2 bucket
one Durable Object architecture
```

but protocol-level decentralized enough that none of those become permanent requirements:

```text
different relay
different database
different storage
different discovery provider
different matcher
different moderator
different verifier
different client
```

should all remain possible.

The reference implementation is therefore **not the OpenDating network**.

It is only:

> **the first reference implementation of the OpenDating protocol.**

The protocol is the valuable asset.

The ideal long-term outcome is not that everybody connects to one OpenDating server.

It is:

```text
Client A
Client B
Client C

        ↕ OpenDating

Relay A
Relay B
Relay C

Discovery A
Discovery B

Matcher A
Matcher B

Safety Provider A
Safety Provider B

Verification Provider A
Verification Provider B
```

with users free to choose among them.

That architecture preserves what Nostr is good at—portable identity, signed events, open transport, replaceable infrastructure and encrypted communication—while deliberately adding the privacy, discovery, matching, authorization, anti-abuse and moderation systems that a real dating network requires.