// ---------------------------------------------------------------------------
// POST /api/automation/jobs/:id/retry
// Creates a NEW job referencing the failed one (attempt +1, retry_of set).
// The original job stays FAILED — history is never rewritten.
// Communication retries are handled by the dispatcher; this is an explicit
// automation retry of a FAILED job.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { authenticate, assertTenant } from '../../../lib/auth';
import { ok, fail, ApiError } from '../../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    const principal = await authenticate(req);
    const id = String(req.query.id ?? '');
    const db = supabaseAdmin();

    const { data: prev } = await db
      .from('automation_jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (!prev) throw new ApiError(404, 'JOB_NOT_FOUND', 'Automation job could not be found.');
    assertTenant(principal, (prev as any).client_id);
    if ((prev as any).status !== 'FAILED') {
      throw new ApiError(409, 'NOT_RETRYABLE', 'Only failed jobs can be retried.');
    }

    // Check the automation is still enabled before re-running it.
    const { data: def } = await db
      .from('automation_definitions')
      .select('enabled, archived')
      .eq('id', (prev as any).automation_id)
      .single();
    if (!def || def.archived || !def.enabled) {
      throw new ApiError(409, 'AUTOMATION_UNAVAILABLE', 'This automation is currently unavailable.');
    }

    const { data: job, error } = await db
      .from('automation_jobs')
      .insert({
        client_id: (prev as any).client_id,
        created_by: principal.userId,
        automation_id: (prev as any).automation_id,
        automation_version_id: (prev as any).automation_version_id,
        config_snapshot: (prev as any).config_snapshot,
        input: (prev as any).input,
        priority: (prev as any).priority,
        status: 'QUEUED',
        attempt: (prev as any).attempt + 1,
        retry_of: id,
      })
      .select('id, status')
      .single();
    if (error || !job) throw new ApiError(500, 'JOB_CREATE_FAILED', 'Could not create the retry job.');

    await db.from('automation_events').insert({
      job_id: job.id, event_id: `wf-retry-${job.id}`, source: 'website',
      type: 'JOB_QUEUED', visibility: 'client',
      client_message: `Retry of job ${id}.`,
    });
    await db.from('audit_log').insert({
      actor: principal.userId, action: 'JOB_RETRIED',
      resource: 'automation_job', resource_id: id,
    });

    return ok(res, { job }, 201);
  } catch (err) {
    return fail(res, err);
  }
}
