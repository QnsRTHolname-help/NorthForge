// ---------------------------------------------------------------------------
// POST /api/hermes/events — the ONLY way automation state ever changes.
//
// Security:
//   * HMAC-SHA256 signature over `${timestamp}.${rawBody}` (X-Hermes-Signature,
//     X-Hermes-Timestamp) with HERMES_CALLBACK_SECRET — rejects forged calls.
//   * Timestamp window rejects replays; unique(source, event_id) rejects
//     duplicate deliveries idempotently.
//   * Out-of-order events: terminal facts win; progress never moves backwards.
//
// Honesty:
//   * Progress/stage/status are written ONLY from what Hermes actually sent.
//   * The event->state mapping is adapted to the real Hermes contract once
//     known (see docs/HERMES_INTEGRATION.md).
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../server/lib/supabaseAdmin.js';
import { env } from '../../server/lib/env.js';
import { fail, ApiError } from '../../server/lib/http.js';
import { verifyCallbackSignature } from '../../server/lib/hermes.js';
import { mapEvent } from '../../server/lib/eventMap.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Use POST.');

    // Vercel gives us the parsed body; recover the exact raw string for HMAC.
    const rawBody =
      typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const check = verifyCallbackSignature(
      rawBody,
      req.headers['x-hermes-signature'] as string | undefined,
      env.hermesCallbackSecret(),
      req.headers['x-hermes-timestamp'] as string | undefined,
    );
    if (!check.valid) {
      throw new ApiError(401, 'INVALID_SIGNATURE', `Callback rejected: ${check.reason}.`);
    }
    if (!env.hermesCallbackSecret()) {
      throw new ApiError(503, 'CALLBACK_NOT_CONFIGURED', 'Callback channel not configured.');
    }

    const event = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as any;
    if (!event?.type) throw new ApiError(400, 'VALIDATION', 'Event type is required.');

    const db = supabaseAdmin();

    // Resolve the job: prefer our own id, fall back to the Hermes job id.
    let jobId: string | undefined = event.jobId;
    if (!jobId && event.hermesJobId) {
      const { data } = await db
        .from('automation_jobs')
        .select('id')
        .eq('hermes_job_id', event.hermesJobId)
        .single();
      jobId = data?.id;
    }
    if (!jobId) throw new ApiError(404, 'JOB_NOT_FOUND', 'No job matches this event.');

    // Idempotency: same (source, event_id) is accepted-but-ignored.
    if (event.eventId) {
      const { data: dupe } = await db
        .from('automation_events')
        .select('id')
        .eq('source', 'hermes')
        .eq('event_id', event.eventId)
        .maybeSingle();
      if (dupe) return res.status(200).json({ success: true, data: { duplicate: true } });
    }

    const { data: job } = await db
      .from('automation_jobs')
      .select('id,status,progress,client_id')
      .eq('id', jobId)
      .single();
    if (!job) throw new ApiError(404, 'JOB_NOT_FOUND', 'No job matches this event.');
    const cur = job as any as { status: string; progress: number; client_id: string };

    const { patch, visibility, resultRow, fileRows, notify } = mapEvent(event, cur);

    // Record the event FIRST (idempotent), then apply the guarded patch.
    const { error: evErr } = await db.from('automation_events').insert({
      job_id: jobId,
      event_id: event.eventId ?? null,
      source: 'hermes',
      type: event.type,
      seq: event.seq ?? null,
      visibility,
      client_message: event.message ?? notify?.body ?? null,
      payload: { progress: event.progress ?? null, stage: event.stage ?? null, task: event.task ?? null },
      occurred_at: event.occurredAt ?? null,
    });
    if (evErr) {
      // Unique violation => duplicate delivery under concurrency; ignore.
      if ((evErr as any).code === '23505') {
        return res.status(200).json({ success: true, data: { duplicate: true } });
      }
      throw evErr;
    }

    if (Object.keys(patch).length) {
      // Guarded transition: state moved on concurrently? skip silently.
      const { error: upErr } = await db
        .from('automation_jobs')
        .update(patch)
        .eq('id', jobId)
        .eq('status', cur.status);
      if (upErr) {
        await db.from('automation_logs').insert({
          job_id: jobId, level: 'warn',
          message: `State transition refused for ${event.type}.`,
          detail: { from: cur.status, patch },
        });
      }
    }

    // Mapper leaves job_id null; the caller stamps it before writing.
    if (resultRow) (resultRow as any).job_id = jobId;
    for (const f of fileRows) (f as any).job_id = jobId;

    if (resultRow) await db.from('automation_results').upsert(resultRow, { onConflict: 'job_id' });
    if (fileRows.length) {
      await db.from('automation_files').upsert(fileRows, { onConflict: 'job_id,storage_path' });
    }
    if (notify) {
      await db.from('notifications').insert({
        type: 'automation',
        title: notify.title,
        body: notify.body,
        audience: 'client',
        client_id: cur.client_id,
        resource_type: 'automation_job',
        resource_id: jobId,
      });
    }

    return res.status(200).json({ success: true, data: { processed: event.type } });
  } catch (err) {
    return fail(res, err);
  }
}
