# OpenDating Conformance Tests

## Test Coverage

| Suite | Tests | Coverage |
|-------|-------|----------|
| Protocol constants | 3 | Protocol ID, version, supported versions |
| Version negotiation | 4 | Accept, reject, negotiate |
| Envelope | 7 | Create, validate, reject invalid |
| Freshness | 3 | Fresh, expired, future |
| Full validation | 4 | Valid ping, unsupported version/type, short ID |
| Error codes | 2 | Required codes, uniqueness |
| Key generation | 4 | Valid keypairs, uniqueness, derivation |
| Service keys | 5 | Validate, reject, create |
| Hex utilities | 1 | Roundtrip |

## Running Tests

```bash
# All OpenDating tests
npm run opendating:test

# Conformance only
npm run opendating:test:conformance

# Full CI (foundation + opendating)
npm run ci
```

## What's Not Covered (yet)

- End-to-end NIP-59 encryption roundtrip (requires service keys)
- Full WebSocket integration (requires local relay)
- System ping end-to-end (requires running relay + service keys)
- Wrong authenticated sender test (requires multi-client setup)
- Replay test (requires D1 persistence)

These require a running relay instance with configured service keys.
They will be added as integration tests in a subsequent iteration.
