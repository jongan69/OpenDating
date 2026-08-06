# OpenDating Security

## Identity Binding

NIP-42 authenticated connection pubkey MUST equal the NIP-59 inner message sender pubkey.

This prevents a client from authenticating as Alice while submitting commands
cryptographically authored by Bob.

Rejection code: `sender_auth_mismatch`

## Service Identity Trust

- Service public keys are configured by the relay operator
- Service private keys are Cloudflare Worker secrets (never in source/D1/logs)
- Clients verify response signatures against advertised service pubkeys
- Service key compromise requires operator rotation

## Request Replay Protection

- Every request has a cryptographically random `request_id`
- Idempotency table prevents double execution
- Records expire after 24 hours (bounded storage)
- Request freshness limits further reduce replay window (5 min)

## Gift-Wrap Privacy

- NIP-59 transport: relay sees only outer gift-wrap metadata
- Relay sees: recipient service pubkey (in `p` tag)
- Relay does NOT see: sender identity, message type, payload
- Response encrypted to user (relay cannot read service responses)

## Encryption

- NIP-44: ChaCha20-Poly1305 with ECDH key exchange (secp256k1)
- Service responses signed by service identity
- Ephemeral wrapper keys for each gift wrap

## Known Metadata Leaks

- Relay operator can see WHICH service a user is communicating with
- Relay operator can see WHEN requests are made (timing)
- Relay operator can see gift-wrap sizes (correlation possible)
- NIP-59 does NOT provide perfect metadata privacy

## Logging

- Never: private keys, decrypted payloads, NIP-44 key material
- Allowed: request_id (correlation), service role, message type, result, duration
- Pubkeys truncated to 8 chars in logs for pseudonymity

## Service Isolation

- Each service role has independent authorization
- System service requires only valid auth (no membership check yet)
- Future services will add: membership, match state, moderator role
- One service failure must not crash other services or the generic relay
