# Privacy Foundation

## Design Principles

1. **Cache classification**: Every query result is classified before caching
2. **Recipient isolation**: Gift-wrap queries enforce recipient-only access
3. **Auth-scoped caching**: Private results include auth identity in cache keys
4. **No shared caches for private data**: Gift wraps never enter global cache
5. **Identity-aware rate limiting**: Uses authenticated pubkey, not ephemeral keys

## Cache Scopes

| Scope | Sharing | Use Case |
|-------|---------|----------|
| PUBLIC | Global Cache API | Public notes, profiles |
| AUTH_SCOPED | Per-user cache | DMs, recipient-filtered queries |
| PRIVATE_NO_CACHE | Never cached | Gift wraps, sealed content |

## Gift-Wrap Privacy

Kind 1059 (NIP-59 gift wraps) receive special handling:

- Queries are always PRIVATE_NO_CACHE
- Auth identity used for rate limiting (not wrapper pubkey)
- Recipient-only access enforcement planned
- Never enters shared/global cache

## Future Protocol Privacy

Domain protocols built on this foundation inherit these guarantees:

- Cache isolation by default
- Identity-aware rate limiting
- Extension-level authorization hooks
- No cross-user data leakage through caching

## Data Minimization

- Ephemeral events (20000-29999) never stored
- Replaceable events keep only latest version
- Pruning removes oldest non-protected events first
- Protected kinds (0, 3, 10002) preserved for identity

## Logging Privacy

- No private keys in logs
- No auth signatures in logs
- No DM/gift-wrap plaintext in logs
- Pubkeys truncated to 8 chars in log context
