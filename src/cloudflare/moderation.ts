/**
 * Cloudflare Workers AI — Content Moderation
 *
 * Uses Workers AI (free tier: 10K neurons/day) for automated content screening.
 * This is required for App Store submission (Guideline 1.2 — user-generated content).
 *
 * Models used:
 *   - Text: @cf/meta/llama-3.2-3b-instruct for classification
 *   - Text: @cf/unum/uform-gen2-qwen-500m (lighter, faster fallback)
 *
 * The moderation flow:
 *   1. Profile create/update → screen bio text → flag/reject if harmful
 *   2. Report submission → AI triage to prioritize human review
 *   3. (Future) Image upload → NSFW detection before R2 storage
 *
 * All AI calls are wrapped with a degrade-open fallback: if the AI binding
 * is absent or the model errors, we allow content through rather than
 * blocking the relay. This matches the existing pattern for MEDIA_BUCKET.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModerationResult {
  passed: boolean;
  flags: string[];
  confidence: number; // 0-1
  recommendation: 'allow' | 'flag' | 'block';
  explanation: string;
}

export type ContentCategory =
  | 'profile_bio'
  | 'profile_name'
  | 'direct_message'
  | 'report_description';

// ---------------------------------------------------------------------------
// Classification prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a content moderation classifier. Output ONLY a JSON object, no other text.

{
  "is_harmful": false,
  "categories": [],
  "confidence": 0.95,
  "action": "allow",
  "reason": "brief explanation"
}

RULES:
- "action" is "allow", "flag", or "block"
- "categories" is a list: harassment, hate_speech, sexual_content, spam, violence, personal_info, self_harm, underage, impersonation, commercial
- Dating-appropriate content (flirting, describing oneself, relationship preferences, sexual orientation, gender identity) is ALLOWED
- Only BLOCK: harassment, hate speech, underage content, doxxing, explicit sexual content
- FLAG borderline cases that need human review
- "confidence" is 0.0 to 1.0`;

// ---------------------------------------------------------------------------
// Main moderation function
// ---------------------------------------------------------------------------

/**
 * Screen text content through Workers AI.
 *
 * @param ai - The AI binding from env.AI (optional — degrades open)
 * @param text - Content to screen
 * @param category - What kind of content this is (influences prompt)
 * @returns ModerationResult — always returns {passed: true} if AI is unavailable
 */
export async function moderateContent(
  ai: Ai | undefined,
  text: string,
  category: ContentCategory,
): Promise<ModerationResult> {
  // Degrade open: no AI binding → allow everything
  if (!ai) {
    console.log(`[moderation] AI binding absent — allowing ${category} content without screening`);
    return { passed: true, flags: [], confidence: 0, recommendation: 'allow', explanation: 'AI moderation not configured' };
  }

  // Trivial content doesn't need an AI call
  if (!text || text.trim().length < 2) {
    return { passed: true, flags: [], confidence: 1, recommendation: 'allow', explanation: 'Content too short to screen' };
  }

  try {
    const response = await ai.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Category: ${category}\n\nContent to classify:\n"""\n${text.slice(0, 2000)}\n"""` },
      ],
      max_tokens: 256,
      temperature: 0.0,
    });

    // Workers AI response shape varies by runtime version.
    // When response_format:json_object is set it may auto-parse into an object;
    // without it the response is a JSON string. Handle both.
    let raw: unknown = (response as any).response ?? (response as any).choices?.[0]?.message?.content ?? '{}';
    const parsed: Record<string, unknown> =
      typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);

    const action = parsed.action as string;
    const recommendation: 'allow' | 'flag' | 'block' =
      action === 'flag' ? 'flag' : action === 'block' ? 'block' : 'allow';

    return {
      passed: recommendation === 'allow',
      flags: Array.isArray(parsed.categories) ? parsed.categories : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      recommendation,
      explanation: (parsed.reason as string) || 'No explanation provided',
    };
  } catch (err) {
    console.error(`[moderation] AI call failed for ${category}:`, err);
    // Degrade open on error — don't block legitimate users
    return { passed: true, flags: [], confidence: 0, recommendation: 'allow', explanation: `Moderation error: ${String(err).slice(0, 100)}` };
  }
}

/**
 * Quick check: does content need human review?
 * Use this to decide whether to queue a report for moderator attention.
 */
export function needsHumanReview(result: ModerationResult): boolean {
  return result.recommendation === 'flag' || (result.recommendation === 'block' && result.confidence < 0.9);
}

/**
 * Check if content should be outright rejected.
 * Only block with high confidence to avoid false positives.
 */
export function shouldBlock(result: ModerationResult): boolean {
  return result.recommendation === 'block' && result.confidence >= 0.85;
}
