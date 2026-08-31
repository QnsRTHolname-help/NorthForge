import { useState } from 'react';
import { Inbox, Plus, CheckCircle2 } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState, Badge } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { requestService } from '@/services';
import { rateLimit } from '@/utils/security';
import { useClientData } from './useClient';
import { useToast } from '@/hooks/useToast';
import type { ClientRequest, RequestType } from '@/types';
import { timeAgo, fmtDate } from '@/utils/format';

const TYPES: RequestType[] = ['Website Change', 'Content Update', 'Bug Fix', 'New Feature', 'Domain', 'Hosting', 'WhatsApp', 'AI Assistant', 'Automation', 'SEO', 'Booking', 'General Support'];

export default function CRequests() {
  const { client } = useClientData();
  const { data, loading, reload } = useAsync(() => requestService.listForClient(client.id), [client.id]);
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ClientRequest | null>(null);

  const head = (
    <PageHeader title="My Requests" subtitle="Ask NorthForge to make changes — track every request here"
      actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Submit Request</button>} />
  );
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  return (
    <div>
      {head}
      {data.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests yet" message="Need a change to your website or a new feature? Submit a request and NorthForge will take it from there."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Submit Request</button>} />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><h3 className="font-display font-extrabold text-content">{r.title}</h3><Badge tone="neutral">{r.type}</Badge></div>
                  <p className="text-sm text-muted mt-1.5 leading-relaxed">{r.description}</p>
                  <p className="text-xs text-faint mt-2">Submitted {fmtDate(r.createdAt)} · updated {timeAgo(r.updatedAt)}</p>
                </div>
                <div className="text-right shrink-0"><StatusBadge kind="request" value={r.status} dot /></div>
              </div>
            </div>
          ))}
        </div>
      )}
      <SubmitModal open={open} onClose={() => setOpen(false)} clientId={client.id} clientName={client.business} onCreated={(r) => { reload(); setCreated(r); }} />
      <Modal open={!!created} onClose={() => setCreated(null)} title="Request submitted" size="sm"
        footer={<button className="btn-primary" onClick={() => setCreated(null)}>Done</button>}>
        {created && (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-3xl bg-clay-success/15 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={28} className="text-clay-success" /></div>
            <p className="font-display font-extrabold text-content">Your request is in.</p>
            <p className="text-sm text-muted mt-1">NorthForge has been notified and will update you here.</p>
            <div className="mt-4 rounded-2xl bg-sunken shadow-clay-inset p-3 text-left text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted">Request ID</span><span className="font-bold text-content">{created.id.slice(-6).toUpperCase()}</span></div>
              <div className="flex justify-between"><span className="text-muted">Status</span><StatusBadge kind="request" value={created.status} /></div>
              <div className="flex justify-between"><span className="text-muted">Submitted</span><span className="font-medium text-content">{fmtDate(created.createdAt)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SubmitModal({ open, onClose, clientId, clientName, onCreated }: {
  open: boolean; onClose: () => void; clientId: string; clientName: string; onCreated: (r: ClientRequest) => void;
}) {
  const { toast } = useToast();
  const [f, setF] = useState({ type: 'Website Change' as RequestType, title: '', description: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!f.title.trim()) { setErr('Give your request a short title.'); return; }
    if (!f.description.trim()) { setErr('Describe what you need.'); return; }
    if (f.title.length > 120 || f.description.length > 2000) { setErr('Please shorten your request.'); return; }
    const rl = rateLimit(`request:${clientId}`, 5, 60_000);
    if (!rl.ok) { setErr(`Please wait ${Math.ceil(rl.retryInMs / 1000)}s before submitting another request.`); return; }
    setErr(''); setSaving(true);
    try {
      const r = await requestService.create({ clientId, clientName, type: f.type, title: f.title, description: f.description, priority: f.priority as any });
      toast('Request submitted successfully', 'success');
      onClose(); setF({ type: 'Website Change', title: '', description: '', priority: 'medium' });
      onCreated(r);
    } catch { toast('Unable to submit request. Please try again.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Submit a request" size="md"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving ? 'Submitting…' : 'Submit request'}</button></>}>
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Request type"><Select value={f.type} onChange={(v) => set('type', v)} options={TYPES.map((t) => ({ value: t, label: t }))} /></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(v) => set('priority', v)} options={['low','medium','high'].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} /></Field>
        </div>
        <Field label="Title"><input className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Add new menu section" /></Field>
        <Field label="Description"><textarea className="input min-h-[110px]" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe what you'd like changed or added…" /></Field>
        {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}
      </div>
    </Modal>
  );
}
