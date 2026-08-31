import { useState } from 'react';
import { PageHeader, SkeletonList, Avatar, Badge } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { paymentService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import { planById } from '@/data/catalog';
import type { Payment, PaymentStatus } from '@/types';
import { inr, fmtDate } from '@/utils/format';
import { BadgeIndianRupee, Clock, CreditCard, ShieldCheck } from 'lucide-react';

export default function Payments() {
  const { data, loading, reload } = useAsync(() => paymentService.list(), []);
  const [edit, setEdit] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const clients = db.readSync('clients');

  const head = <PageHeader title="Payments" subtitle="Admin-verified payment records · you control every payment's status" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const collected = data.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const awaiting = data.filter((p) => ['pending', 'submitted'].includes(p.status)).length;
  const clientName = (id: string) => clients.find((c) => c.id === id)?.business || 'Unknown';

  const rows = statusFilter === 'all' ? data : data.filter((p) => p.status === statusFilter);

  const cols: Column<Payment>[] = [
    { key: 'client', header: 'Client', sortValue: (r) => clientName(r.clientId), render: (r) => {
      const c = clients.find((x) => x.id === r.clientId);
      return <div className="flex items-center gap-3"><Avatar text={c?.logoText || 'NF'} size={34} tone="violet" /><div><div className="font-bold text-content">{c?.business || 'Unknown'}</div><div className="text-xs text-muted">{r.planId ? planById(r.planId).name : '—'}</div></div></div>;
    }},
    { key: 'amount', header: 'Amount', sortValue: (r) => r.amount, render: (r) => <span className="font-bold text-content">{inr(r.amount)}</span> },
    { key: 'method', header: 'Method', hideOnMobile: true, render: (r) => r.method ? <Badge tone="neutral">{r.method}</Badge> : <span className="text-faint text-xs">—</span> },
    { key: 'reference', header: 'Reference', hideOnMobile: true, render: (r) => <span className="text-muted text-xs font-mono">{r.reference || '—'}</span> },
    { key: 'date', header: 'Date', hideOnMobile: true, sortValue: (r) => r.date, render: (r) => <span className="text-muted">{r.date ? fmtDate(r.date) : '—'}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="payment" value={r.status} dot /> },
    { key: 'actions', header: '', render: (r) => <button className="btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setEdit(r); }}>Manage</button> },
  ];

  return (
    <div>
      {head}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Collected" value={inr(collected)} icon={BadgeIndianRupee} sparkColor="#10B981" />
        <KpiCard label="Awaiting verification" value={String(awaiting)} icon={Clock} sparkColor="#F59E0B" />
        <KpiCard label="Payments" value={String(data.length)} icon={CreditCard} />
        <KpiCard label="Mode" value="Admin verified" icon={ShieldCheck} />
      </div>
      <DataTable rows={rows} columns={cols} onRowClick={(r) => setEdit(r)}
        searchKeys={[(r) => clientName(r.clientId), (r) => r.reference || '', (r) => r.method]}
        searchPlaceholder="Search payments…"
        filters={
          <select className="input sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {['all', 'pending', 'submitted', 'paid', 'partial', 'failed', 'refunded'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        } />
      {edit && <PaymentModal payment={edit} onClose={() => setEdit(null)} onUpdate={reload} />}
    </div>
  );
}

function PaymentModal({ payment, onClose, onUpdate }: { payment: Payment; onClose: () => void; onUpdate: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>(payment.status);
  const [reference, setReference] = useState(payment.reference || '');
  const [method, setMethod] = useState<string>(payment.method || 'UPI');
  const [notes, setNotes] = useState(payment.notes || '');
  const [saving, setSaving] = useState(false);
  const client = db.readSync('clients').find((c) => c.id === payment.clientId);

  const quick = async (s: PaymentStatus) => {
    setSaving(true);
    try { await paymentService.setStatus(payment.id, s, { reference, method: method as any, notes });
      toast(msg(s), 'success'); onUpdate(); onClose();
    } catch { toast('Unable to update payment.', 'error'); } finally { setSaving(false); }
  };
  const msg = (s: PaymentStatus) => s === 'paid' ? 'Payment marked as paid — client & subscription updated' : s === 'refunded' ? 'Payment refunded — client notified' : `Payment marked ${s} — client notified`;

  return (
    <Modal open onClose={onClose} title="Manage payment" size="md"
      footer={<>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={saving} onClick={() => quick(status)}>{saving ? 'Saving…' : 'Save status'}</button>
      </>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Avatar text={client?.logoText || 'NF'} size={40} tone="violet" /><div><p className="font-display font-extrabold text-content">{client?.business}</p><p className="text-xs text-muted">{payment.planId ? planById(payment.planId).name + ' · ' : ''}{inr(payment.amount)}</p></div></div>
          <StatusBadge kind="payment" value={payment.status} dot />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status"><Select value={status} onChange={(v) => setStatus(v as PaymentStatus)} options={['pending','submitted','paid','partial','failed','refunded'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} /></Field>
          <Field label="Method"><Select value={method} onChange={(v) => setMethod(v)} options={['UPI','Card','Bank Transfer'].map((m) => ({ value: m, label: m }))} /></Field>
        </div>
        <Field label="Payment reference"><input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. UPI/AXIS/8842190" /></Field>
        <Field label="Notes"><textarea className="input min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Verification notes…" /></Field>

        <div>
          <p className="label">Quick actions</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => quick('paid')}><ShieldCheck size={14} /> Mark Paid</button>
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => quick('partial')}>Partial</button>
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => quick('pending')}>Pending</button>
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => quick('failed')}>Failed</button>
            <button className="btn-outline btn-sm" disabled={saving} onClick={() => quick('refunded')}>Refund</button>
          </div>
          <p className="text-[11px] text-faint mt-2">Marking Paid activates the subscription and notifies the client. Admin verification is the source of truth until a payment gateway is connected.</p>
        </div>
      </div>
    </Modal>
  );
}
