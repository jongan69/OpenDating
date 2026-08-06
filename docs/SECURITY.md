# Security

## Trust Assumptions

- The relay operator controls the Cloudflare account
- D1 database is private to the operator
- Durable Objects are isolated per-account
- Web Crypto API provides secure randomness
- TLS terminates at Cloudflare edge

## NIP-42 Authentication

- Challenge: 32 random bytes (64 hex chars)
- Expiry: 60 seconds (configurable)
- Single-use: challenge replaced after successful auth
- Relay binding: must match relay domain
- Hibernation-safe: auth state persists in WebSocket attachment
- Multi-pubkey: clients can authenticate multiple pubkeys

## Gift-Wrap (NIP-59) Isolation

- Kind 1059 queries: PRIVATE_NO_CACHE only
- Recipient enforcement: auth pubkey must match #p tag
- Rate limiting: uses authenticated identity, not wrapper pubkey
- No shared caching for gift-wrap results
- Anonymous gift-wrap queries rejected

## Rate Limiting

Multi-dimensional buckets:
- AUTH: 10/min/socket
- EVENT_PUBLIC: 30/min/pubkey
- EVENT_GIFTWRAP: 60/min/auth-pubkey
- REQ: 60/min/auth-pubkey
- REQ_EXPENSIVE: 10/min/auth-pubkey
- CONNECTION: 5/min/IP

Primary identity: NIP-42 authenticated pubkey
Fallback: socket/IP-based

## Cache Security

| Scope | Sharing | Key |
|-------|---------|-----|
| PUBLIC | Global Cache API | filters + bookmark |
| AUTH_SCOPED | Per-user only | auth pubkey + filters + bookmark |
| PRIVATE_NO_CACHE | Never shared | random per-request |

## Event Validation

Pipeline order (reject early):
1. Shape validation → cheap
2. Size limits → cheap
3. Signature verification → crypto
4. Timestamp policy → cheap
5. Relay policy → business logic

## Query Protection

- Complexity scoring per filter
- COUNT precheck for expensive tag queries
- Hard limit: 500 results
- Default limit: 100 results
- Chunked queries for large arrays

## Logging Policy

Logged:
- Connection events
- Auth success/failure (without signatures)
- Rate limit activation
- Query patterns (without content)
- Security events

Never logged:
- Private keys
- Auth signatures
- DM plaintext
- Decrypted payloads
- Gift-wrap content

## Secrets

- Cloudflare secrets only (wrangler secret put)
- Never in source code or config files
- Never in Git history
- Documented in docs/SECRETS.md

## Known Limitations

1. In-memory rate limit state (lost on DO eviction)
2. No persistent auth blacklist
3. No connection-level flood protection beyond rate limiting
4. Query caching uses in-memory DO state (lost on eviction)
5. No persistent security event log
