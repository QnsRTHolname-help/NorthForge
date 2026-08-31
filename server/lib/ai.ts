// ---------------------------------------------------------------------------
// AI Service — NemotronProvider (NVIDIA NIM, OpenAI-compatible chat API).
//
// Rules from the master spec:
//   * Modular: one provider behind one service; swappable later.
//   * Server-side only: NEMOTRON_API_KEY is read from process.env and is
//     NEVER sent to the browser.
//   * AI is interpretation, not execution: nothing here may change job
//     status/progress or Hermes health — that authority stays with Hermes.
//   * Failure isolation: if Nemotron is offline/rate-limited/slow, callers
//     get a typed error and the platform keeps working; Hermes is untouched.
//   * Callers pass ONLY the minimum authorized context (tenant isolation).
// ---------------------------------------------------------------------------
import { env } from './env.js';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiResult {
  text: string;
  model: string;
}

export class AiUnavailableError extends Error {
  constructor(
    public code:
      | 'AI_NOT_CONFIGURED'
      | 'AI_RATE_LIMITED'
      | 'AI_TIMEOUT'
      | 'AI_UNAVAILABLE'
      | 'AI_INVALID_RESPONSE',
    message: string,
  ) {
    super(message);
  }
}

export interface AiProvider {
  readonly name: string;
  complete(messages: AiMessage[], opts?: { maxTokens?: number; timeoutMs?: number }): Promise<AiResult>;
}

const DEFAULT_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
const DEFAULT_BASE = 'https://integrate.api.nvidia.com/v1';

class NemotronProvider implements AiProvider {
  readonly name = 'nemotron';

  async complete(
    messages: AiMessage[],
    opts: { maxTokens?: number; timeoutMs?: number } = {},
  ): Promise<AiResult> {
    const key = env.nemotronApiKey();
    const base = env.nemotronApiUrl() || DEFAULT_BASE;
    const model = env.nemotronModel() || DEFAULT_MODEL;
    if (!key) {
      throw new AiUnavailableError(
        'AI_NOT_CONFIGURED',
        'AI summaries are not configured. The automation result below is unaffected.',
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3, // summaries should be faithful, not creative
          top_p: 0.95,
          max_tokens: opts.maxTokens ?? 2048,
          stream: false,
          // Faithful interpretation: reasoning off for short summaries.
          chat_template_kwargs: { enable_thinking: false },
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new AiUnavailableError('AI_RATE_LIMITED', 'AI provider is rate limited; try again shortly.');
      }
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new AiUnavailableError('AI_UNAVAILABLE', `AI provider error (${res.status}): ${errBody.slice(0, 300)}`);
      }
      const data = (await res.json()) as any;
      const text: string | undefined = data?.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text.trim()) {
        throw new AiUnavailableError('AI_INVALID_RESPONSE', 'AI provider returned no content.');
      }
      return { text: text.trim(), model: data?.model ?? model };
    } catch (err: any) {
      if (err instanceof AiUnavailableError) throw err;
      if (err?.name === 'AbortError') {
        throw new AiUnavailableError('AI_TIMEOUT', 'AI provider timed out.');
      }
      throw new AiUnavailableError('AI_UNAVAILABLE', 'AI provider is unreachable.');
    } finally {
      clearTimeout(timer);
    }
  }
}

export const ai: AiProvider = new NemotronProvider();

/** Compact, clearly-bounded summary prompt. Context is caller-authorized. */
export function buildSummaryMessages(authorizedContext: string, audience: 'client' | 'admin'): AiMessage[] {
  const role =
    audience === 'client'
      ? 'Explain this automation result for the business client who owns it. Plain language, concise, no speculation beyond the data.'
      : 'Summarize this automation result for an operations administrator. Technical but concise; surface failures and anomalies.';
  return [
    {
      role: 'system',
      content:
        `${role} Use ONLY the provided data — never invent results, statuses, or metrics. ` +
        'You are an interpretation layer over automation output; do not claim to have executed anything.',
    },
    { role: 'user', content: `Automation result data:\n${authorizedContext}` },
  ];
}
