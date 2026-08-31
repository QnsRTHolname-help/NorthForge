import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Users, FolderKanban, ListTodo, FileText, Receipt, CalendarClock, Workflow } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Field, Select } from './Field';
import { useToast } from '@/hooks/useToast';
import { db } from '@/services/db';
import {
  leadService, clientService, projectService, taskService, proposalService,
  billingService, appointmentService, workflowService,
} from '@/services';
import { PLANS } from '@/data/catalog';
import { cx } from '@/utils/format';

type FormKind = 'lead' | 'client' | 'project' | 'task' | 'proposal' | 'invoice' | 'appointment' | 'workflow' | null;

const menu = [
  { kind: 'lead', label: 'New Lead', icon: Users },
  { kind: 'client', label: 'New Client', icon: UserPlus },
  { kind: 'project', label: 'New Project', icon: FolderKanban },
  { kind: 'task', label: 'New Task', icon: ListTodo },
  { kind: 'proposal', label: 'New Proposal', icon: FileText },
  { kind: 'invoice', label: 'New Invoice', icon: Receipt },
  { kind: 'appointment', label: 'New Appointment', icon: CalendarClock },
  { kind: 'workflow', label: 'New Workflow', icon: Workflow },
] as const;

export function QuickCreate({ onCreated }: { onCreated?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState<FormKind>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button className="btn-primary btn-sm sm:!px-3.5 sm:!py-2" onClick={() => setMenuOpen((o) => !o)} aria-label="Quick create">
        <Plus size={16} /> <span className="hidden sm:inline">Create</span>
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-elevated rounded-3xl shadow-clay-xl p-1.5 animate-scale-in origin-top-right z-50">
          {menu.map((m) => (
            <button key={m.kind} onClick={() => { setForm(m.kind); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-content hover:bg-line/50 transition-colors">
              <m.icon size={16} className="text-muted" /> {m.label}
            </button>
          ))}
        </div>
      )}
      <CreateModal kind={form} onClose={() => setForm(null)} onCreated={onCreated} />
    </div>
  );
}

