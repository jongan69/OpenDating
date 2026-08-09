# Deployment Guide

> **Production status:** repository CI proves the source builds; it does not prove the configured endpoint runs the same commit. Production deployment remains gated until the live Worker SHA, migrations, bindings, secret names, rollback, and restore evidence are recorded. GitHub `staging` and reviewer-gated `production` environments exist, but deployment workflows and isolated Cloudflare staging resources still need to consume them.

## Profiles

### Local Development

```bash
npm ci
cp .env.example .env
npm run db:migrate:local
npm run dev
```

### Development and limited testing

Cloudflare quotas and product limits change over time. Check the current official limits before sizing or enabling a market; do not treat an old limit copied into this repository as capacity evidence.

Configuration:
- `RELAY_INFRA_PROFILE=free`
- DB pruning at 4.0GB (target 3.5GB)
- Conservative rate limits
- Pay-to-relay disabled

### Production

Production requires a paid capacity plan validated by load tests, storage projections, alerting, backup/restore drills, and vendor/legal signoff. The current repository does not contain that evidence.

Configuration:
- Higher CPU limits in wrangler.toml
- DB pruning at 9.0GB (target 8.0GB)
- More aggressive caching
- Optional pay-to-relay

## Deployment Steps

### 1. Provision an isolated environment

```bash
wrangler d1 create opendating-relay-<environment>
```

Update `wrangler.toml` with the database ID.

### 2. Run Migrations

```bash
npm run db:migrate:remote
```

### 3. Set every required secret

```bash
wrangler secret put OD_INDEX_KEY_V1
wrangler secret put OD_DATA_KEY_V1
# Repeat for each OD_<ROLE>_SERVICE_PRIVKEY in docs/SECRETS.md.
```

### 4. Validate without deploying

```bash
npm run build
npm run ci
npm audit --audit-level=low
npx wrangler deploy --dry-run
```

### 5. Deploy through the approved environment

Production deployment must run from protected `main`, require the GitHub `production` environment approval, record the exact source SHA and migration state, and use environment-specific Wrangler configuration. Direct workstation deployment is not a production handoff procedure.

### 6. Verify

```bash
curl https://your-relay.example.com -H "Accept: application/nostr+json"
```

## Wrangler Configuration

`wrangler.toml` is the current first-party configuration and binding inventory. Create explicit environment-specific configurations before staging deployment; never reuse production database, bucket, queue, KV, service keys, or encryption/index keys in development or staging.

## Post-Deployment

1. Verify NIP-11 response
2. Test WebSocket connection
3. Test EVENT publish + REQ
4. Test NIP-42 auth
5. Monitor Cloudflare analytics
6. Verify OpenDating capabilities and every advertised service identity
7. Verify Queue, AI, media, cache, deletion, and moderation health explicitly
8. Record D1/R2/KV growth and queue age
9. Exercise rollback and restore procedures before public beta
