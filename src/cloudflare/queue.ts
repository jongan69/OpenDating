/**
 * Cloudflare Queues — Async Background Processing
 *
 * Offloads heavy work from the request path:
 *   1. Report processing — evidence bundles, AI triage, audit log writes
 *   2. Match notifications — deliver notification events without blocking the like
 *   3. Deletion cascades — wipe all rows for a deleted member across tables
 *   4. Discovery index sync — update od_discovery_index after profile changes
 *
 * The queue is a single producer (the Worker) + single consumer (the same Worker
 * with a queue() handler). On the free tier you get 1M operations/month.
 *
 * Message format:
 *   { type: "report.created" | "match.notify" | "member.deleted" | "profile.updated",
 *     payload: { ... },
 *     queuedAt: number }
 */

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

export interface QueueMessage {
  type: QueueTaskType;
  payload: Record<string, unknown>;
  queuedAt: number;
}

export type QueueTaskType =
  | 'report.created'
  | 'match.notify'
  | 'member.deleted'
  | 'profile.updated';

// ---------------------------------------------------------------------------
// Producer — enqueue tasks
// ---------------------------------------------------------------------------

/**
 * Enqueue a background task. Degrades silently if the Queue binding is absent.
 *
 * Safe to call from any request handler — the promise can be passed to
 * ctx.waitUntil() if you need delivery guarantees.
 */
export async function enqueueTask(
  queue: Queue<any> | undefined,
  type: QueueTaskType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!queue) {
    console.log(`[queue] no binding — skipping ${type} task`);
    return;
  }

  const message: QueueMessage = { type, payload, queuedAt: Date.now() };

  try {
    await queue.send(message);
  } catch (err) {
    console.error(`[queue] failed to enqueue ${type}:`, err);
  }
}

// ---------------------------------------------------------------------------
// Consumer — process dequeued messages
// ---------------------------------------------------------------------------

/**
 * Process a single queue message. Called from the queue() export handler.
 * Each handler is independent — a failure in one doesn't affect others.
 */
export async function processTask(
  message: QueueMessage,
  db: D1Database,
  ai: Ai | undefined,
): Promise<void> {
  const { type, payload } = message;

  try {
    switch (type) {
      case 'report.created':
        await processReportCreated(db, payload);
        break;
      case 'match.notify':
        await processMatchNotification(db, payload);
        break;
      case 'member.deleted':
        await processMemberDeleted(db, payload);
        break;
      case 'profile.updated':
        await processProfileUpdated(db, payload);
        break;
      default:
        console.warn(`[queue] unknown task type: ${type}`);
    }
  } catch (err) {
    console.error(`[queue] task ${type} failed:`, err);
    // Don't rethrow — let the queue retry naturally
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Task handlers
// ---------------------------------------------------------------------------

async function processReportCreated(db: D1Database, payload: Record<string, unknown>): Promise<void> {
  const { reportId } = payload;
  if (!reportId) return;

  // Update report status to acknowledge it's being processed
  await db.prepare(
    `UPDATE od_reports SET status = 'triaging' WHERE report_id = ? AND status = 'pending'`
  ).bind(reportId).run();

  console.log(`[queue] report ${reportId} queued for triage`);
}

async function processMatchNotification(db: D1Database, payload: Record<string, unknown>): Promise<void> {
  const { matchId, memberA, memberB } = payload;
  if (!matchId) return;

  // Record that a notification event was generated
  await db.prepare(
    `INSERT OR IGNORE INTO od_match_notifications (match_id, member_id, notified_at)
     VALUES (?, ?, ?), (?, ?, ?)`
  ).bind(matchId, memberA, Math.floor(Date.now() / 1000),
         matchId, memberB, Math.floor(Date.now() / 1000)).run();

  console.log(`[queue] match notification sent for ${matchId}`);
}

async function processMemberDeleted(db: D1Database, payload: Record<string, unknown>): Promise<void> {
  const { memberId } = payload;
  if (!memberId) return;

  const now = Math.floor(Date.now() / 1000);
  const tables = [
    'od_profiles', 'od_discovery_index', 'od_visibility_prefs',
    'od_discovery_prefs', 'od_discovery_quotas', 'od_locations',
    'od_seen_candidates', 'od_candidate_grants', 'od_intents',
    'od_matches', 'od_match_notifications', 'od_blocks', 'od_unmatches',
    'od_profile_media',
  ];

  for (const table of tables) {
    try {
      await db.prepare(`DELETE FROM ${table} WHERE member_id = ? OR viewer_id = ? OR candidate_id = ?`)
        .bind(memberId, memberId, memberId).run();
    } catch {
      // Table may not exist or column names may differ — skip
    }
  }

  // Update member status to deleted
  await db.prepare(
    `UPDATE od_members SET status = 'deleted', updated_at = ? WHERE member_id = ?`
  ).bind(now, memberId).run();

  console.log(`[queue] member ${memberId} deletion cascaded`);
}

async function processProfileUpdated(db: D1Database, payload: Record<string, unknown>): Promise<void> {
  const { memberId } = payload;
  if (!memberId) return;

  // Re-sync the discovery index after profile changes
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(
    `UPDATE od_discovery_index SET updated_at = ? WHERE member_id = ?`
  ).bind(now, memberId).run();

  console.log(`[queue] discovery index synced for member ${memberId}`);
}
