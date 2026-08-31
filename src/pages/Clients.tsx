import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { PageHeader, SkeletonList, ErrorState, Avatar, Badge, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { clientService } from '@/services';
import { db } from '@/services/db';
import { planById } from '@/data/catalog';
import type { Client } from '@/types';
import { cx } from '@/utils/format';

export default function Clients() {
  const nav = useNavigate();
  const { data, loading, error, reload } = useAsync(() => clientService.list(), []);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [create, setCreate] = useState(false);
  const [status, setStatus] = useState('all');

  const head = (
    <PageHeader title="Clients" subtitle="Every business NorthForge manages"
      actions={<>
        <div className="hidden sm:inline-flex rounded-xl border border-line p-0.5">
          <button className={cx('p-1.5 rounded-lg', view === 'grid' ? 'bg-brand/10 text-brand' : 'text-faint')} onClick={() => setView('grid')}><LayoutGrid size={16} /></button>
          <button className={cx('p-1.5 rounded-lg', view === 'table' ? 'bg-brand/10 text-brand' : 'text-faint')} onClick={() => setView('table')}><List size={16} /></button>
        </div>
        <button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Client</button>
      </>} />
  );

  if (loading) return <div>{head}<SkeletonList rows={6} /></div>;
  if (error || !data) return <div>{head}<ErrorState onRetry={reload} /></div>;

  const projects = db.readSync('projects');
  const websites = db.readSync('websites');
  const filtered = status === 'all' ? data : data.filter((c) => c.status === status);

  const cols: Column<Client>[] = [
    { key: 'business', header: 'Client', sortValue: (r) => r.business, render: (r) => (
      <div className="flex items-center gap-3"><Avatar text={r.logoText} size={34} /><div><div className="font-semibold text-content">{r.business}</div><div className="text-xs text-muted">{r.contact}</div></div></div>
    )},
    { key: 'industry', header: 'Industry', hideOnMobile: true, sortValue: (r) => r.industry, render: (r) => <span className="text-muted">{r.industry}</span> },
    { key: 'plan', header: 'Plan', sortValue: (r) => r.plan, render: (r) => <Badge tone={r.plan === 'pro' ? 'violet' : r.plan === 'growth' ? 'brand' : 'neutral'}>{planById(r.plan).name}</Badge> },
    { key: 'location', header: 'Location', hideOnMobile: true, render: (r) => <span className="text-muted">{r.location}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="client" value={r.status} dot /> },
  ];

  const filterEl = (
    <select className="input sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
      {['all', 'active', 'onboarding', 'prospect', 'paused', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}</option>)}
    </select>
  );

  return (
    <div>
      {head}
      {data.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="No clients yet" message="Create your first client to start managing projects."
          action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Client</button>} />
      ) : view === 'table' ? (
        <DataTable rows={filtered} columns={cols} onRowClick={(r) => nav(`/app/clients/${r.id}`)}
          searchKeys={[(r) => r.business, (r) => r.contact, (r) => r.industry]} searchPlaceholder="Search clients…" filters={filterEl} />
      ) : (
        <div>
          <div className="mb-4">{filterEl}</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const proj = projects.find((p) => p.clientId === c.id);
              const web = websites.find((w) => w.clientId === c.id);
              return (
                <button key={c.id} onClick={() => nav(`/app/clients/${c.id}`)} className="card card-hover p-5 text-left">
                  <div className="flex items-start justify-between">
                    <Avatar text={c.logoText} size={44} />
                    <StatusBadge kind="client" value={c.status} dot />
                  </div>
                  <h3 className="font-bold text-content mt-3">{c.business}</h3>
                  <p className="text-xs text-muted">{c.industry} · {c.location}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-line">
                    <Badge tone={c.plan === 'pro' ? 'violet' : c.plan === 'growth' ? 'brand' : 'neutral'}>{planById(c.plan).name}</Badge>
                    {web && <Badge tone="neutral">{web.domain}</Badge>}
                  </div>
                  {proj && <p className="text-xs text-muted mt-2">Project: {proj.progress}% · {proj.status}</p>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <CreateModal kind={create ? 'client' : null} onClose={() => setCreate(false)} onCreated={reload} />
    </div>
  );
}
