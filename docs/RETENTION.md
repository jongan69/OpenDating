# Retention Policy

## Event Classification

| Category | Kinds | Retention |
|----------|-------|-----------|
| **Protected** | 0, 3, 10002 | Never pruned (identity/config) |
| **Normal** | 1, 5-9999, etc. | Pruned oldest-first when DB exceeds threshold |
| **Replaceable** | 0, 3, 10000-19999 | Only latest version kept |
| **Parameterized Replaceable** | 30000-39999 | Only latest version per (kind, pubkey, d-tag) |
| **Ephemeral** | 20000-29999 | Never stored (broadcast only) |

## Pruning

- **Trigger**: Daily cron job at 00:00 UTC
- **Free tier threshold**: 4.0 GB → prunes to 3.5 GB
- **Paid tier threshold**: 9.0 GB → prunes to 8.0 GB
- **Batch size**: 1000 events per batch
- **Max per run**: 100,000 events
- **Protected kinds**: Never pruned

## Configuration

All pruning settings are in `src/config.ts`:

```ts
DB_PRUNING_ENABLED = true
DB_SIZE_THRESHOLD_GB = 4.0  // Free tier
DB_PRUNE_TARGET_GB = 3.5    // Free tier
DB_PRUNE_BATCH_SIZE = 1000
pruneProtectedKinds = [0, 3, 10002]
```

## Manual Intervention

To manually prune:

```sql
-- Find oldest non-protected events
SELECT id, created_at FROM events
WHERE kind NOT IN (0, 3, 10002)
ORDER BY created_at ASC
LIMIT 1000;

-- Delete specific events
DELETE FROM events WHERE id IN (...);
```
