import { useState } from 'react';
import { Bot, MessageSquare, Target, CheckCircle2, ArrowUpRight, Save, Sparkles, Plus, Trash2 } from 'lucide-react';
import { PageHeader, SkeletonList, Avatar, EmptyState } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { assistantService } from '@/services';
import { db } from '@/services/db';
import type { AIAssistant } from '@/types';
import { useToast } from '@/hooks/useToast';
import { cx } from '@/utils/format';

export default function AIAssistants() {
  const { data, loading, reload } = useAsync(() => assistantService.list(), []);
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const clients = db.readSync('clients');

  const head = (
    <PageHeader title="AI Assistants" subtitle="Configure the AI assistants running on client websites"
      actions={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> New assistant</button>} />
  );
  if (loading || !data) return <div>{head}<SkeletonList rows={4} /></div>;

  const a = data[active];

  return (
    <div>
      {head}
      {!a ? (
        <EmptyState icon={Bot} title="No AI assistants yet"
          message="Create an assistant for a client to answer their customers' common questions 24/7. The chat bubble appears on their portal and website automatically."
          action={<button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create the first assistant</button>} />
      ) : (
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <div className="space-y-2">
          {data.map((as, i) => {
            const c = clients.find((x) => x.id === as.clientId);
            return (
              <button key={as.clientId} onClick={() => setActive(i)} className={cx('card w-full p-4 text-left flex items-center gap-3 transition-all', i === active ? 'border-brand ring-1 ring-brand/30' : 'card-hover')}>
                <Avatar text={c?.logoText || 'AI'} size={36} tone="violet" />
                <div className="min-w-0"><p className="font-semibold text-content truncate">{as.name}</p><p className="text-xs text-muted truncate">{c?.business}</p></div>
              </button>
            );
          })}
        </div>

        {a && <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Questions asked" value={a.stats.questions.toLocaleString('en-IN')} icon={MessageSquare} />
            <KpiCard label="Leads generated" value={String(a.stats.leads)} icon={Target} sparkColor="#DB2777" />
            <KpiCard label="Resolved" value={a.stats.resolved.toLocaleString('en-IN')} icon={CheckCircle2} />
            <KpiCard label="Escalations" value={String(a.stats.escalations)} icon={ArrowUpRight} />
          </div>

          <AssistantConfig key={a.clientId} assistant={a} onSave={async (patch) => {
            await assistantService.update(a.clientId, patch);
            toast('AI assistant updated', 'success');
            reload();
          }} onDelete={() => setDeleting(true)} />

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-brand" /><h3 className="font-bold text-content">Live preview</h3></div>
            <div className="rounded-2xl bg-surface border border-line p-4 space-y-3 max-w-md">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Bot size={16} className="text-brand" /></div><span className="text-sm font-semibold text-content">{a.name}</span><span className="badge bg-emerald-500/10 text-emerald-500 ml-auto" ><span className="w-1.5 h-1.5 rounded-full bg-current" /> Online</span></div>
              <div className="bg-panel rounded-xl rounded-tl-sm p-3 text-sm text-content border border-line">{a.greeting}</div>
              <div className="bg-brand text-white rounded-xl rounded-tr-sm p-3 text-sm ml-auto max-w-[80%]">{a.faqs[0]?.q}</div>
              <div className="bg-panel rounded-xl rounded-tl-sm p-3 text-sm text-content border border-line">{a.faqs[0]?.a}</div>
            </div>
          </div>
        </div>}
      </div>
      )}

      <CreateModal open={creating} onClose={() => setCreating(false)} onDone={() => { setCreating(false); reload(); }} />
      <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} danger confirmLabel="Delete assistant"
        title="Delete AI assistant"
        message={`This removes ${a?.name} and its configuration. The chat widget will disappear for this client.`}
        onConfirm={async () => {
          if (!a) return;
          await assistantService.remove(a.clientId);
          setActive(0);
          toast('AI assistant deleted', 'success');
          reload();
        }} />
    </div>
  );
}

function AssistantConfig({ assistant, onSave, onDelete }: {
  assistant: AIAssistant;
  onSave: (patch: Partial<AIAssistant>) => Promise<void>;
  onDelete: () => void;
}) {
  const [f, setF] = useState({ name: assistant.name, greeting: assistant.greeting, tone: assistant.tone, hours: assistant.hours });
  const [saving, setSaving] = useState(false);
  const dirty = f.name !== assistant.name || f.greeting !== assistant.greeting || f.tone !== assistant.tone || f.hours !== assistant.hours;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-content">Configuration</h3>
        <button className="btn-ghost btn-sm text-rose-500" onClick={onDelete}><Trash2 size={14} /> Delete</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Assistant name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Tone"><Select value={f.tone} onChange={(v) => setF({ ...f, tone: v as AIAssistant['tone'] })} options={['Friendly', 'Professional', 'Concise'].map((t) => ({ value: t, label: t }))} /></Field>
        <div className="sm:col-span-2"><Field label="Greeting"><textarea className="input min-h-[70px]" value={f.greeting} onChange={(e) => setF({ ...f, greeting: e.target.value })} /></Field></div>
        <Field label="Operating hours"><input className="input" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
      </div>
      <div className="mt-4">
        <p className="label">FAQs — the assistant answers from these</p>
        <div className="space-y-2">{assistant.faqs.map((q, i) => <div key={i} className="rounded-xl bg-surface border border-line p-3"><p className="text-sm font-medium text-content">{q.q}</p><p className="text-xs text-muted mt-1">{q.a}</p></div>)}</div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button className="btn-primary btn-sm disabled:opacity-50" disabled={saving || !dirty}
          onClick={async () => { setSaving(true); try { await onSave(f); } finally { setSaving(false); } }}>
          <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
        </button>
        {!dirty && <span className="text-[11px] text-faint">All changes saved</span>}
      </div>
    </div>
  );
}

function CreateModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const clients = db.readSync('clients');
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('Hi! 👋 How can I help you today?');
  const [tone, setTone] = useState<AIAssistant['tone']>('Friendly');
  const [hours, setHours] = useState('Mon–Sat, 9am–7pm');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setErr('');
    if (!clientId) { setErr('Choose the client this assistant belongs to.'); return; }
    setSaving(true);
    try {
      await assistantService.create({ clientId, name, greeting, tone, hours });
      onDone();
    } catch (e: any) {
      setErr(e?.message || 'Could not create the assistant.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New AI assistant"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Creating…' : 'Create assistant'}</button>
      </>}>
      <div className="space-y-4">
        {err && <p className="text-sm text-rose-500">{err}</p>}
        <Field label="Client">
          <Select value={clientId} onChange={setClientId}
            options={clients.map((c) => ({ value: c.id, label: c.business }))} />
        </Field>
        <Field label="Assistant name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riya — Store Assistant" /></Field>
        <Field label="Greeting"><textarea className="input min-h-[70px]" value={greeting} onChange={(e) => setGreeting(e.target.value)} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Tone"><Select value={tone} onChange={(v) => setTone(v as AIAssistant['tone'])} options={['Friendly', 'Professional', 'Concise'].map((t) => ({ value: t, label: t }))} /></Field>
          <Field label="Operating hours"><input className="input" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
        </div>
        <p className="text-[11px] text-faint">A starter FAQ is added automatically — edit it after creating. The chat bubble appears at the bottom-right of the client's portal immediately.</p>
      </div>
    </Modal>
  );
}
