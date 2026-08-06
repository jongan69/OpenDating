# Future Protocols

This directory will contain domain-specific Nostr protocol implementations
that plug into the generic relay infrastructure via the extension registry.

## How to add a protocol

1. Create a subdirectory: `src/future-protocols/<your-protocol>/`
2. Implement the `RelayExtension` interface from `src/relay/policy/interface.ts`
3. Register your extension with `extensionRegistry.register(...)` at startup
4. Add domain-specific event kinds, policies, and storage adapters

## Current protocols

None yet. The generic Nostr relay infrastructure is complete and ready for
domain-specific protocols to be layered on top.

### Planned: OpenDating

The OpenDating protocol will eventually live at:
  `src/future-protocols/opendating/`

It will implement:
- Dating profiles
- Discovery/matching
- Private messaging policies
- Moderation and blocking
- Verification claims

Without modifying the generic Nostr relay core.
