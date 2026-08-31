import { PageHeader, SkeletonList, Avatar, Badge } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useAsync } from '@/hooks/useAsync';
import { billingService } from '@/services';
import { db } from '@/services/db';
import { planById } from '@/data/catalog';
import type { Subscription } from '@/types';
import { inr, fmtDate } from '@/utils/format';
import { BadgeIndianRupee, RefreshCw, Users, AlertTriangle } from 'lucide-react';

export default function Subscriptions() {
  const { data, loading } = useAsync(() => billingService.subscriptions(), []);
  const clients = db.readSync('clients');
  const head = <PageHeader title="Subscriptions" subtitle="Recurring revenue across all clients" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const active = data.filter((s) => s.status === 'active');
  const mrr = active.reduce((a, s) => a + s.price, 0);
  const pastDue = data.filter((s) => s.status === 'past-due').length;

  const cols: Column<Subscription>[] = [
    { key: 'client', header: 'Client', sortValue: (r) => clients.find((c) => c.id === r.clientId)?.business || '', render: (r) => {
      const c = clients.find((x) => x.id === r.clientId);
      return <div className="flex items-center gap-3"><Avatar text={c?.logoText || 'NF'} size={34} tone="violet" /><span className="font-semibold text-content">{c?.business}</span></div>;
    }},
    { key: 'plan', header: 'Plan', sortValue: (r) => r.plan, render: (r) => <Badge tone={r.plan === 'pro' ? 'violet' : r.plan === 'growth' ? 'brand' : 'neutral'}>{planById(r.plan).name}</Badge> },
    { key: 'price', header: 'Price', sortValue: (r) => r.price, render: (r) => <span className="font-medium text-content">{inr(r.price)}<span className="text-xs text-faint"> / 28d</span></span> },
    { key: 'renewal', header: 'Renews', hideOnMobile: true, sortValue: (r) => r.renewal, render: (r) => <span className="text-muted">{fmtDate(r.renewal)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="sub" value={r.status} dot /> },
  ];

  return (
    <div>
      {head}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Monthly recurring" value={inr(mrr)} icon={BadgeIndianRupee} sparkColor="#DB2777" />
        <KpiCard label="Active subscriptions" value={String(active.length)} icon={Users} />
        <KpiCard label="Annual run rate" value={inr(mrr * 13)} icon={RefreshCw} />
        <KpiCard label="Past due" value={String(pastDue)} icon={AlertTriangle} />
      </div>
      <DataTable rows={data} columns={cols} searchKeys={[(r) => clients.find((c) => c.id === r.clientId)?.business || '']} searchPlaceholder="Search subscriptions…" />
    </div>
  );
}
