import { useState } from 'react';
import { PageHeader, EmptyState, SkeletonList } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useClientData } from './useClient';
import { useAsync } from '@/hooks/useAsync';
import { supportService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { waLink, waMessages } from '@/utils/contact';
import { LifeBuoy, Plus, MessageCircle } from 'lucide-react';
import { timeAgo } from '@/utils/format';

export default function CSupport() {
  const { client } = useClientData();
  const { toast } = useToast();
  const { data: list, loading, reload } = useAsync(() => supportService.list().then((t) => t.filter((x) => x.clientId === client.id)), [client.id]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ subject: '', priority: 'medium' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.subject.trim()) { toast('Please describe your request.', 'warning'); return; }
    setSaving(true);
    try {
      await supportService.create({ clientId: client.id, subject: f.subject, priority: f.priority as any });
      toast('Support request submitted successfully', 'success'); setOpen(false); setF({ subject: '', priority: 'medium' }); reload();
    } catch { toast('Unable to submit request.', 'error'); }
    finally { setSaving(false); }
  };
  if (loading || !list) return <div><PageHeader title="Support" subtitle="Get help from the NorthForge team" /><SkeletonList rows={4} /></div>;
  return (
    <div>
      <PageHeader title="Support" subtitle="Get help from the NorthForge team"
        actions={<><a href={waLink(waMessages.support)} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={15} /> WhatsApp</a><button className="btn-primary btn-sm" onClick={() => setOpen(true)}><Plus size={16} /> New request</button></>} />
      {list.length === 0 ? <EmptyState icon={LifeBuoy} title="No support requests" message="Need help? Create a request and we'll get back to you." action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New request</button>} /> : (
        <div className="card divide-y divide-line/60">
          {list.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0"><p className="font-semibold text-content">{t.subject}</p><p className="text-xs text-muted">{t.number} · updated {timeAgo(t.updated)}</p></div>
              <StatusBadge kind="priority" value={t.priority} />
              <StatusBadge kind="ticket" value={t.status} dot />
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New support request" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" disabled={saving} onClick={submit}>{saving ? 'Submitting…' : 'Submit'}</button></>}>
        <div className="space-y-3.5">
          <Field label="What do you need help with?"><textarea className="input min-h-[90px]" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Describe your request…" autoFocus /></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={['low','medium','high'].map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
