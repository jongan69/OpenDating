# OpenDating Privacy

## What the Relay Can See

When Alice sends an OpenDating request through the relay:

| Visible | Hidden |
|---------|--------|
| NIP-42 authenticated connection identity | Inner message sender (unless matched to auth) |
| Outer gift wrap kind (1059) | Inner rumor kind (78) |
| Recipient service pubkey (`p` tag) | Message type (`system.ping`, etc.) |
| Ephemeral wrapper pubkey | Decrypted payload |
| Event timing (created_at) | Request metadata (location, preferences, etc.) |
| Event size (ciphertext length) | Application data |

## What NIP-59 Does Hide

- Other relay users cannot read the gift wrap content
- The relay operator cannot read encrypted payloads without service keys
- The outer ephemeral pubkey does not reveal the sender

## What NIP-59 Does NOT Hide

- The relay operator knows WHICH service a user talks to
- Timing correlation is possible
- Ciphertext sizes may reveal usage patterns
- The relay operator (who controls service keys) can decrypt service-bound requests

## Per-Service Privacy

### System Service

- Requests: `system.ping` (empty payload), `system.capabilities` (empty payload)
- No personal data in payloads
- No persistent storage beyond idempotency records

### Future Services

- Profile data encrypted end-to-end
- Location data encrypted (not in Nostr tags)
- Like/match intents hidden from relay
- Messages encrypted via NIP-17

## Comparison: Traditional Dating App

| | Traditional App | OpenDating |
|---|----------------|------------|
| Server sees profiles | Yes | No (encrypted) |
| Server sees likes | Yes | No (encrypted) |
| Server sees messages | Yes | No (NIP-17) |
| Server sees location | Yes | No (encrypted) |
| Server knows who you viewed | Yes | No |
| Relay sees service identity | N/A | Yes |

## Logging Privacy

- Pubkeys truncated to 8 chars in logs
- Request IDs logged for correlation (not linkable to identity)
- Decrypted payloads never logged
- Service private keys never logged
