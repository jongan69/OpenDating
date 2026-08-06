# Development Guide

## Prerequisites

- Node.js 20+
- npm
- Cloudflare account (for deployment, not required for local dev)

## Quick Start

```bash
npm install
npm run dev          # Start local Worker
npm test             # Run all tests
npm run typecheck    # TypeScript check
npm run build        # Production build
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server (wrangler dev) |
| `npm run build` | Build worker.js bundle |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests |
| `npm run test:security` | Security tests |
| `npm run test:protocol` | Protocol conformance tests |
| `npm run db:migrate:local` | Run D1 migrations locally |
| `npm run db:migrate:remote` | Run D1 migrations remotely |
| `npm run ci` | Full CI pipeline |

## Project Structure

```
src/
├── config/           Configuration system
├── relay/            Relay core modules
│   ├── crypto/       Signatures, hashing
│   ├── protocol/     Event/filter validation
│   ├── policy/       Content policy
│   ├── rate-limit/   Rate limiting
│   ├── cache/        Cache classification
│   ├── queries/      Query complexity
│   ├── services/     Extension registry
│   └── storage/      Storage interfaces
├── shared/           Shared utilities
├── worker/           HTTP worker helpers
└── future-protocols/ Extension protocols

tests/
├── unit/             Pure function tests
├── integration/      Worker integration tests
├── security/         Security-focused tests
└── protocol/         NIP conformance tests

migrations/           D1 SQL migrations
docs/                 Documentation
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure `wrangler.toml` with your D1 database
3. Run `npm run db:migrate:local` to initialize the database

## Testing

```bash
# All tests
npm test

# Specific suites
npm run test:unit
npm run test:security
npm run test:protocol

# Watch mode
npm run test:watch
```

## Code Style

- TypeScript strict mode enabled
- No `any` types (use proper Nostr types)
- Functions over classes where practical
- Explicit imports (no barrel files)
- Crypto via `src/relay/crypto/` only

## Adding Features

1. Add tests first
2. Implement in the appropriate module
3. Verify build + typecheck + tests
4. Update documentation if needed
