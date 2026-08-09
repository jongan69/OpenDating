# OpenDating Roadmap

## Phase 1: Protocol Core ✅

- [x] Protocol envelope and versioning
- [x] NIP-59 transport
- [x] System service (ping, capabilities)
- [x] Service identity management
- [x] Request routing and validation
- [x] Idempotency

**Status**: COMPLETE (PROTOCOL-CORE-COMPLETE.md)

> This file tracks protocol implementation, not production readiness. The current backend is a tested beta baseline and still requires the security, trust-and-safety, legal, reliability, and marketplace gates documented in the mobile repository's `docs/RELEASE-STATUS.md`.

## Phase 2: Membership + Profile ✅ baseline

- [x] User membership model
- [x] Dating profile schema
- [x] Profile CRUD service
- [x] Profile visibility settings
- [x] Profile validation

## Phase 3: Location + Discovery ✅ baseline

- [x] Location schema (geohash)
- [x] Location update service
- [x] Candidate discovery query
- [x] Discovery preferences
- [x] Distance-based filtering

## Phase 4: Private Likes + Matching ✅ baseline

- [x] Like intent schema
- [x] Like service
- [x] Mutual match detection
- [x] Match notification event
- [x] Match state management

## Phase 5: Match-Only Messaging (NIP-17) ⚠️ transport baseline

- [x] Match-gated DM policy
- [x] NIP-17 sealed direct messages
- [x] DM policy service
- [ ] Durable 90-day delivery history and client cursor synchronization

## Phase 6: Block + Unmatch ✅ backend baseline

- [x] Block schema
- [x] Unmatch schema
- [x] Block/unmatch service, including idempotent removal
- [x] Server enforcement in discovery and messaging
- [ ] Global encrypted client persistence and inbound pre-render enforcement

## Phase 7: Reporting + Moderation ⚠️ operations incomplete

- [x] Report schema
- [x] Moderation service baseline
- [x] Report queue baseline
- [x] Admin action protocol
- [ ] Production console, appeals, audit access, vendor moderation, and staffed SLAs

## Phase 8: Deletion / Vanish ⚠️ 0.1.1 contract fixed

- [x] Account deletion service and dedicated advertised role
- [x] Profile/discovery relationship cascade and vanish tombstone
- [ ] Delivery-event and object-storage cascade verification
- [ ] Legal retention policy and 24-hour receipt/SLA

## Phase 9: Verification

- [ ] Verification claim schema
- [ ] Verification service
- [ ] Photo verification
- [ ] Identity verification

## Phase 10: Federation

- [ ] Service manifest standard
- [ ] Cross-provider service discovery
- [ ] Independent service deployment
- [ ] Multi-relay interoperability
