# OpenDating Roadmap

## Phase 1: Protocol Core ✅

- [x] Protocol envelope and versioning
- [x] NIP-59 transport
- [x] System service (ping, capabilities)
- [x] Service identity management
- [x] Request routing and validation
- [x] Idempotency

**Status**: COMPLETE (PROTOCOL-CORE-COMPLETE.md)

## Phase 2: Membership + Profile (Next)

- [ ] User membership model
- [ ] Dating profile schema (kind 30078)
- [ ] Profile CRUD service
- [ ] Profile visibility settings
- [ ] Profile validation

## Phase 3: Location + Discovery

- [ ] Location schema (geohash)
- [ ] Location update service
- [ ] Candidate discovery query
- [ ] Discovery preferences
- [ ] Distance-based filtering

## Phase 4: Private Likes + Matching

- [ ] Like intent schema
- [ ] Like service
- [ ] Mutual match detection
- [ ] Match notification
- [ ] Match state management

## Phase 5: Match-Only Messaging (NIP-17)

- [ ] Match-gated DM policy
- [ ] NIP-17 sealed direct messages
- [ ] DM policy service
- [ ] Message history

## Phase 6: Block + Unmatch

- [ ] Block schema
- [ ] Unmatch schema
- [ ] Block/unmatch service
- [ ] Enforcement in discovery and messaging

## Phase 7: Reporting + Moderation

- [ ] Report schema
- [ ] Moderation service
- [ ] Report queue
- [ ] Admin actions

## Phase 8: Deletion / Vanish

- [ ] Account deletion (NIP-62)
- [ ] Profile vanish
- [ ] Message vanish
- [ ] Data retention compliance

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
