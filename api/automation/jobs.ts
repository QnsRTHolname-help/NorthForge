// ---------------------------------------------------------------------------
// POST /api/automation/jobs        — create a job (client or admin)
// GET  /api/automation/jobs        — list jobs (tenant-scoped / all for admin)
//
// Job creation writes job + config snapshot + initial event together; the
// browser request closes immediately after QUEUED. Dispatch to Hermes happens
// via the dispatcher — never inside a long-lived HTTP wait.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../server/lib/supabaseAdmin.js';
import { authenticate, assertTenant } from '../../server/lib/auth.js';
import { ok, fail, ApiError } from '../../server/lib/http.js';

const VALID_PRIORITY = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const principal = await authenticate(req);
    const db = supabaseAdmin();

    if (req.method === 'GET') {
      let q = db
        .from('automation_jobs')
        .select('id,status,progress,priority,current_stage,automation_id,client_id,config_snapshot,created_at,started_at,completed_at,updated_at,hermes_job_id')
        .order('created_at', { ascending: false })
        .limit(100);
      const { automationId, status, clientId } = req.query;
      if (typeof automationId === 'string') q = q.eq('automation_id', automationId);
      if (typeof status === 'string') q = q.eq('status', status);
      if (principal.role === 'client') {
        q = q.eq('client_id', principal.clientId!);
      } else if (typeof clientId === 'string') {
        q = q.eq('client_id', clientId);
      }
      const { data, error } = await q;
      if (error) throw new ApiError(500, 'DB_ERROR', 'Could not load jobs.');
      return ok(res, { jobs: data });
    }

    if (req.method === 'POST') {
      const body = req.body as {
        automationId?: string;
        input?: unknown;
        priority?: string;
        clientId?: string;
      };
      if (!body.automationId) throw new ApiError(400, 'VALIDATION', 'automationId is required.');
      if (body.priority && !VALID_PRIORITY.includes(body.priority)) {
        throw new ApiError(400, 'VALIDATION', 'Invalid priority.');
      }
      // Tenant resolution: clients always run as themselves.
      const tenantId =
        principal.role === 'client' ? principal.clientId! : (body.clientId ?? '');
      if (!tenantId) throw new ApiError(400, 'VALIDATION', 'clientId is required.');
      assertTenant(principal, tenantId);

      // Load the definition + its ACTIVE version (the exact pinned version).
      const { data: def, error: defErr } = await db
        .from('automation_definitions')
        .select('id, slug, name, enabled, archived, current_version_id, capabilities, permissions, automation_versions!automation_definitions_current_version_id_fkey(id, version, config, input_schema)')
        .eq('id', body.automationId)
        .single();
      if (defErr || !def) throw new ApiError(404, 'AUTOMATION_NOT_FOUND', 'Automation could not be found.');
      if (def.archived || !def.enabled) {
        throw new ApiError(409, 'AUTOMATION_UNAVAILABLE', 'This automation is currently unavailable.');
      }
      const version = (def as any).automation_versions?.[0];
      if (!version) throw new ApiError(409, 'NO_ACTIVE_VERSION', 'This automation has no published version.');

      // Definition-level permission check.
      const perms = def.permissions ?? {};
      if (Array.isArray(perms.allowedClientIds) && perms.allowedClientIds.length &&
          !perms.allowedClientIds.includes(tenantId)) {
        throw new ApiError(403, 'FORBIDDEN', 'This automation is not enabled for your account.');
      }

      // TODO(Phase 5): validate `input` against version.input_schema server-side
      // (ajv). Kept explicit rather than silently accepting unknown input.

      const snapshot = {
        slug: def.slug,
        name: def.name,
        version: version.version,
        versionId: version.id,
        config: version.config,
        capabilities: def.capabilities ?? {},
      };

      const { data: job, error: jobErr } = await db
        .from('automation_jobs')
        .insert({
          client_id: tenantId,
          created_by: principal.userId,
          automation_id: def.id,
          automation_version_id: version.id,
          config_snapshot: snapshot,
          input: body.input ?? {},
          priority: body.priority ?? 'NORMAL',
          status: 'QUEUED',
        })
        .select('id, status')
        .single();
      if (jobErr || !job) {
        console.error('[jobs] insert failed:', jobErr);
        throw new ApiError(500, 'JOB_CREATE_FAILED', 'Could not create the job.');
      }

      await db.from('automation_events').insert({
        job_id: job.id,
        event_id: `wf-create-${job.id}`,
        source: 'website',
        type: 'JOB_QUEUED',
        visibility: 'client',
        client_message: 'Job created and queued.',
      });

      await db.from('audit_log').insert({
        actor: principal.userId,
        action: 'JOB_CREATED',
        resource: 'automation_job',
        resource_id: job.id,
      });

      // Fire-and-forget dispatch; the HTTP request closes now.
      void dispatchQueuedJobs();

      return ok(res, { job }, 201);
    }

    throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Unsupported method.');
  } catch (err) {
    return fail(res, err);
  }
}

/** Minimal dispatcher: hands every QUEUED job to the Hermes adapter once. */
export async function dispatchQueuedJobs(): Promise<void> {
  const { hermes } = await import('../../server/lib/hermes');
  const { env } = await import('../../server/lib/env');
  const db = supabaseAdmin();
  const { data: queued } = await db
    .from('automation_jobs')
    .select('id, input, config_snapshot')
    .eq('status', 'QUEUED')
    .order('created_at')
    .limit(10);
  if (!queued) return;
  for (const job of queued) {
    const snap = job.config_snapshot as any;
    // Optimistic claim; the DB state-machine trigger guards legality.
    const { data: claimed } = await db
      .from('automation_jobs')
      .update({ status: 'DISPATCHING' })
      .eq('id', job.id)
      .eq('status', 'QUEUED')
      .select('id')
      .maybeSingle();
    if (!claimed) continue;
    try {
      const { hermesJobId } = await hermes.dispatch({
        websiteJobId: job.id,
        hermesAutomationKey: snap?.hermesKey ?? snap?.slug ?? '',
        input: job.input,
        config: snap?.config ?? {},
        callbackUrl: `${process.env.PUBLIC_BASE_URL ?? ''}/api/hermes/events`,
        callbackSecret: env.hermesCallbackSecret(),
      });
      await db.from('automation_jobs').update({ hermes_job_id: hermesJobId }).eq('id', job.id);
      // ACCEPTED arrives only via a real Hermes callback — never faked here.
    } catch (err: any) {
      // Honest recovery: job returns to QUEUED; nothing lost, nothing simulated.
      await db.from('automation_jobs').update({ status: 'QUEUED' }).eq('id', job.id);
      await db.from('automation_logs').insert({
        job_id: job.id,
        level: err?.code === 'HERMES_NOT_CONFIGURED' ? 'warn' : 'error',
        message:
          err?.code === 'HERMES_NOT_CONFIGURED'
            ? 'Dispatch deferred: Hermes not configured.'
            : 'Dispatch attempt failed; will retry.',
        detail: { code: err?.code ?? null },
      });
    }
  }
}
