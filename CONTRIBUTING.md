# Contributing to OpenDating

Start with `docs/opendating/BACKEND-HANDOFF.md`, then read the architecture, security, privacy, deployment, and protocol documents relevant to the change.

## Setup

```bash
npm ci
npm run ci
```

Node.js 22 is the supported development and CI runtime. Local Worker development also requires Wrangler and local D1 state.

## Change rules

1. Create a branch from protected `main` and use a pull request.
2. Treat `packages/protocol` as the canonical client contract. Do not change request/result shapes without a compatibility and mobile-migration plan.
3. Keep backend implementation code out of the published protocol package.
4. Keep migrations additive and forward-only.
5. Never commit `.dev.vars`, service private keys, data/index keys, decrypted payloads, production exports, or personal data.
6. Do not claim a deployment is current without evidence from the exact commit.

## Required checks

```bash
npm run ci
npm audit --audit-level=low
npx wrangler deploy --dry-run

cd packages/protocol
npm ci
npm run build
npm pack --dry-run
```

Lint warnings are tracked debt; new changes should not introduce additional warnings.

## Documentation

Update the protocol release note, handoff, deployment instructions, and mobile coordination notes whenever a change affects a service role, request route, migration, secret, binding, retention rule, or production procedure.
