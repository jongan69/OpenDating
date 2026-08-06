# EXPERIMENTAL — NOT A NIP

> This is an experimental protocol draft. It has NOT been submitted as a NIP.
> Do not assign a NIP number. Do not cite as a standard.

## Title: Private Service Request Transport over Nostr

## Abstract

A protocol for private, encrypted application-layer service requests
transported over Nostr using NIP-59 gift wraps. Enables domain-specific
protocols (dating, marketplaces, governance) to operate as Nostr
application protocols without modifying relay infrastructure.

## Motivation

Nostr relays provide generic event storage and retrieval. Application-layer
protocols (dating, marketplaces, etc.) currently implement their logic
client-side or through separate HTTP APIs. This creates fragmentation and
prevents Nostr-native application experiences.

By defining a standard envelope for private service requests transported
via NIP-59 gift wraps, applications can:

1. Keep all communication on Nostr
2. Preserve metadata privacy via gift wraps
3. Work with any NIP-42/NIP-59 compliant relay
4. Add domain logic without relay modifications

## Specification

### Protocol Identifier

The protocol identifier is `opendating`. Other protocols would use their
own identifiers (e.g., `marketplace`, `governance`).

### Envelope

```json
{
  "protocol": "<protocol-id>",
  "version": "<semver>",
  "type": "<dot.notation.type>",
  "request_id": "<random>",
  "created_at": <unix-seconds>,
  "payload": {}
}
```

### Transport

Requests use NIP-59 gift wraps (kind 1059) with inner kind 78 application rumors.

The relay sees only:
- The outer gift wrap kind 1059 event
- The recipient service pubkey (in the `p` tag)

All application data is inside the encrypted layers.

### Service Identities

Services are Nostr keypairs. The public key is the service identity.
Services sign responses. Clients verify service identities.

### Versioning

Services advertise supported versions. Clients negotiate the highest
mutually supported version. `0.x` is experimental.

### Idempotency

`request_id` provides idempotency. Duplicate request IDs are not reprocessed.

### Auth Binding

The NIP-42 authenticated connection identity MUST match the verified
inner message sender, unless a delegation standard is used.

## Unreserved Questions

- Delegation: should service requests support NIP-26 delegation?
- Batching: should multiple requests be combinable in one gift wrap?
- Streaming: should services support streaming responses?
- Federation: how do services from different providers interoperate?

## Implementations

- Reference: Nosflare OpenDating extension (TypeScript, Cloudflare Workers)
- See docs/opendating/ for full specification
