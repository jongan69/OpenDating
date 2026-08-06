# OpenDating Protocol

A private, NIP-59-based application protocol for dating services on Nostr.

> **Version**: 0.1 (experimental)
> **Status**: Protocol core implemented

## Overview

OpenDating enables dating applications to operate as a Nostr application protocol
without modifying the generic relay infrastructure. All dating-specific logic is
encapsulated in service extensions behind NIP-59 gift wraps.

## Protocol Layers

```
Application (dating logic)
    ↓
OpenDating Protocol (envelope, versioning, routing)
    ↓
Nostr Transport (NIP-59 gift wraps, NIP-44 encryption)
    ↓
Nostr Relay (generic infrastructure)
```

## Quick Links

- [PROTOCOL.md](PROTOCOL.md) — Implementation-independent protocol specification
- [ARCHITECTURE.md](ARCHITECTURE.md) — Reference implementation architecture
- [SECURITY.md](SECURITY.md) — Security model and guarantees
- [PRIVACY.md](PRIVACY.md) — Privacy analysis
- [SERVICE-DISCOVERY.md](SERVICE-DISCOVERY.md) — Service identity and discovery
- [ROADMAP.md](ROADMAP.md) — Planned phases
- [NIP-DRAFT.md](NIP-DRAFT.md) — Experimental standardization draft

## Current Implementation (V0.1)

- ✅ Protocol envelope and versioning
- ✅ NIP-59 transport (gift wrap + NIP-44 encryption)
- ✅ System service (ping/pong, capabilities)
- ✅ Service identity management
- ✅ Request validation and routing
- ✅ Idempotency (D1-backed)
- ✅ NIP-42 auth integration
- ✅ NIP-11 advertisement
- ✅ Extension registry integration
