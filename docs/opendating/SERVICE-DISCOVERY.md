# OpenDating Service Discovery

## Current: NIP-11 + System Capabilities

### NIP-11 Advertisement

The relay's info document includes:

```json
{
  "opendating": {
    "versions": ["0.1"],
    "services": {
      "system": { "pubkey": "<hex>" }
    }
  }
}
```

Clients fetch this with an HTTP GET to the relay URL with `Accept: application/nostr+json`.

### Runtime: system.capabilities

For runtime discovery, clients send:

```json
{
  "protocol": "opendating",
  "version": "0.1",
  "type": "system.capabilities",
  "request_id": "...",
  "created_at": ...,
  "payload": {}
}
```

Response:

```json
{
  "protocol": "opendating",
  "version": "0.1",
  "type": "system.capabilities.result",
  "request_id": "...",
  "created_at": ...,
  "payload": {
    "versions": ["0.1"],
    "services": [
      {
        "role": "system",
        "pubkey": "<hex>",
        "supported_types": ["system.ping", "system.capabilities"]
      }
    ],
    "features": [
      "private-service-requests",
      "nip42-required",
      "nip59-transport"
    ]
  }
}
```

## Future: Nostr-Native Service Manifest

Long-term goal: services discoverable through Nostr itself.

A service provider could publish a kind 30078 (or similar) event:

```json
{
  "kind": 30078,
  "tags": [["d", "opendating-service:matcher"]],
  "content": "{\"role\":\"matcher\",\"pubkey\":\"<hex>\",\"versions\":[\"0.1\"]}"
}
```

This would allow:
- Multiple providers for the same service role
- Independent deployment of services
- Discovery without relay operator configuration

**Not implemented in V0.1.**
