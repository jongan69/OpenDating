# Architecture

## Overview

```
                    HTTP Request
                         │
                         ▼
              ┌──────────────────┐
              │  Worker Handler  │  (src/relay-worker.ts)
              │  - HTTP routing  │
              │  - NIP-11        │
              │  - Health        │
              │  - DB init       │
              │  - Landing page  │
              └────────┬─────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
    WebSocket    Relay Info    HTTP API
    Upgrade      JSON          (health, NIP-05)
          │
          ▼
┌──────────────────────┐
│  Durable Object      │  (src/durable-object.ts)
│  - WebSocket sessions│
│  - NIP-42 auth       │
│  - Subscriptions     │
│  - Broadcasting      │
│  - Query caching     │
│  - Rate limiting     │
└──────────┬───────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌──────┐    ┌──────────┐
│  D1  │    │ Cache API│
│  DB  │    │ (global) │
└──────┘    └──────────┘
```

## Data Flow

### EVENT Ingest

```mermaid
flowchart TD
    A[EVENT received] --> B[Validate shape]
    B --> C[NIP-42 auth check]
    C --> D[Rate limit check]
    D --> E[Verify signature]
    E --> F[Policy check]
    F --> G[processEvent]
    G --> H{Event kind?}
    H -->|kind 5| I[Deletion handler]
    H -->|20000-29999| J[Ephemeral: broadcast only]
    H -->|other| K[saveEventToDatabase]
    K --> L[Check duplicates]
    L --> M[Handle replaceable]
    M --> N[INSERT event + tags]
    N --> O[Cache event ID]
    O --> P[Send OK]
    P --> Q[Invalidate caches]
    Q --> R[Broadcast to all DOs]
```

### REQ Flow

```mermaid
flowchart TD
    A[REQ received] --> B[Validate sub ID]
    B --> C[NIP-42 auth check]
    C --> D[Rate limit check]
    D --> E[Validate filters]
    E --> F[Complexity check]
    F --> G[Classify cache scope]
    G --> H{Cache scope?}
    H -->|PUBLIC| I[Check global Cache API]
    H -->|AUTH_SCOPED| J[Check auth-scoped cache]
    H -->|PRIVATE_NO_CACHE| K[No cache, query directly]
    I --> L[Query D1]
    J --> L
    K --> L
    L --> M[Return events + EOSE]
```

### AUTH Flow

```mermaid
flowchart TD
    A[Connection] --> B[Generate challenge]
    B --> C[Send AUTH challenge]
    C --> D[Wait for client AUTH]
    D --> E[Validate kind 22242]
    E --> F[Verify signature]
    F --> G[Check created_at freshness]
    G --> H[Verify challenge match]
    H --> I[Verify relay URL]
    I --> J[Add to authenticated pubkeys]
    J --> K[Clear old challenge]
    K --> L[Generate new challenge]
    L --> M[Send OK]
```

## Module Layout

```
src/
├── index.ts              Entry point
├── config.ts             Operator configuration
├── types.ts              Core Nostr types
├── relay-worker.ts       HTTP worker handler
├── durable-object.ts     WebSocket DO
│
├── config/
│   ├── defaults.ts       Safe default values
│   └── schema.ts         Runtime validation
│
├── shared/
│   ├── hex.ts            Hex encoding utilities
│   └── logger.ts         Structured logging
│
├── relay/
│   ├── crypto/           Signature verification, hashing
│   ├── protocol/         Event/filter validation
│   ├── policy/           Content moderation policy
│   ├── rate-limit/       Token bucket rate limiting
│   ├── cache/            Cache classification
│   ├── queries/          Query complexity analysis
│   ├── services/         Extension registry
│   └── storage/          Storage interfaces
│
├── worker/
│   └── health.ts         Health check endpoint
│
└── future-protocols/     Domain protocol extensions
```

## Key Design Decisions

1. **D1 for persistence**: SQLite via Cloudflare D1 with read replication
2. **Durable Objects for WebSockets**: 9-region mesh for low-latency connections
3. **WebSocket Hibernation**: Cost optimization for idle clients
4. **Cache classification**: PUBLIC / AUTH_SCOPED / PRIVATE_NO_CACHE
5. **Token bucket rate limiting**: Multi-dimensional, identity-aware
6. **Query complexity protection**: Pre-execution cost estimation
7. **Extension registry**: Domain protocols plug in without modifying core
