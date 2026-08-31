import { useState } from 'react';
import { Check, Star, Pencil, Save } from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/forms/Field';
import { PLANS, formatINR, planById } from '@/data/catalog';
import { useToast } from '@/hooks/useToast';
import type { Plan } from '@/types';
import { cx } from '@/utils/format';

const KEY = 'northforge.plans.overrides';

export default function Plans() {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<Record<string, Partial<Plan>>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  });
  const [edit, setEdit] = useState<Plan | null>(null);

  const plans = PLANS.map((p) => ({ ...p, ...overrides[p.id] }));

  const savePlan = (id: string, patch: Partial<Plan>) => {
    const next = { ...overrides, [id]: { ...overrides[id], ...patch } };
    setOverrides(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    toast('Plan updated'); setEdit(null);
  };

  return (
    <div>
      <PageHeader title="Plans" subtitle="Manage NorthForge pricing — this is the single source used everywhere" />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {plans.map((p) => (
          <div key={p.id} className={cx('card p-6 relative flex flex-col', p.popular && 'ring-2 ring-brand', !p.active && 'opacity-60')}>
            {p.popular && <span className="badge bg-brand text-white absolute -top-2.5 left-6"><Star size={11} /> Popular</span>}
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-content text-lg">{p.name}</h3>
              <button className="btn-ghost !p-1.5" onClick={() => setEdit(p)}><Pencil size={14} /></button>
            </div>
            <p className="text-xs text-muted mt-0.5">{p.goal}</p>
            <div className="mt-3 flex items-baseline gap-1"><span className="text-3xl font-bold text-content">{formatINR(p.price)}</span>{p.price > 0 && <span className="text-sm text-faint">/ {p.cycleDays}d</span>}</div>
            <ul className="mt-5 space-y-2 flex-1">
              {p.features.slice(0, 5).map((f, i) => <li key={i} className="flex gap-2 text-sm"><Check size={15} className="text-emerald-500 shrink-0 mt-0.5" /><span className="text-content">{f.label}</span></li>)}
            </ul>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
              <Badge tone={p.active ? 'success' : 'neutral'} dot>{p.active ? 'Active' : 'Inactive'}</Badge>
              <span className="text-xs text-muted">{p.includedServices.length} services</span>
            </div>
          </div>
        ))}
      </div>

      {edit && <EditModal plan={edit} onClose={() => setEdit(null)} onSave={savePlan} />}
    </div>
  );
}

function EditModal({ plan, onClose, onSave }: { plan: Plan; onClose: () => void; onSave: (id: string, patch: Partial<Plan>) => void }) {
  const [f, setF] = useState({ name: plan.name, price: plan.price, goal: plan.goal, popular: plan.popular || false, active: plan.active });
  return (
    <Modal open onClose={onClose} title={`Edit ${plan.name}`} size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => onSave(plan.id, f)}><Save size={14} /> Save</button></>}>
      <div className="space-y-3.5">
        <Field label="Plan name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Price (₹) — 0 for custom"><input type="number" className="input" value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} /></Field>
        <Field label="Goal"><input className="input" value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm text-content"><input type="checkbox" checked={f.popular} onChange={(e) => setF({ ...f, popular: e.target.checked })} className="accent-brand w-4 h-4" /> Mark as most popular</label>
        <label className="flex items-center gap-2 text-sm text-content"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="accent-brand w-4 h-4" /> Active</label>
      </div>
    </Modal>
  );
}
