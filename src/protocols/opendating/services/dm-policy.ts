import { deriveMemberId } from '../storage/d1/membership.js';

export type DirectMessageDecision =
  | 'allowed'
  | 'blocked'
  | 'not-matched'
  | 'invalid-recipient';

export async function checkDirectMessagePolicy(
  db: D1Database,
  senderPubkey: string,
  recipientPubkey: string | undefined,
): Promise<DirectMessageDecision> {
  if (!recipientPubkey || !/^[0-9a-f]{64}$/i.test(recipientPubkey)) {
    return 'invalid-recipient';
  }
  if (senderPubkey === recipientPubkey) return 'allowed';

  const senderId = deriveMemberId(senderPubkey);
  const recipientId = deriveMemberId(recipientPubkey);
  const row = await db.withSession('first-primary').prepare(
    `SELECT
       EXISTS(
         SELECT 1 FROM od_blocks
         WHERE (blocker_member_id = ? AND blocked_member_id = ?)
            OR (blocker_member_id = ? AND blocked_member_id = ?)
       ) AS blocked,
       EXISTS(
         SELECT 1 FROM od_matches
         WHERE state = 'active'
           AND ((member_a = ? AND member_b = ?) OR (member_a = ? AND member_b = ?))
       ) AS matched`,
  ).bind(
    senderId,
    recipientId,
    recipientId,
    senderId,
    senderId,
    recipientId,
    recipientId,
    senderId,
  ).first<{ blocked: number; matched: number }>();

  if (row?.blocked) return 'blocked';
  return row?.matched ? 'allowed' : 'not-matched';
}
