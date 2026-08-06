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

## Required Secrets

| Secret | Purpose |
|--------|---------|
| (none yet) | The generic relay requires no additional secrets |

## Future Secrets (for domain protocols)

Future domain protocols (e.g., OpenDating) may require:

| Secret | Purpose |
|--------|---------|
| `SERVICE_PRIVATE_KEY` | Private key for relay service identity |
| `ENCRYPTION_KEY` | Key for at-rest data encryption |
| `ADMIN_API_KEY` | Admin endpoint authentication |

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

Future service identities (for signing domain protocol events)
will use separate keypairs stored as Cloudflare secrets.

## Development

For local development, use `.dev.vars` (gitignored):

```bash
# .dev.vars (never committed)
SERVICE_PRIVATE_KEY=your-dev-key
```

For production, use `wrangler secret put`.
