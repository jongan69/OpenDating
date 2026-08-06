# Deployment Guide

## Profiles

### Local Development

```bash
npm install
cp .env.example .env
npm run db:migrate:local
npm run dev
```

### Free Production

Target: Cloudflare free tier (5GB D1, 10ms CPU per request)

Configuration:
- `RELAY_INFRA_PROFILE=free`
- DB pruning at 4.0GB (target 3.5GB)
- Conservative rate limits
- Pay-to-relay disabled

### Paid Production

Target: Cloudflare Workers Paid plan

Configuration:
- Higher CPU limits in wrangler.toml
- DB pruning at 9.0GB (target 8.0GB)
- More aggressive caching
- Optional pay-to-relay

## Deployment Steps

### 1. Create D1 Database

```bash
wrangler d1 create nostr-relay
```

Update `wrangler.toml` with the database ID.

### 2. Run Migrations

```bash
npm run db:migrate:remote
```

### 3. Set Secrets

```bash
wrangler secret put RELAY_PRIVATE_KEY
```

### 4. Deploy

```bash
npm run build
npm run deploy
```

### 5. Verify

```bash
curl https://your-relay.example.com -H "Accept: application/nostr+json"
```

## Wrangler Configuration

```toml
name = "your-relay"
compatibility_date = "2025-01-04"
main = "worker.js"

[[durable_objects.bindings]]
name = "RELAY_WEBSOCKET"
class_name = "RelayWebSocket"

[[d1_databases]]
binding = "RELAY_DATABASE"
database_name = "nostr-relay"
database_id = "your-database-id"

[triggers]
crons = ["0 0 * * *"]

[limits]
cpu_ms = 30000  # 30s for free tier, 300000 for paid

[[migrations]]
tag = "v4"
new_sqlite_classes = ["RelayWebSocket"]
```

## Post-Deployment

1. Verify NIP-11 response
2. Test WebSocket connection
3. Test EVENT publish + REQ
4. Test NIP-42 auth
5. Monitor Cloudflare analytics
6. Check D1 storage growth
