# Secrets Architecture

## Overview

All secrets must be stored via Cloudflare's secret management.
Never store secrets in source code, config files, or Git.

## Secret Storage

```bash
# Set a secret
wrangler secret put <SECRET_NAME>

# List secrets (names only)
wrangler secret list

# Delete a secret
wrangler secret delete <SECRET_NAME>
```

## Required OpenDating Secrets

| Secret | Purpose |
|--------|---------|
| `OD_INDEX_KEY_V1` | HMAC key for pseudonymous member indexes; at least 32 characters |
| `OD_DATA_KEY_V1` | Encryption key material for protected member data; at least 32 characters |
| `OD_SYSTEM_SERVICE_PRIVKEY` | System service signer |
| `OD_PROFILE_SERVICE_PRIVKEY` | Profile service signer |
| `OD_DISCOVERY_SERVICE_PRIVKEY` | Discovery service signer |
| `OD_MATCHER_SERVICE_PRIVKEY` | Matcher service signer |
| `OD_DM_POLICY_SERVICE_PRIVKEY` | DM policy/block service signer |
| `OD_MODERATION_SERVICE_PRIVKEY` | Moderation service signer |
| `OD_DELETION_SERVICE_PRIVKEY` | Account deletion service signer |

`OD_ALLOW_DEV_KEYS=true` is a local-development escape hatch, not a production secret. The data/index layer fails closed without its keys, but the current service-identity loader omits roles whose signer is missing and logs a warning. The production deployment workflow must therefore verify that every required role is advertised and fail the release if any signer is absent.

## Secret Handling Rules

1. Never log secret values
2. Never include in error messages
3. Never store in D1
4. Never pass to client
5. Rotate on compromise
6. Use separate secrets for different environments

## Service Identity

The relay has a public key for NIP-11 identification.
This is NOT a secret — it's in the public relay info document.

Each active service role uses a separate secp256k1 private key stored as a Cloudflare secret. Its derived public key is advertised through signed relay capabilities. Rotate roles independently with a documented overlap and client capability-refresh plan.

## Development

For local development, use `.dev.vars` (gitignored):

```bash
# .dev.vars (never committed)
OD_ALLOW_DEV_KEYS=true
OD_SYSTEM_SERVICE_PRIVKEY=<64-hex-development-key>
```

For production, use `wrangler secret put`.

Before handoff, transfer secret-management access and record names, owners, creation/rotation dates, and environment placement without exporting values. Development, staging, and production must use different keys.
