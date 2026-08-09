# opendating-protocol 0.1.1

Protocol wire version remains `0.1`. Package 0.1.1 is a backward-compatible contract repair.

## Changes

- Adds `deletion` to `OpenDatingServiceRole` and `ALL_SERVICE_ROLES`.
- Publishes `REQUEST_ROUTES` and `getRequestRoute()` with the service role and expected result type for every v0.1 request.
- Binds `account.delete` to the `deletion` role and `account.delete.result`.
- Corrects `block.remove` and `unmatch.create` routing to `dm_policy`.
- Implements idempotent `block.remove` in the reference service.
- Advertises `account.delete` and `block.remove` in service capability metadata.

## Publication gate

The package builds and the full backend suite passes. Registry publication requires an authenticated npm session and must be followed by a mobile lockfile update to the exact `0.1.1` artifact.
