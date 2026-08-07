# OpenDating Storage Privacy Audit v0.1

> Generated: 2026-08-06 | Schema v11 | Tests: 168

## Audit Methodology

Every data type stored by the reference implementation is classified by:
- **Privacy class** (P0-P4 per PRD §7)
- **Storage location** (D1 table, R2, in-memory)
- **Encryption status** (plaintext, AES-GCM, NIP-44, HMAC)
- **Retention policy**
- **Access control** (who can read it)

## Data Inventory

### od_members
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `member_id` | P2 | HMAC-SHA256 (keyed) | Services (via derivation) |
| `encrypted_pubkey` | P2 | AES-GCM (OD_DATA_KEY_V1) | Services (via decryption) |
| `status` | P2 | Plaintext | Services |
| `trust_tier` | P2 | Plaintext | Services |
| `last_active_bucket` | P2 | Plaintext | Services (coarse only) |
| `protocol_version` | P0 | Plaintext | Anyone with D1 access |

**Verification**: No plaintext pubkey stored. Member ID not reversible without OD_INDEX_KEY.
**Test**: `membership.test.ts` — HMAC-SHA256 ID ≠ SHA256(pubkey)

### od_profiles
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `member_id` | P2 | HMAC-SHA256 | Services |
| `encrypted_profile_payload` | P1 | NIP-44 + AES-GCM | Profile service |
| `age` | P1 | Plaintext (normalized) | Discovery service |
| `gender_category` | P1 | Plaintext (normalized) | Discovery service |
| `relationship_intent` | P1 | Plaintext (normalized) | Discovery service |
| `visibility_state` | P1 | Plaintext | Discovery service |
| `completeness` | P1 | Plaintext | Discovery service |

**Verification**: Full profile content is encrypted. Only normalized filtering fields are queryable.
**Test**: No global profile enumeration endpoint exists.

### od_discovery_index
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `member_id` | P2 | HMAC-SHA256 | Discovery service |
| `geo_cell_p5` | P2 | Plaintext | Discovery service |
| `geo_cell_p4` | P2 | Plaintext | Discovery service |
| `geo_cell_p3` | P2 | Plaintext | Discovery service |
| `age` | P1 | Plaintext | Discovery service |
| `gender_category` | P1 | Plaintext | Discovery service |
| `visible` | P1 | Plaintext | Discovery service |

**CRITICAL VERIFICATION**: No latitude/longitude stored. Maximum geohash precision: 5 (~5km). Exact coordinates never leave the device.
**Test**: `e2e/three-user.test.ts` — served distance is coarse buckets only.

### od_intents (Likes)
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `intent_id` | P2 | SHA-256 (deterministic from pubkeys) | Matcher service |
| `from_member_id` | P2 | HMAC-SHA256 | Matcher service |
| `to_member_id` | P2 | HMAC-SHA256 | Matcher service |
| `state` | P2 | Plaintext | Matcher service |
| `created_at` | P2 | Plaintext | Matcher service |

**VERIFICATION**: One-way likes never visible to target. No `intent.list` endpoint. Reciprocity detection happens server-side.
**Test**: `e2e/three-user.test.ts` — Alice likes Bob, Bob learns nothing.

### od_matches
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `match_id` | P2 | SHA-256 (deterministic) | Matcher service |
| `member_a`, `member_b` | P2 | HMAC-SHA256 | Matcher service |
| `state` | P2 | Plaintext | Matcher service |

### od_blocks
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `blocker_member_id` | P2 | HMAC-SHA256 | Block service |
| `blocked_member_id` | P2 | HMAC-SHA256 | Block service |

**VERIFICATION**: Block graph never publicly exposed. Only queryable by the blocker (via `block.list`).
**Test**: `e2e/three-user.test.ts` — block graph is private.

### od_reports
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `report_id` | P4 | SHA-256 | Moderation service |
| `reporter_member_id` | P4 | HMAC-SHA256 | Moderation service |
| `subject_member_id` | P4 | HMAC-SHA256 | Moderation service |
| `description_encrypted` | P4 | AES-GCM (OD_MODERATION_KEY) | Moderators |
| `evidence_event_ids` | P4 | Plaintext (JSON array) | Moderators |

**VERIFICATION**: Reports never publicly exposed. No `report.list` endpoint for non-moderators.
**Test**: `e2e/three-user.test.ts` — reports are private.

### od_report_evidence
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `r2_object_key` | P4 | Separate key domain | Moderators |
| `sha256` | P4 | Plaintext | Moderators |

**VERIFICATION**: Evidence encrypted at rest with OD_MODERATION_KEY. Separate key domain from dating data.

### od_moderation_actions
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| All fields | P4 | Plaintext | Moderators (append-only) |

**VERIFICATION**: Moderator cannot edit past actions. Audit log tracks all changes.

### od_vanish_tombstones
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `member_id` | P2 | HMAC-SHA256 | Deletion service |
| `cutoff_timestamp` | P2 | Plaintext | Relay |

**VERIFICATION**: Prevents stale event reingestion after vanish.

### od_audit_log
| Field | Privacy Class | Encryption | Who Can Access |
|-------|-------------|------------|----------------|
| `actor_pubkey` | P4 | Plaintext | Administrators |
| `action`, `resource_type`, `resource_id` | P4 | Plaintext | Administrators |
| `before_state`, `after_state` | P4 | Plaintext | Administrators |
| `metadata_redacted` | P4 | Redacted | Administrators |

## Data NOT Stored (Verified by Audit)

| Data Type | Stored? | Evidence |
|-----------|---------|----------|
| Exact latitude | ❌ No | No lat/lng columns in any table |
| Exact longitude | ❌ No | No lat/lng columns in any table |
| User nsec/private key | ❌ No | No private key storage path |
| NIP-17 plaintext | ❌ No | DMs stored as encrypted gift wraps in relay; service never decrypts |
| Public one-way like | ❌ No | od_intents not publicly queryable |
| Public block graph | ❌ No | od_blocks only queryable by blocker |
| Public report contents | ❌ No | od_reports only accessible by moderators |
| Plaintext pubkey (members) | ❌ No | encrypted_pubkey uses AES-GCM |
| Raw DOB | ❌ No | Only age integer stored, not birthdate |

## Encryption Key Architecture

| Key | Purpose | Storage | Rotation |
|-----|---------|---------|----------|
| OD_INDEX_KEY_V1 | Member ID HMAC | Worker Secret | Key-versioned |
| OD_DATA_KEY_V1 | Pubkey + profile encryption | Worker Secret | Key-versioned |
| OD_MODERATION_KEY_V1 | Moderation evidence encryption | Worker Secret | Key-versioned |
| OD_MEDIA_TOKEN_KEY_V1 | Media auth tokens | Worker Secret | Key-versioned |
| Service private keys | Signing + decryption | Worker Secret | Per-role |

No encryption key exists in Git, source code, or D1.

## Retention Summary

| Data | Retention |
|------|-----------|
| Current profile | While active |
| Old profile versions | Removed on replacement |
| Location history | None (current cell only) |
| Pending likes | 90 days |
| Client passes | Not server-persisted |
| Unmatched state | Minimal tombstone |
| Service command gift wraps | Deleted shortly after processing |
| DM gift wraps | Configurable rolling retention |
| Closed report evidence | Bounded safety retention |
| Deleted media | Removed promptly |
