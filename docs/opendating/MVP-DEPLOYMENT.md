# OpenDating MVP Deployment Runbook

How to take the relay from "advertises `system` only" to a working
end-to-end dating service. Follow the steps in order — each one is
verifiable before you move on.

> **Status before this work:** the relay advertised a single service, so the
> mobile app could connect and do nothing else. All seven services were
> implemented but no identity was ever loaded for six of them, and the
> discovery service was written against three tables that migration 0011
> deleted.

---

## 1. Generate secrets

```bash
npx tsx scripts/opendating-keys-generate.ts > /tmp/od-secrets.env
```

This produces nine secrets: seven service signing keys plus the two storage
keys. **Do not commit the output.** Delete `/tmp/od-secrets.env` once loaded.

### The two storage keys matter more than the service keys

| Secret | Protects | Consequence of rotating |
|---|---|---|
| `OD_INDEX_KEY_V1` | Pseudonymous member IDs (HMAC) | Every existing member row is orphaned |
| `OD_DATA_KEY_V1` | Pubkeys and profile content at rest (AES-GCM) | Existing rows become unreadable |

Set them **once**, before the first real member signs up.

Until this change these two keys were hardcoded development constants in a
public repository, despite comments and `STORAGE-PRIVACY-AUDIT.md` claiming
they came from Worker secrets. Anyone could therefore reverse a member ID or
decrypt the `encrypted_pubkey` column. The protocol now refuses to start
without them.

---

## 2. Load secrets into Cloudflare

```bash
npx tsx scripts/opendating-keys-generate.ts --commands
```

That prints a `wrangler secret put` line per secret with the value beneath it.
Run each and paste when prompted.

Verify:

```bash
npx wrangler secret list
```

Expect all nine. A missing service key means that service silently does not
load; a missing storage key means the protocol refuses to start at all (by
design — check the deploy logs for `Refusing to start`).

---

## 3. Apply migrations

```bash
npm run db:migrate:remote
```

`migrations/run-all.sql` is generated and concatenates every migration in
order. It was referenced by both migrate scripts but did not exist, so this
command previously failed outright.

Migration `0012_discovery_runtime.sql` adds what discovery needs at runtime:
`od_discovery_quotas` (dropped by 0011 with no replacement),
`od_discovery_prefs` (the viewer's own filters, distinct from
`od_visibility_prefs`), `od_seen_candidates`, and a rebuilt
`od_candidate_grants` carrying a grant token.

> After adding a migration, regenerate the bundle:
> ```bash
> for f in migrations/0*.sql; do echo "-- $(basename $f)"; cat $f; echo; done > migrations/run-all.sql
> ```

---

## 4. Deploy

```bash
npm run ci && npm run deploy
```

---

## 5. Verify

```bash
curl -H "Accept: application/nostr+json" \
  https://opendating-relay.jonathang132298.workers.dev | jq .opendating
```

Expect all seven roles rather than only `system`:

```json
{
  "versions": ["0.1"],
  "services": {
    "system": { "pubkey": "..." },
    "profile": { "pubkey": "..." },
    "discovery": { "pubkey": "..." },
    "matcher": { "pubkey": "..." },
    "dm_policy": { "pubkey": "..." },
    "moderation": { "pubkey": "..." },
    "deletion": { "pubkey": "..." }
  }
}
```

The mobile client treats a missing role as "not available yet" and shows an
"Almost ready" screen, so a partial rollout degrades cleanly.

---

## 6. Smoke test with two accounts

Discovery only returns people who are mutually eligible, so a single account
will always see an empty deck. Onboard **two** accounts with:

- profiles saved (name + age, since age is required to be indexed),
- location granted (both in the same geohash-5 cell),
- preferences that admit each other (age range and gender).

Then verify: each sees the other, a mutual like creates a match, and a
message arrives.

---

## Known gaps before App Store submission

| Gap | Impact | Notes |
|---|---|---|
| **No photo hosting** | Profiles are text-only | No `media` service exists. Local `file://` URIs are kept device-side and stripped before publish. Needs R2/Images or a Blossom/NIP-96 server. |
| **No DB-backed service tests** | Regressions land silently | The suite covers crypto, protocol, and pure logic. No test ever constructs a service with a D1 handle, so no SQL in `src/protocols/opendating/services/` is exercised. Highest-value next test work. |
| **Content moderation** | App Review Guideline 1.2 | Report and block exist. Still needed: content removal, a published abuse contact, and a 24-hour response commitment. |
| **Cron disabled** | Grants and quotas never prune | `wrangler.toml` has the trigger commented out (free-plan limit). Grants expire logically but rows accumulate. |
| **`intent.like` does not verify the grant** | Anyone can like any pubkey | The matcher accepts `target_pubkey` without checking `candidate_grant` against `od_candidate_grants`. Closing this is a small change and worth doing before launch. |

---

## Rollback

Secrets and schema are additive; the previous worker can be restored with:

```bash
npx wrangler rollback
```

Removing a service secret and redeploying takes that role out of the
advertisement, and clients degrade to "not available yet" rather than erroring.
