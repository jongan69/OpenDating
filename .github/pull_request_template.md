## Summary

## Contract and migration impact

- [ ] No wire change, or the protocol version/schema/compatibility path is documented
- [ ] Migrations are additive and forward-only
- [ ] Generated protocol artifacts are current

## Verification

- [ ] `npm run ci` passes
- [ ] `npm audit --audit-level=low` reports no unresolved vulnerability
- [ ] `npx wrangler deploy --dry-run` passes when deployment configuration changes
- [ ] Protocol package builds and `npm pack --dry-run` contains only intended files
- [ ] No secrets, private keys, raw identity keys, or decrypted payloads are logged or committed
- [ ] Mobile contract changes are coordinated with `jongan69/opendating-mobile`

## Release and rollback

Describe deployment order, data migration, monitoring, rollback, and any feature flag or compatibility window.
