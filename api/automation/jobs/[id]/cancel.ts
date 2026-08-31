// ---------------------------------------------------------------------------
// POST /api/automation/jobs/:id/cancel
// Requests cancellation via Hermes. The job only becomes CANCELLED when Hermes
// confirms (JOB_CANCELLED callback). If Hermes reports no cancel capability
// the adapter refuses — we NEVER simulate a local cancellation while Hermes
// keeps executing.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../../../server/lib/supabaseAdmin';
import { authenticate, assertTenant } from '../../../../server/lib/auth';
import { ok, fail, ApiError } from '../../../../server/lib/http';
import { hermes } from '../../../../server/lib/hermes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    const principal = await authenticate(req);
    const id = String(req.query.id ?? '');
    const db = supabaseAdmin();

    const { data: job } = await db
      .from('automation_jobs')
      .select('id,client_id,status,hermes_job_id')
      .eq('id', id)
      .single();
    if (!job) throw new ApiError(404, 'JOB_NOT_FOUND', 'Automation job could not be found.');
    assertTenant(principal, (job as any).client_id);

    const status = (job as any).status as string;
    if (!['QUEUED', 'DISPATCHING', 'ACCEPTED', 'RUNNING', 'WAITING'].includes(status)) {
      throw new ApiError(409, 'NOT_CANCELLABLE', `A ${status} job cannot be cancelled.`);
    }

    // QUEUED (not yet dispatched) can be cancelled locally and safely.
    if (status === 'QUEUED') {
      await db.from('automation_jobs').update({ status: 'CANCELLED' }).eq('id', id);
      await db.from('automation_events').insert({
        job_id: id, event_id: `wf-cancel-${id}`, source: 'website',
        type: 'JOB_CANCELLED', visibility: 'client',
        client_message: 'Job cancelled before dispatch.',
      });
      return ok(res, { status: 'CANCELLED' });
    }

    const hermesJobId = (job as any).hermes_job_id;
    if (!hermesJobId) {
      // Dispatch in-flight: put it into CANCELLING; dispatcher honours this.
      await db.from('automation_jobs').update({ status: 'CANCELLING' }).eq('id', id);
      return ok(res, { status: 'CANCELLING' });
    }

    await db.from('automation_jobs').update({ status: 'CANCELLING' }).eq('id', id);
    await hermes.cancel(hermesJobId); // throws CANCEL_NOT_SUPPORTED if unsupported
    await db.from('audit_log').insert({
      actor: principal.userId, action: 'JOB_CANCEL_REQUESTED',
      resource: 'automation_job', resource_id: id,
    });
    return ok(res, { status: 'CANCELLING' }); // final state from Hermes callback
  } catch (err) {
    return fail(res, err);
  }
}
