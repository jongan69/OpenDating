# OpenDating Protocol Core — Complete

> Date: 2026-08-06
> TypeScript: 0 errors | Build: 308KB | Tests: 123 passed

## Implemented Services

| Service | Role | Message Types | Status |
|---------|------|--------------|--------|
| System | `system` | ping, pong, capabilities, capabilities.result | ✅ |
| Profile | `profile` | create, update, get, pause, resume, delete + results | ✅ |
| Discovery | `discovery` | update_location, get_candidates, update_preferences + results | ✅ |
| Matcher | `matcher` | intent.like, intent.revoke, match.list + results | ✅ |
| Block | `dm_policy` | block.create, block.list, unmatch.create + results | ✅ |
| Moderation | `moderation` | report.create, moderation.action + results | ✅ |

## Database Schema

| Migration | Tables |
|-----------|--------|
| 0005 | `od_idempotency` |
| 0006 | `od_members`, `od_profiles`, `od_profile_media` |
| 0007 | `od_locations`, `od_discovery_prefs`, `od_candidate_grants`, `od_discovery_quotas` |
| 0008 | `od_intents`, `od_matches`, `od_match_notifications` |
| 0009 | `od_blocks`, `od_unmatches` |
| 0010 | `od_reports`, `od_moderation_actions`, `od_moderators`, `od_sanctions` |

## Security Properties

- NIP-44 v2 compliant encryption (ChaCha20 + HMAC-SHA256, verified against official vectors)
- NIP-59 compliant gift wraps (unsigned rumors, randomized timestamps)
- NIP-42 identity bound to NIP-59 sender
- Pseudonymous member IDs (SHA-256 hash, not raw pubkeys)
- Profile enumeration impossible (no list/getAll endpoints)
- One-way likes invisible to target (only mutual matches revealed)
- Coarse geohash only (no exact GPS stored)
- Daily discovery quotas prevent scraping
- Block enforcement server-side
- Moderator RBAC (no DM browsing)
- Idempotency prevents double execution
- Decrypted payloads never logged

## Known Limitations

- Discovery matching algorithm uses simple grant system (will be enhanced in future)
- No NIP-17 sealed-DM enforcement yet (block enforcement covers the critical path)
- Verification service not yet implemented
- No federation/multi-provider support
- Candidate grants need a background refresh process

## Next Steps

Phase 2+ features (verification, vanish, federation, safety hardening) build on this foundation.
No changes to generic relay infrastructure needed for any of them.
