# Backend Handoff — OpenDating Relay

**Purpose:** everything the backend still needs so the mobile app can be
finished independently. Work only in this repository
(`/Users/jonathangan/LocalCode/OpenDating`). Do not modify the mobile app —
its contract is fixed and documented below.

---

## Where things stand

The relay is deployed and **the core protocol works end to end in
production**, verified against the live worker on 2026-08-07:

| Flow | Status |
|---|---|
| NIP-42 auth | ✅ |
| `profile.create` / `update` / `get` | ✅ |
| `discovery.update_location` / `update_preferences` | ✅ |
| `discovery.get_candidates` → real pubkeys, profile content, grants | ✅ |
| `intent.like` → `match_created: true`, `match.list` | ✅ |
| NIP-17 direct messages, correct sender attribution | ✅ |
| Blossom media endpoints (auth enforced, R2 bucket live) | ✅ routes only |
| Workers AI moderation blocking abusive bios | ✅ blocks correctly |

Three protocol defects were found and fixed by live testing (see
`git log`): OpenDating was never initialised in the Durable Object, service
responses were persisted but never broadcast, and candidate matching bound
four parameters to five placeholders.

**The one thing that must ship first:** commit `2ca3f52` fixes moderation
rejections never reaching the client. It is committed but **not deployed**.

---

## Your verification tool

`scripts/od-client.ts` is a scriptable member: it completes NIP-42 and drives
real service calls. Use it to verify every change. It is the fastest way to
prove something works, and it needs no device.

```bash
# Full flow: profile → location → preferences → candidates → like → matches
npx tsx scripts/od-client.ts verify --name Ava --age 27 --gender woman --geohash dr5ru

# Seed a member without running discovery (a viewer needs someone to find)
npx tsx scripts/od-client.ts seed --key <hex> --name Ben --age 31 --gender man --geohash dr5ru

# NIP-17 message delivery between two members
npx tsx scripts/od-client.ts dm --from <hex> --to <hex>

# Point at a local worker instead of production
OD_RELAY_WS=ws://localhost:8787 OD_RELAY_HTTP=http://localhost:8787 npx tsx scripts/od-client.ts verify
```

**Two members are required to test discovery.** A single account always sees
an empty deck — that is correct behaviour, not a bug. Both members need a
profile with an age, a location in the same geohash-5 cell, and preferences
that admit each other.

### Local development

```bash
npx tsx scripts/opendating-keys-generate.ts | grep '^OD_' > .dev.vars
echo "OD_ALLOW_DEV_KEYS=true" >> .dev.vars     # .dev.vars is git-ignored
npm run db:migrate:local
npx wrangler dev --port 8787 --local
```

**Gotcha that will cost you an hour:** the relay drops a `REQ` sent before
NIP-42 completes, silently. Subscribe only after the auth `OK`. A response
that never arrives looks identical to a service that never ran.

---

## Tasks, in order

### 1. Deploy the moderation rejection fix — BLOCKING

Commit `2ca3f52` is written and tested but not live. Without it, a member
whose bio is rejected sees a 30-second spinner then "request timed out", with
no idea what was wrong or that they should edit anything.

```bash
npm run ci && npm run deploy
```

**Verify:** submit a deliberately abusive bio and confirm the client receives
a `content_rejected` error rather than timing out.

---

### 2. Verify `candidate_grant` in `intent.like` — SECURITY

**Problem:** `src/protocols/opendating/services/matcher/service.ts` accepts
`target_pubkey` and ignores `candidate_grant` entirely (grep returns zero
occurrences). Anyone can like any pubkey they can name, without ever having
been shown that person.

This defeats the anti-enumeration design: grants exist precisely so that a
viewer can only act on people discovery chose to show them.

**Do:** in `handleLike`, look up `od_candidate_grants` for
`(viewer_id = <sender's member_id>, candidate_id = <target's member_id>)`,
confirm the row exists, is unexpired, and its `grant_token` equals the
submitted `candidate_grant`. Reject with `invalid_candidate_grant` otherwise —
that error code already maps to a user-facing message in the mobile client
("This profile is no longer available.").

**Verify:** `od-client.ts verify` should still match; a like with a forged or
absent grant should be rejected.

---

### 3. Fix the N+1 in candidate hydration — PERFORMANCE

**Problem:** `DiscoveryService.hydrate()` awaits two D1 reads per candidate —
`getPubkeyByMemberId` then `getProfileContentByMemberId` — sequentially. A
20-card page is 40 serialised round trips. This is the hottest path in the
product and will dominate discovery latency.

**Do:** fetch all granted members in one query joining `od_members` and
`od_profiles`, then decrypt in memory. Decryption is CPU-bound and fine to do
per row; the round trips are the cost.

**Verify:** a 20-candidate page should issue a single query. Compare wall time
before and after with the harness.

---

### 4. Implement discovery pagination — FUNCTIONAL GAP

**Problem:** `getCandidates` hardcodes `cursor: null`. The mobile client sends
a cursor and prefetches the next page when the deck runs low
(`src/features/discovery/use-discovery.ts`), so today it can never page past
the first batch — the deck simply ends.

**Do:** return an opaque cursor encoding the last position, and accept it to
resume. The `od_seen_candidates` ledger already prevents repeats, so the
cursor only needs to page within a session's grants.

**Verify:** request two pages and confirm the second returns different people
and a usable cursor.

---

### 5. Enforce the daily like quota — FUNCTIONAL GAP

