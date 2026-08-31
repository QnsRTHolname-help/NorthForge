// ---------------------------------------------------------------------------
// GET /api/automation/jobs/:id/ai-summary
//
// Nemotron explanation of a job's result — clearly AI-generated, cached, and
// strictly tenant-isolated. Rules enforced here:
//   * Authorize FIRST; only then load the result (defense in depth over RLS).
//   * Send only the minimal authorized context (summary/findings/metrics/
//     recommendations) — never the whole DB row, raw blobs, or other tenants.
//   * Cache: reuse automation_results.ai_summary; refresh=1 allowed for admins
//     (and for the owning client no more often than every 10 minutes).
//   * Failure isolation: AI errors return a typed error; the Hermes result
//     itself is untouched and still returned.
//   * The AI output NEVER touches job status/progress — it only fills
//     ai_summary/ai_summary_model columns.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { authenticate, assertTenant } from '../../../lib/auth';
import { ok, fail, ApiError } from '../../../lib/http';
import { ai, buildSummaryMessages, AiUnavailableError } from '../../../lib/ai';

const CACHE_MIN_MS = 10 * 60_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Use GET.');
    const principal = await authenticate(req);
    const id = String(req.query.id ?? '');
    if (!id) throw new ApiError(400, 'VALIDATION', 'Job id is required.');
    const db = supabaseAdmin();

    const { data: job } = await db
      .from('automation_jobs')
      .select('id,client_id,status')
      .eq('id', id)
      .single();
    if (!job) throw new ApiError(404, 'JOB_NOT_FOUND', 'Automation job could not be found.');
    assertTenant(principal, (job as any).client_id);

    const { data: result } = await db
      .from('automation_results')
      .select('summary,key_findings,metrics,recommendations,ai_summary,ai_summary_model,ai_summary_at,created_at')
      .eq('job_id', id)
      .single();
    if (!result) {
      throw new ApiError(404, 'RESULT_NOT_FOUND', 'No result is available for this job yet.');
    }

    const refresh = req.query.refresh === '1';
    const cached = result.ai_summary as string | null;
    const summaryAt = result.ai_summary_at ? new Date(result.ai_summary_at as string).getTime() : 0;
    const freshEnough = Date.now() - summaryAt < CACHE_MIN_MS;

    if (cached && (!refresh || principal.role !== 'admin') && freshEnough) {
      return ok(res, { summary: cached, model: result.ai_summary_model, source: 'nemotron', cached: true });
    }

    // Minimal authorized context — tenant data only, bounded size.
    const context = JSON.stringify({
      automationStatus: (job as any).status,
      summary: result.summary,
      keyFindings: result.key_findings,
      metrics: result.metrics,
      recommendations: result.recommendations,
    }).slice(0, 24_000);

    try {
      const { text, model } = await ai.complete(
        buildSummaryMessages(context, principal.role === 'admin' ? 'admin' : 'client'),
      );
      await db
        .from('automation_results')
        .update({
          ai_summary: text,
          ai_summary_model: model,
          ai_summary_at: new Date().toISOString(),
        })
        .eq('job_id', id);
      return ok(res, { summary: text, model, source: 'nemotron', cached: false });
    } catch (aiErr: any) {
      // AI failed -> serve stale cache if present, else a typed AI error.
      // The authoritative Hermes result was already fetched and is unaffected.
      if (cached) {
        return ok(res, { summary: cached, model: result.ai_summary_model, source: 'nemotron', cached: true, stale: true });
      }
      if (aiErr instanceof AiUnavailableError) {
        throw new ApiError(503, aiErr.code, aiErr.message);
      }
      throw aiErr;
    }
  } catch (err) {
    return fail(res, err);
  }
}
