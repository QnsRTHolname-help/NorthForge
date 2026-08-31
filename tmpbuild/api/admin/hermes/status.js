import { supabaseAdmin } from '../../../server/lib/supabaseAdmin.js';
import { authenticate, requireAdmin } from '../../../server/lib/auth.js';
import { ok, fail } from '../../../server/lib/http.js';
import { hermes } from '../../../server/lib/hermes.js';
export default async function handler(req, res) {
    try {
        const principal = await authenticate(req);
        requireAdmin(principal);
        const db = supabaseAdmin();
        const health = await hermes.health();
        // Persist the real probe result (no invented heartbeats).
        await db
            .from('hermes_connections')
            .upsert({
            id: 'default',
            status: health.status,
            last_heartbeat: health.status === 'ONLINE' ? new Date().toISOString() : null,
            last_error: health.status === 'OFFLINE' ? (health.detail ?? null) : null,
            meta: { adapter: hermes.name, detail: health.detail ?? null },
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        // Real operational counters straight from the database.
        const [queued, active, completedToday] = await Promise.all([
            db.from('automation_jobs').select('id', { count: 'exact', head: true }).eq('status', 'QUEUED'),
            db.from('automation_jobs').select('id', { count: 'exact', head: true }).in('status', ['DISPATCHING', 'ACCEPTED', 'RUNNING', 'WAITING', 'CANCELLING']),
            db.from('automation_jobs').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED').gte('completed_at', new Date(Date.now() - 86_400_000).toISOString()),
        ]);
        return ok(res, {
            hermes: {
                status: health.status,
                detail: health.detail ?? null,
                adapter: hermes.name,
                lastHeartbeat: health.status === 'ONLINE' ? new Date().toISOString() : null,
            },
            queue: {
                queued: queued.count ?? 0,
                active: active.count ?? 0,
                completedLast24h: completedToday.count ?? 0,
            },
        });
    }
    catch (err) {
        return fail(res, err);
    }
}
