import { supabaseAdmin } from '../../../../server/lib/supabaseAdmin.js';
import { authenticate, assertTenant } from '../../../../server/lib/auth.js';
import { ok, fail, ApiError } from '../../../../server/lib/http.js';
export default async function handler(req, res) {
    try {
        if (req.method !== 'POST')
            throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
        const principal = await authenticate(req);
        const id = String(req.query.id ?? '');
        const db = supabaseAdmin();
        const { data: prev } = await db
            .from('automation_jobs')
            .select('*')
            .eq('id', id)
            .single();
        if (!prev)
            throw new ApiError(404, 'JOB_NOT_FOUND', 'Automation job could not be found.');
        assertTenant(principal, prev.client_id);
        if (prev.status !== 'FAILED') {
            throw new ApiError(409, 'NOT_RETRYABLE', 'Only failed jobs can be retried.');
        }
        // Check the automation is still enabled before re-running it.
        const { data: def } = await db
            .from('automation_definitions')
            .select('enabled, archived')
            .eq('id', prev.automation_id)
            .single();
        if (!def || def.archived || !def.enabled) {
            throw new ApiError(409, 'AUTOMATION_UNAVAILABLE', 'This automation is currently unavailable.');
        }
        const { data: job, error } = await db
            .from('automation_jobs')
            .insert({
            client_id: prev.client_id,
            created_by: principal.userId,
            automation_id: prev.automation_id,
            automation_version_id: prev.automation_version_id,
            config_snapshot: prev.config_snapshot,
            input: prev.input,
            priority: prev.priority,
            status: 'QUEUED',
            attempt: prev.attempt + 1,
            retry_of: id,
        })
            .select('id, status')
            .single();
        if (error || !job)
            throw new ApiError(500, 'JOB_CREATE_FAILED', 'Could not create the retry job.');
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
    }
    catch (err) {
        return fail(res, err);
    }
}
