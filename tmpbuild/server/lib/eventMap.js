const nextProgress = (current, reported) => {
    const n = Number(reported);
    if (!Number.isFinite(n) || n < 0 || n > 100)
        return current;
    return Math.max(current, Math.round(n));
};
export function mapEvent(event, cur) {
    const patch = {};
    let visibility = 'internal';
    let resultRow = null;
    let fileRows = [];
    let notify = null;
    switch (event.type) {
        case 'JOB_ACCEPTED':
            if (cur.status === 'DISPATCHING' || cur.status === 'QUEUED')
                patch.status = 'ACCEPTED';
            visibility = 'client';
            break;
        case 'JOB_STARTED':
            patch.status = 'RUNNING';
            visibility = 'client';
            notify = { title: 'Automation started', body: 'Your automation is now running.' };
            break;
        case 'STEP_STARTED':
        case 'STEP_PROGRESS':
        case 'STEP_COMPLETED':
            if (event.progress !== undefined)
                patch.progress = nextProgress(cur.progress, event.progress);
            if (event.stage)
                patch.current_stage = event.stage;
            if (event.task)
                patch.current_task = event.task;
            // Raw progress ticks are noise for clients; step boundaries are not.
            visibility = event.type === 'STEP_PROGRESS' ? 'internal' : 'client';
            break;
        case 'MESSAGE':
        case 'WARNING':
            visibility = 'client';
            break;
        case 'RESULT_CREATED': {
            if (event.result) {
                const r = event.result;
                resultRow = {
                    job_id: null, // filled by caller
                    client_id: cur.client_id,
                    summary: r.summary ?? null,
                    key_findings: r.keyFindings ?? [],
                    metrics: r.metrics ?? {},
                    recommendations: r.recommendations ?? [],
                    raw: r,
                };
            }
            visibility = 'internal';
            break;
        }
        case 'FILE_CREATED':
            fileRows = (event.files ?? []).map((f) => ({
                job_id: null, // filled by caller
                client_id: cur.client_id,
                file_name: f.fileName,
                mime_type: f.mimeType ?? null,
                size_bytes: f.sizeBytes ?? null,
                storage_path: f.storagePath,
            }));
            visibility = 'internal';
            break;
        case 'JOB_COMPLETED':
            patch.status = 'COMPLETED';
            if (event.progress !== undefined)
                patch.progress = nextProgress(cur.progress, event.progress);
            visibility = 'client';
            notify = { title: 'Automation completed', body: 'Your automation finished successfully.' };
            break;
        case 'JOB_FAILED':
            patch.status = 'FAILED';
            // Store only safe failure info; stack traces stay out of client view.
            patch.failure = {
                code: event.failure?.code ?? 'HERMES_FAILURE',
                message: event.failure?.message ?? 'The automation failed.',
            };
            visibility = 'client';
            notify = { title: 'Automation failed', body: event.failure?.message ?? 'Your automation failed.' };
            break;
        case 'JOB_CANCELLED':
            patch.status = 'CANCELLED';
            visibility = 'client';
            notify = { title: 'Automation cancelled', body: 'Your automation was cancelled.' };
            break;
        default:
            visibility = 'internal';
    }
    return { patch, visibility, resultRow, fileRows, notify };
}
