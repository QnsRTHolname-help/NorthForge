import { useNavigate } from 'react-router-dom';
import { Globe, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PageHeader, SkeletonList, Badge } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useAsync } from '@/hooks/useAsync';
import { websiteService } from '@/services';
import { db } from '@/services/db';
import { planById } from '@/data/catalog';
import type { Website } from '@/types';
import { fmtShortDate, cx } from '@/utils/format';

export default function Websites() {
  const nav = useNavigate();
  const { data, loading } = useAsync(() => websiteService.list(), []);
  const clients = db.readSync('clients');

  const head = <PageHeader title="Websites" subtitle="Every client website NorthForge hosts & maintains" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const cols: Column<Website>[] = [
    { key: 'domain', header: 'Website', sortValue: (r) => r.domain, render: (r) => {
      const c = clients.find((x) => x.id === r.clientId);
      return <div className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0"><Globe size={16} className="text-brand" /></span><div><div className="font-semibold text-content">{r.domain}</div><div className="text-xs text-muted">{c?.business}</div></div></div>;
    }},
    { key: 'plan', header: 'Plan', hideOnMobile: true, sortValue: (r) => r.plan, render: (r) => <Badge tone={r.plan === 'pro' ? 'violet' : r.plan === 'growth' ? 'brand' : 'neutral'}>{planById(r.plan).name}</Badge> },
    { key: 'ssl', header: 'SSL', hideOnMobile: true, render: (r) => r.ssl ? <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium"><ShieldCheck size={14} /> Active</span> : <span className="flex items-center gap-1 text-amber-500 text-xs font-medium"><ShieldAlert size={14} /> Pending</span> },
    { key: 'perf', header: 'Performance', hideOnMobile: true, sortValue: (r) => r.performance, render: (r) => r.performance ? <span className={cx('font-semibold', r.performance >= 90 ? 'text-emerald-500' : 'text-amber-500')}>{r.performance}</span> : <span className="text-faint">—</span> },
    { key: 'seo', header: 'SEO', hideOnMobile: true, sortValue: (r) => r.seo, render: (r) => r.seo ? <span className="text-content font-medium">{r.seo}</span> : <span className="text-faint">—</span> },
    { key: 'leads', header: 'Leads (30d)', hideOnMobile: true, sortValue: (r) => r.leads30d, render: (r) => <span className="text-content font-medium">{r.leads30d}</span> },
    { key: 'deploy', header: 'Last deploy', hideOnMobile: true, sortValue: (r) => r.lastDeploy, render: (r) => <span className="text-muted">{fmtShortDate(r.lastDeploy)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="website" value={r.status} dot /> },
  ];

  return (
    <div>
      {head}
      <DataTable rows={data} columns={cols} onRowClick={(r) => nav(`/app/websites/${r.id}`)}
        searchKeys={[(r) => r.domain, (r) => clients.find((c) => c.id === r.clientId)?.business || '']} searchPlaceholder="Search websites…" />
    </div>
  );
}
