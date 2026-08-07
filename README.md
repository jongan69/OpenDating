<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/lockup-dark.png">
    <img alt="OpenDating" src="images/lockup-coral.png" width="520">
  </picture>
</p>

<p align="center">
  <strong>The privacy-first, decentralized dating protocol.</strong><br>
  Protocol specification, reference relay, and <code>opendating-protocol</code> npm package.
</p>

<p align="center">
  <a href="https://github.com/jongan69/OpenDating/blob/main/LICENSE"><img alt="License MIT" src="https://img.shields.io/badge/license-MIT-coral"></a>
  <a href="https://www.npmjs.com/package/opendating-protocol"><img alt="npm" src="https://img.shields.io/badge/npm-opendating--protocol-coral"></a>
  <a href="https://opendating-relay.jonathang132298.workers.dev"><img alt="Relay status" src="https://img.shields.io/badge/relay-live-brightgreen"></a>
  <img alt="Protocol version" src="https://img.shields.io/badge/protocol-v0.1-blue">
</p>

<br>

## What is OpenDating?

**OpenDating** is a domain-specific protocol built on [Nostr](https://github.com/nostr-protocol/nostr) for private, decentralized dating. It provides:

- **Self-sovereign identity** — Your account is a cryptographic keypair you own, portable across any OpenDating client
- **Location privacy** — Only a 5-character geohash (~5 km precision) is shared; exact coordinates never reach the relay
- **Private likes** — One-way likes are encrypted gift wraps visible only to the matcher service; no public reactions
- **End-to-end encrypted messaging** — NIP-17 DMs via NIP-44 encryption, enforced match-only by relay policy
- **Private safety** — Blocks and reports are encrypted, never public; blocks enforced server-side

The relay is a fork of [Nosflare](https://github.com/Spl0itable/nosflare) v7.9.45 (MIT), hardened and extended for dating-specific privacy and safety requirements.

> **Reference client:** [OpenDating Mobile](https://github.com/jongan69/opendating-mobile) — a production-quality Expo React Native app with Tinder-comparable UX.

<br>

## Architecture

```
┌──────────────────────────────────────────────┐
│           OpenDating Mobile Client           │  ← Expo React Native
├──────────────────────────────────────────────┤
│         opendating-protocol (npm)            │  ← Types, crypto, envelopes
├──────────────────────────────────────────────┤
│        NIP-59 Gift Wraps + NIP-44 E2EE       │  ← Privacy layer
├──────────────────────────────────────────────┤
│     OpenDating Relay (Cloudflare Workers)    │
│   ┌──────────────────────────────────────┐   │
│   │  NIP-42 AUTH  │  D1 DB  │  DO Mesh   │   │
│   └──────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│     System │ Profile │ Discovery │ Matcher   │  ← Service roles
│     DM Policy │ Moderation                  │
└──────────────────────────────────────────────┘
```

<br>

## Repository Structure

```
OpenDating/
├── packages/protocol/       # opendating-protocol npm package
│   └── src/
│       ├── protocol/        # Types, constants, validators, envelopes
│       └── crypto/          # NIP-44, NIP-59, key generation
├── src/                     # Relay implementation
│   ├── config.ts            # Relay configuration
│   ├── index.ts             # Worker entry point
│   ├── relay-worker.ts      # HTTP + WebSocket request handling
│   ├── durable-object.ts    # Durable Object mesh for real-time broadcast
│   └── opendating/          # OpenDating extension registry
├── schemas/                 # JSON Schema definitions
├── tests/                   # 82-test suite (unit, integration, security, protocol)
├── migrations/              # D1 database migrations
├── docs/                    # Protocol documentation
├── examples/                # Client demo scripts
└── scripts/                 # Build and key generation tools
```

<br>

## Protocol v0.1 — Service Roles

The relay advertises service pubkeys via [NIP-11](https://github.com/nostr-protocol/nips/blob/master/11.md):

```
GET https://opendating-relay.jonathang132298.workers.dev
Accept: application/nostr+json
```

| Service | Role |
|---|---|
| **System** | Health checks (`system.ping`), capability discovery |
| **Profile** | CRUD operations, visibility, pause/resume, verification |
| **Discovery** | Location updates (coarse geohash), preferences, candidate queries |
| **Matcher** | Private one-way likes, match creation, unmatch |
| **DM Policy** | Block/unblock management, relay-enforced message gating |
| **Moderation** | Encrypted report submission with optional evidence |

All service communication uses NIP-59 gift wraps. Every request carries a unique `request_id` for idempotency.

<br>

## Quick Start

```bash
git clone https://github.com/jongan69/OpenDating.git
cd OpenDating
npm install

# Build the worker
npm run build

# Run tests
npm test                         # Full suite (82 tests)
npm run opendating:test:e2e      # Protocol conformance tests

# Deploy (requires Cloudflare account + wrangler config)
npm run deploy
```

<br>

## Protocol Package

```bash
npm install opendating-protocol@0.1.0
```

```typescript
import {
  createEnvelope, buildGiftWrap, nip44Encrypt, nip44Decrypt,
  generateKeypair, validateEnvelope, OPENDATING_PROTOCOL,
  type OpenDatingEnvelope, type GiftWrapResult,
} from 'opendating-protocol';
```

See the [protocol package README](packages/protocol/README.md) for the full API reference.

<br>

## Documentation

| Document | Description |
|---|---|
| [SPEC](SPEC.md) | Protocol specification — types, operations, error codes |
| [PRD](PRD.md) | Product requirements document |
| [Mobile Integration](SPEC.md) | Client integration guide for mobile developers |
| [Conformance Tests](tests/opendating/conformance/) | Protocol compliance test suite |

<br>

## This Fork Extends Nosflare With

- **Multi-dimensional rate limiting** with identity awareness
- **Cache classification** — PUBLIC / AUTH_SCOPED / PRIVATE_NO_CACHE
- **NIP-42 hardening** — single-use challenges, 60-second expiry
- **Gift-wrap privacy protections** — NIP-59 envelope validation
- **Query complexity protection** — prevents enumeration attacks
- **Extension registry** — domain-specific protocol extensions (OpenDating)
- **Free-tier-aware configuration** — runs on Cloudflare's free plan
- **Database migration system** — versioned D1 schema management

<br>

## Supported NIPs

NIPs 1, 2, 4, 5, 9, 11, 12, 15, 16, 17, 20, 22, 33, 40, 42, 44, 59.

<br>

## Related Projects

- [**OpenDating Mobile**](https://github.com/jongan69/opendating-mobile) — Reference Expo React Native client
- [**Nosflare**](https://github.com/Spl0itable/nosflare) — Upstream relay this project is forked from

<br>

## License

MIT — based on [Nosflare](https://github.com/Spl0itable/nosflare) v7.9.45 (MIT License).

---

<p align="center">
  <sub>Built for privacy, portability, and genuine human connection.</sub>
</p>
