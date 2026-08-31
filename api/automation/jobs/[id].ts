// ---------------------------------------------------------------------------
// GET /api/automation/jobs/:id — job detail + safe timeline.
// Tenant guard: clients can only ever read their own jobs (defense in depth
// on top of RLS). Client-visible events only; internal events stay internal.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { authenticate, assertTenant } from '../../lib/auth';
import { ok, fail, ApiError } from '../../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const principal = await authenticate(req);
    const id = String(req.query.id ?? '');
    if (!id) throw new ApiError(400, 'VALIDATION', 'Job id is required.');
    const db = supabaseAdmin();

    const { data: job, error } = await db
      .from('automation_jobs')
      .select('id,hermes_job_id,client_id,automation_id,automation_version_id,config_snapshot,input,status,progress,priority,current_stage,current_task,attempt,retry_of,created_at,queued_at,dispatched_at,started_at,completed_at,failure,result_reference,updated_at')
      .eq('id', id)
      .single();
    if (error || !job) throw new ApiError(404, 'JOB_NOT_FOUND', 'Automation job could not be found.');
    assertTenant(principal, (job as any).client_id);

    // Timeline: clients get client-visibility events only.
    let eventsQ = db
      .from('automation_events')
      .select('id,type,visibility,client_message,seq,occurred_at,received_at')
      .eq('job_id', id)
      .order('received_at', { ascending: true });
    if (principal.role === 'client') eventsQ = eventsQ.eq('visibility', 'client');
    const { data: events } = await eventsQ.limit(200);

    return ok(res, { job, events: events ?? [] });
  } catch (err) {
    return fail(res, err);
  }
}