export function CreateModal({ kind, onClose, onCreated, presetLeadId }: {
  kind: FormKind; onClose: () => void; onCreated?: () => void; presetLeadId?: string;
}) {
  const { toast } = useToast();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setF({}); setErrors({}); }, [kind]);

  const clients = db.readSync('clients');
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    const err: Record<string, string> = {};
    if (kind === 'lead' && !f.business) err.business = 'Business name is required.';
    if (kind === 'client' && !f.business) err.business = 'Business name is required.';
    if (kind === 'project' && !f.name) err.name = 'Project name is required.';
    if (kind === 'task' && !f.title) err.title = 'Task title is required.';
    if (kind === 'proposal' && !f.clientName) err.clientName = 'Client name is required.';
    if (kind === 'invoice' && !f.clientId) err.clientId = 'Select a client.';
    if (kind === 'appointment' && !f.title) err.title = 'Title is required.';
    if (kind === 'workflow' && !f.name) err.name = 'Workflow name is required.';
    if (Object.keys(err).length) { setErrors(err); return; }
    setSaving(true);
    try {
      let dest = '';
      if (kind === 'lead') { const l = await leadService.create(f); toast('Lead created'); dest = `/app/leads/${l.id}`; }
      else if (kind === 'client') { const c = await clientService.create(f); toast('Client created'); dest = `/app/clients/${c.id}`; }
      else if (kind === 'project') { await projectService.create(f); toast('Project created'); dest = '/app/projects'; }
      else if (kind === 'task') { await taskService.create(f); toast('Task created'); dest = '/app/tasks'; }
      else if (kind === 'proposal') { const plan = PLANS.find(p => p.id === f.plan);
        const items = plan && plan.price ? [{ label: `${plan.name} Plan (28 days)`, amount: plan.price }] : [{ label: 'Custom project', amount: Number(f.amount) || 0 }];
        await proposalService.create({ ...f, items }); toast('Proposal created'); dest = '/app/proposals'; }
      else if (kind === 'invoice') { const plan = PLANS.find(p => p.id === f.plan);
        await billingService.createInvoice({ ...f, amount: plan?.price || Number(f.amount) || 0 }); toast('Invoice created'); dest = '/app/invoices'; }
      else if (kind === 'appointment') { await appointmentService.create(f); toast('Appointment scheduled'); dest = '/app/bookings'; }
      else if (kind === 'workflow') { const w = await workflowService.create(f); toast('Workflow created'); dest = `/app/workflows/${w.id}`; }
      onCreated?.();
      onClose();
      if (dest) nav(dest);
    } finally { setSaving(false); }
  };

  const title = kind ? menu.find((m) => m.kind === kind)?.label : '';
  const clientOpts = [{ value: '', label: 'Select client…' }, ...clients.map((c) => ({ value: c.id, label: c.business }))];
  const planOpts = PLANS.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Modal open={!!kind} onClose={onClose} title={title || ''}
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className={cx('btn-primary', saving && 'pointer-events-none')} onClick={submit}>
          {saving ? 'Saving…' : 'Create'}
        </button>
      </>}>
      <div className="space-y-3.5">
        {kind === 'lead' && <>
          <Field label="Business name" error={errors.business}><input className="input" value={f.business || ''} onChange={(e) => set('business', e.target.value)} placeholder="Business name" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person"><input className="input" value={f.contact || ''} onChange={(e) => set('contact', e.target.value)} /></Field>
            <Field label="Category"><input className="input" value={f.category || ''} onChange={(e) => set('category', e.target.value)} placeholder="Automotive" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><input className="input" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email"><input className="input" value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source"><Select value={f.source || 'WhatsApp'} onChange={(v) => set('source', v)} options={['WhatsApp','Website','Referral','Cold Outreach','Manual'].map(v=>({value:v,label:v}))} /></Field>
            <Field label="Priority"><Select value={f.priority || 'medium'} onChange={(v) => set('priority', v)} options={['high','medium','low'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)}))} /></Field>
          </div>
          <Field label="Estimated value (₹)"><input type="number" className="input" value={f.estValue || ''} onChange={(e) => set('estValue', Number(e.target.value))} placeholder="1999" /></Field>
        </>}

        {kind === 'client' && <>
          <Field label="Business name" error={errors.business}><input className="input" value={f.business || ''} onChange={(e) => set('business', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact person"><input className="input" value={f.contact || ''} onChange={(e) => set('contact', e.target.value)} /></Field>
            <Field label="Industry"><input className="input" value={f.industry || ''} onChange={(e) => set('industry', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><input className="input" value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Phone"><input className="input" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan"><Select value={f.plan || 'starter'} onChange={(v) => set('plan', v)} options={planOpts} /></Field>
            <Field label="Status"><Select value={f.status || 'onboarding'} onChange={(v) => set('status', v)} options={['prospect','onboarding','active','paused'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)}))} /></Field>
          </div>
        </>}

        {kind === 'project' && <>
          <Field label="Project name" error={errors.name}><input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Client"><Select value={f.clientId || ''} onChange={(v) => set('clientId', v)} options={clientOpts} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan"><Select value={f.plan || 'starter'} onChange={(v) => set('plan', v)} options={planOpts} /></Field>
            <Field label="Target launch"><input type="date" className="input" value={f.targetLaunch || ''} onChange={(e) => set('targetLaunch', e.target.value)} /></Field>
          </div>
        </>}

        {kind === 'task' && <>
          <Field label="Task title" error={errors.title}><input className="input" value={f.title || ''} onChange={(e) => set('title', e.target.value)} /></Field>
          <Field label="Client (optional)"><Select value={f.clientId || ''} onChange={(v) => set('clientId', v)} options={clientOpts} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority"><Select value={f.priority || 'medium'} onChange={(v) => set('priority', v)} options={['high','medium','low'].map(v=>({value:v,label:v[0].toUpperCase()+v.slice(1)}))} /></Field>
            <Field label="Due date"><input type="date" className="input" value={f.due || ''} onChange={(e) => set('due', e.target.value)} /></Field>
          </div>
        </>}

        {kind === 'proposal' && <>
          <Field label="Client name" error={errors.clientName}><input className="input" value={f.clientName || ''} onChange={(e) => set('clientName', e.target.value)} /></Field>
          <Field label="Plan"><Select value={f.plan || 'growth'} onChange={(v) => set('plan', v)} options={planOpts} /></Field>
          {f.plan === 'custom' && <Field label="Custom amount (₹)"><input type="number" className="input" value={f.amount || ''} onChange={(e) => set('amount', e.target.value)} /></Field>}
          <Field label="Valid until"><input type="date" className="input" value={f.validUntil || ''} onChange={(e) => set('validUntil', e.target.value)} /></Field>
        </>}

        {kind === 'invoice' && <>
          <Field label="Client" error={errors.clientId}><Select value={f.clientId || ''} onChange={(v) => set('clientId', v)} options={clientOpts} /></Field>
          <Field label="Plan"><Select value={f.plan || 'starter'} onChange={(v) => set('plan', v)} options={planOpts} /></Field>
          {f.plan === 'custom' && <Field label="Amount (₹)"><input type="number" className="input" value={f.amount || ''} onChange={(e) => set('amount', e.target.value)} /></Field>}
          <Field label="Due date"><input type="date" className="input" value={f.due || ''} onChange={(e) => set('due', e.target.value)} /></Field>
        </>}

        {kind === 'appointment' && <>
          <Field label="Title" error={errors.title}><input className="input" value={f.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="Consultation — …" /></Field>
          <Field label="Client (optional)"><Select value={f.clientId || ''} onChange={(v) => set('clientId', v)} options={clientOpts} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><input type="date" className="input" value={f.date || ''} onChange={(e) => set('date', e.target.value)} /></Field>
            <Field label="Time"><input type="time" className="input" value={f.time || '17:00'} onChange={(e) => set('time', e.target.value)} /></Field>
          </div>
          <Field label="Service"><input className="input" value={f.service || ''} onChange={(e) => set('service', e.target.value)} placeholder="Consultation" /></Field>
        </>}

        {kind === 'workflow' && <>
          <Field label="Workflow name" error={errors.name}><input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="New Website Lead → Confirm" /></Field>
          <Field label="Description"><textarea className="input min-h-[70px]" value={f.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
        </>}
      </div>
    </Modal>
  );
}
