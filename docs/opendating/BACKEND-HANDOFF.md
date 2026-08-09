# OpenDating Relay and Protocol Handoff

Last reviewed: August 9, 2026.

## Handoff status

The repository is ready for another engineer to clone, test, and continue. It is not a production-complete marketplace backend. Source `main` contains the `opendating-protocol` 0.1.1 deletion/routing repair and a tested relay baseline, but npm publication, current-production deployment evidence, isolated Cloudflare staging resources, and the 0.2 security/operations program remain outstanding.

Do not infer live deployment state from a green repository build. The exact deployed Worker SHA, migration state, binding inventory, secret versions, restore evidence, and rollback record must be captured separately for every environment.

## Repository boundary

- `packages/protocol` is the canonical backend-independent protocol package.
- `src/protocols/opendating` is the reference service implementation.
- `src/relay-worker.ts`, Durable Objects, D1, R2, KV, Queues, and Workers AI form the current first-party operator stack.
- The mobile reference client lives in `jongan69/opendating-mobile` and must not import backend source.
- Protocol `0.1` remains experimental. Federation and interchangeable operators are post-GA work.

## Bootstrap and quality gates

```bash
npm ci
npm run ci
npm audit --audit-level=low
npx wrangler deploy --dry-run

cd packages/protocol
npm ci
npm run build
npm pack --dry-run
```

The current protected CI baseline is 17 test files and 248 tests. Existing lint warnings are non-failing debt; do not add new warnings.

## Current release boundary

- npm registry: `opendating-protocol@0.1.0`.
- repository package source: `0.1.1` contract repair.
- publication is blocked until an authenticated npm maintainer publishes the package and verifies the registry tarball.
- mobile must then pin the exact `0.1.1` artifact and remove its temporary routing mirror.
- no GitHub Release or signed production tag currently proves a GA-ready deployment.

## Access that must be transferred

Never put credential values in GitHub issues, documentation, exports, or chat.

| System | Required access | Handoff requirement |
|---|---|---|
| GitHub | Admin or maintainer | `main` is protected; staging is protected-branch-only and production requires `jongan69` approval |
| Cloudflare | Workers, D1, R2, KV, Queues, AI, DNS, secrets, logs | Inventory development/staging/production resources and record exact owners and jurisdictions |
| npm | Publish rights for `opendating-protocol` | Current local session is unauthenticated |
| Backup account | Encrypted exports and restore credentials | Not yet established or drill-verified |
| Future vendors | Persona, Hive, RevenueCat, Sentry, moderation provider | Not approved to receive production data |

## Current infrastructure caveat

`wrangler.toml` identifies the existing first-party Worker and production-named bindings. It is not an isolated multi-environment configuration. GitHub staging/production approval environments now exist, but Cloudflare staging resources and deployment workflows that consume those environments still need to be created. Optional Queue, AI, media, and cache bindings currently have degraded behaviors; the production plan requires explicit health failure or feature disablement for required capabilities.

## Immediate continuation order

1. Authenticate npm, publish `opendating-protocol@0.1.1`, inspect the tarball, and coordinate the mobile pin.
2. Inventory the live Cloudflare deployment and compare its Worker SHA, migrations, bindings, secret names, and health behavior with protected `main`.
3. Create isolated Cloudflare development/staging/production resources and GitHub-environment-gated deployment workflows.
4. Verify deletion cascades across delivery events and object storage and return an idempotent receipt.
5. Begin protocol 0.2 schemas, generated validators, signer interface, authenticated route registry, and compatibility handlers.
6. Add backups, restore drills, passive endpoint/failover evidence, load tests, dashboards, alerts, and independent security review before public beta.

## Production data rules

- Never log raw pubkeys, private keys, decrypted messages, exact GPS, profile content, moderation evidence, or vendor payloads.
- Never use deterministic or published test keys against production.
- Never rotate `OD_INDEX_KEY_V1` or `OD_DATA_KEY_V1` without an approved data migration/erasure plan; changing them makes existing protected member records unreadable.
- Never deploy with `OD_ALLOW_DEV_KEYS=true`.
- Treat moderation, deletion, Queue, AI, and media outages as explicit feature-health states; public beta must not silently degrade open.

## Evidence required for handoff completion

A production operator handoff needs named owners, access confirmation, a binding/secret-name inventory, data map, deployment and rollback runbook, current dashboards, incident contacts, backup/restore proof, retention jobs, vendor/legal approvals, and an exact release record. This repository provides the technical starting point; those operational artifacts do not yet exist in release-complete form.
