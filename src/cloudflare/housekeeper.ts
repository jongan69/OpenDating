/**
 * Cloudflare Housekeeper — DO Alarm-Based Scheduled Maintenance
 *
 * Replaces the disabled cron trigger (free plan limit) by extending the
 * existing Durable Object alarm infrastructure. The RelayWebSocket DO already
 * schedules alarms for idle cleanup; this module adds DB maintenance tasks
 * that run periodically on the same alarm cycle.
 *
 * Every ~5 minutes (when the DO alarm fires), this runs a lightweight
 * maintenance tick:
 *   1. Prune expired candidate grants (od_candidate_grants)
 *   2. Prune expired idempotency records (od_idempotency)
 *   3. Reset daily discovery quotas past their reset window
 *   4. Purge stale seen-candidate ledger entries
 *
 * All operations are batched and throttled — they won't contend with
 * production traffic. Each tick targets ~100ms of D1 work max.
 */

const MAINTENANCE_BATCH_SIZE = 200;
/** Only run maintenance this often (ms). Alarm fires every ~5min but we
 *  don't need to prune every cycle. */
const MAINTENANCE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
let lastMaintenanceAt = 0;

export interface HousekeeperCounts {
  grantsPruned: number;
  idempotencyPruned: number;
  quotasReset: number;
  seenPurged: number;
}

/**
 * Run one maintenance tick. Safe to call from the DO alarm handler or from
 * the worker fetch path as a fire-and-forget.
 *
 * Returns counts so callers can log, but the promise is designed to be
 * used with ctx.waitUntil() when called from a request handler.
 */
export async function runHousekeeperTick(db: D1Database): Promise<HousekeeperCounts> {
  const now = Date.now();
  if (now - lastMaintenanceAt < MAINTENANCE_INTERVAL_MS) {
    return { grantsPruned: 0, idempotencyPruned: 0, quotasReset: 0, seenPurged: 0 };
  }
  lastMaintenanceAt = now;

  const counts: HousekeeperCounts = { grantsPruned: 0, idempotencyPruned: 0, quotasReset: 0, seenPurged: 0 };

  try {
    // 1. Prune expired candidate grants
    counts.grantsPruned = await pruneExpiredGrants(db);
    // 2. Prune expired idempotency records
    counts.idempotencyPruned = await pruneExpiredIdempotency(db);
    // 3. Reset daily discovery quotas
    counts.quotasReset = await resetDailyQuotas(db);
    // 4. Purge stale seen candidates (> 7 days)
    counts.seenPurged = await purgeStaleSeenCandidates(db);

    if (counts.grantsPruned + counts.idempotencyPruned + counts.quotasReset + counts.seenPurged > 0) {
      console.log(`[housekeeper] pruned grants=${counts.grantsPruned} idem=${counts.idempotencyPruned} quotas=${counts.quotasReset} seen=${counts.seenPurged}`);
    }
  } catch (err) {
    console.error('[housekeeper] tick failed:', err);
  }

  return counts;
}

async function pruneExpiredGrants(db: D1Database): Promise<number> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const result = await db.prepare(
      `DELETE FROM od_candidate_grants WHERE expires_at IS NOT NULL AND expires_at < ? LIMIT ?`
    ).bind(now, MAINTENANCE_BATCH_SIZE).run();
    return result.meta.changes;
  } catch {
    return 0; // Table may not exist yet
  }
}

async function pruneExpiredIdempotency(db: D1Database): Promise<number> {
  try {
    const result = await db.prepare(
      `DELETE FROM od_idempotency WHERE expires_at < ? LIMIT ?`
    ).bind(Math.floor(Date.now() / 1000), MAINTENANCE_BATCH_SIZE).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}

async function resetDailyQuotas(db: D1Database): Promise<number> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const result = await db.prepare(
      `UPDATE od_discovery_quotas
          SET daily_candidates_served = 0,
              daily_likes_sent = 0,
              daily_reset_at = ?,
              updated_at = ?
        WHERE daily_reset_at < ?`
    ).bind(now + 86400, now, now).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}

async function purgeStaleSeenCandidates(db: D1Database): Promise<number> {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - 7 * 86400; // 7 days
    const result = await db.prepare(
      `DELETE FROM od_seen_candidates WHERE seen_at < ? LIMIT ?`
    ).bind(cutoff, MAINTENANCE_BATCH_SIZE).run();
    return result.meta.changes;
  } catch {
    return 0;
  }
}