**Problem:** `od_discovery_quotas.daily_likes_sent` exists and the housekeeper
resets it, but nothing ever increments it. Only `daily_candidates_served` is
enforced. Likes are effectively unlimited.

**Do:** increment on each successful `intent.like` and reject over the cap
with `rate_limited` (already mapped client-side to "You've reached your daily
like limit. Come back tomorrow!").

---

### 6. Add DB-backed service tests — HIGHEST-VALUE TEST WORK

**Problem:** 224 tests pass, but **no test ever constructs a service with a D1
handle.** The suite covers crypto, protocol shapes, and pure helpers. Every
line of SQL in `src/protocols/opendating/services/` is unexercised — which is
exactly how the five-placeholder bug reached production.

**Do:** add a D1 harness (`@miniflare/d1` or `better-sqlite3` behind the
`D1Database` interface), apply `migrations/run-all.sql`, and test at minimum:

- discovery excludes self, blocked members in both directions, already-granted
  and already-seen candidates
- grants are issued with tokens and the seen ledger is written
- geohash tiers widen p5 → p4 → p3 and stop at the distance preference
- quota exhaustion returns `discovery_quota_exhausted`
- `profile.update` rejects under-18 and persists encrypted content
- a mutual like creates exactly one match

This is the single most valuable thing on this list after task 1.

---

### 7. End-to-end photo upload — UNVERIFIED

**Problem:** the Blossom routes are live and enforce auth (verified: 401
unauthenticated, 404 for a missing blob), but **no authenticated upload has
ever been performed.** The signature verification, hash binding, and R2 write
path are untested against the real bucket.

**Do:** extend `od-client.ts` with an `upload` command that signs a kind-24242
authorization and PUTs a real image, then fetches it back and confirms the
bytes match. The mobile client's implementation is
`src/lib/opendating/media.ts` — mirror it.

---

### 8. Clean test data and rotate storage keys — BEFORE REAL USERS

Live testing created member records on production D1 under **known,
published private keys**:

| Name | Private key |
|---|---|
| Ava | `0x11…` (32 bytes of `0x11`) |
| Ben | `0x22…` |
| Cara | `0x33…` |
| Dana | `0x44…` (moderation-blocked) |

**Do:** delete those members and their dependent rows, then rotate
`OD_INDEX_KEY_V1` and `OD_DATA_KEY_V1`.

**Rotating those keys orphans every existing member row** — member IDs are
HMACs under the index key and stored pubkeys are AES-GCM under the data key.
That is fine now and impossible later, so do it before launch. Wipe the
OpenDating tables in the same pass.

---

## The mobile contract — do not change without coordinating

The app is built against these shapes. Changing them silently breaks it.

**`profile.update`** — content travels in the payload; the service stores it
encrypted at rest. It is *not* a Nostr event reference (migration 0011
replaced `profile_event_id` with `encrypted_profile_payload`).

```jsonc
{ "profile": { "display_name": "Ava", "age": 27, "gender": "woman",
               "bio": "…", "interests": ["…"], "relationship_intent": "long_term",
               "prompts": [{"question":"…","answer":"…"}],
               "photos": [{"id":"…","url":"https://…","order":0}], "v": "0.1" } }
```

**`discovery.get_candidates` result** — each candidate must carry a real
`pubkey`. A like is addressed to `target_pubkey` and a DM is NIP-44 encrypted
to that key, so a pseudonymous member id alone leaves the viewer unable to act
on anyone they are shown.

```jsonc
{ "candidates": [{ "pubkey": "<64 hex>",
                   "profile": { "display_name": "…", "age": 27, "…": "…" },
                   "distance_bucket": "nearby",
                   "candidate_grant": "<token>" }],
  "cursor": null, "remaining_today": 49 }
```

**Errors** use type `system.error` with `{ code, message }`. Codes already
mapped to user-facing copy live in the app's
`src/lib/opendating/errors.ts` — prefer an existing code over inventing one.

**Missing services degrade gracefully.** The app treats an unadvertised role as
"not available yet" and shows an "Almost ready" screen, so a partial rollout is
safe.

---

## Definition of done

- [ ] `2ca3f52` deployed; a rejected bio returns `content_rejected`, not a timeout
- [ ] A like without a valid grant is rejected
- [ ] A 20-candidate page issues one query, not forty
- [ ] Two pages of candidates can be fetched with a cursor
- [ ] The daily like cap is enforced
- [ ] Service SQL has test coverage against a real database
- [ ] A photo uploads, is fetched back, and the bytes match
- [ ] Test members removed and storage keys rotated
- [ ] `npm run ci` green (typecheck + build + tests)

---

## Known environment issue (blocks device testing, not the backend)

`~/Library/Android/sdk` is a symlink to `/Volumes/T9/DevTools/AndroidSDK`,
which is **exFAT**. macOS stores extended attributes there as `._*` AppleDouble
sidecars — 3,030 inside the CMake install. CMake globs
`Modules/Compiler/*.cmake`, hits `._ADSP-DetermineCompiler.cmake`, and tries to
parse a binary resource fork as a script. `react-native-worklets` and
`react-native-screens` both fail to configure, so **no native Android build
succeeds on this machine.**

```bash
dot_clean -m /Volumes/T9/DevTools/AndroidSDK
```

Safe — pure macOS metadata — but they regenerate whenever macOS writes to that
volume. Moving the SDK to the internal APFS disk is the durable fix. Note also
that the APKs in `android/app/build/outputs/` are stale and must not be used.
