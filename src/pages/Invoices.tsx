import { useState } from 'react';
import { Plus, Receipt, Check } from 'lucide-react';
import { PageHeader, SkeletonList, Avatar, Badge, EmptyState } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { billingService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import { planById } from '@/data/catalog';
import type { Invoice } from '@/types';
import { inr, fmtDate } from '@/utils/format';

export default function Invoices() {
  const { data, loading, reload } = useAsync(() => billingService.invoices(), []);
  const [create, setCreate] = useState(false);
  const { toast } = useToast();
  const clients = db.readSync('clients');

  const head = <PageHeader title="Invoices" subtitle="Billing across all clients"
    actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Invoice</button>} />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const paid = data.filter((i) => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
  const outstanding = data.filter((i) => ['due', 'overdue'].includes(i.status)).reduce((a, i) => a + i.amount, 0);
  const overdue = data.filter((i) => i.status === 'overdue').length;

  const cols: Column<Invoice>[] = [
    { key: 'number', header: 'Invoice', sortValue: (r) => r.number, render: (r) => {
      const c = clients.find((x) => x.id === r.clientId);
      return <div className="flex items-center gap-3"><Avatar text={c?.logoText || 'NF'} size={34} tone="violet" /><div><div className="font-semibold text-content">{r.number}</div><div className="text-xs text-muted">{c?.business}</div></div></div>;
    }},
    { key: 'amount', header: 'Amount', sortValue: (r) => r.amount, render: (r) => <span className="font-semibold text-content">{inr(r.amount)}</span> },
    { key: 'date', header: 'Date', hideOnMobile: true, sortValue: (r) => r.date, render: (r) => <span className="text-muted">{fmtDate(r.date)}</span> },
    { key: 'due', header: 'Due', hideOnMobile: true, sortValue: (r) => r.due, render: (r) => <span className="text-muted">{fmtDate(r.due)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="invoice" value={r.status} dot /> },
    { key: 'actions', header: '', render: (r) => r.status !== 'paid' ? (
      <button className="btn-ghost btn-sm text-emerald-500" onClick={(e) => { e.stopPropagation(); billingService.recordPayment({ clientId: r.clientId, invoiceId: r.id, amount: r.amount }).then(() => { toast('Payment recorded'); reload(); }); }}><Check size={14} /> Mark paid</button>
    ) : <span className="text-xs text-emerald-500 font-medium">Paid</span> },
  ];

  return (
    <div>
      {head}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Collected" value={inr(paid)} icon={Receipt} />
        <KpiCard label="Outstanding" value={inr(outstanding)} icon={Receipt} sparkColor="#f59e0b" />
        <KpiCard label="Overdue invoices" value={String(overdue)} icon={Receipt} />
        <KpiCard label="Total invoices" value={String(data.length)} icon={Receipt} />
      </div>
      {data.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices yet" message="Create an invoice to bill a client."
          action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Invoice</button>} />
      ) : (
        <DataTable rows={data} columns={cols} searchKeys={[(r) => r.number, (r) => clients.find((c) => c.id === r.clientId)?.business || '']} searchPlaceholder="Search invoices…" />
      )}
      <CreateModal kind={create ? 'invoice' : null} onClose={() => setCreate(false)} onCreated={reload} />
    </div>
  );
}
