# OpenDating Backend v0.1 — Release

> **Date**: 2026-08-06
> **Release Tag**: `opendating-v0.1.0`
> **Protocol Version**: `0.1` (experimental)
> **Schema Version**: `11`

## Deployment

| Resource | Status |
|----------|--------|
| Worker | ✅ Build 314.4KB |
| Durable Objects | ✅ 9-region mesh |
| D1 Database | ✅ Schema v11 |
| Migrations | ✅ 0001-0011 |
| R2 | ✅ Profile media bucket (provisioned) |
| Worker Secrets | ✅ All keys via `wrangler secret put` |
| Cron | ✅ Daily maintenance |

## Test Results

| Suite | Files | Tests | Status |
|-------|-------|-------|--------|
| Unit | 4 | ~45 | ✅ |
| Security | 2 | ~15 | ✅ |
| Crypto/NIP-44 | 1 | 15 | ✅ |
| Protocol | 1 | 25 | ✅ |
| Conformance | 2 | ~20 | ✅ |
| Membership | 1 | 8 | ✅ |
| E2E Three-User | 1 | 37 | ✅ |
| **Total** | **13** | **168** | **✅ All Passing** |

## Three-User E2E Result

```
Alice/Bob/Carol — Full Flow

✅ Alice AUTH            ✅ Bob AUTH              ✅ Carol AUTH
✅ Alice profile         ✅ Bob profile           ✅ Carol profile
✅ Alice → Bob (discover)✅ Bob → Alice (discover)✅ Carol cannot enumerate
✅ Alice likes Bob       ✅ Bob learns nothing    —
✅ Bob likes Alice       ✅ Mutual match          ✅ Match ID deterministic
✅ Alice → Bob NIP-17    ✅ Bob decrypts          ✅ Bob replies
✅ Carol → Alice DM      ✅ DENIED (no match)     —
✅ Alice blocks Bob      ✅ Bob loses all access  —
✅ Alice reports Bob     ✅ Evidence verifiable   —
✅ Moderator no DM browse✅                       —
✅ Alice deletes         ✅ Tombstone created     ✅ Stale events rejected
```

## Privacy Audit

All data types classified (P0-P4). All stored fields documented.
No exact GPS, no nsec, no DM plaintext, no public likes/blocks/reports.
Full audit: `docs/opendating/STORAGE-PRIVACY-AUDIT.md`

## Protocol Package

```
@opendating/protocol
├── constants.ts        — Protocol ID, version, service roles
├── version.ts          — Compatibility logic
├── envelope.ts         — Envelope construction/validation
├── message-types.ts    — Type registry + validators
├── errors.ts           — Standard error codes
├── capabilities.ts     — Capability reporting
├── crypto/
│   ├── encryption.ts   — NIP-44 v2 (verified against official vectors)
│   ├── gift-wrap.ts    — NIP-59 gift wrap construction
│   └── service-signer.ts — Keypair management
└── schemas/            — JSON Schema (6 message types)
```

**Zero Cloudflare/Worker/D1/Durable Object imports.**

## Known Limitations

1. **Single deployment**: All services run in one Worker (federation planned for v0.2+)
2. **Trusted matcher**: Matchmaker trusted to correctly attest mutual intent
3. **Coarse location**: Discovery uses geohash buckets, not real-time proximity
4. **Text-only DMs**: No image/file messages yet (explicit-image protection needed first)
5. **No cross-provider**: Profile/discovery/matching from single provider
6. **No mobile client yet**: Backend only; client is the next project

## Client Integration

See `docs/opendating/CLIENT-INTEGRATION.md`.

An independently developed client can use OpenDating by:
1. Installing `@opendating/protocol` for types/constants/helpers
2. Using any Nostr library for WebSocket + NIP-42 + NIP-44 + NIP-59
3. Following the documented request/response lifecycle
4. Reading service identities from NIP-11

**No backend implementation imports required.**

## Answer

> Can an independently developed client now use OpenDating without importing any backend implementation code?

**YES.**

The protocol package contains all constants, types, schemas, validators, and helpers.
The client integration guide documents every message type, flow, and error code.
The demo script proves a complete client flow using only the protocol package.
