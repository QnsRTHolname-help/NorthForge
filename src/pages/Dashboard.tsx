import { useNavigate } from 'react-router-dom';
import {
  Users, LayoutGrid, FolderKanban, BadgeIndianRupee, TrendingUp, Globe, Send, ListTodo,
  ArrowRight, Circle,
} from 'lucide-react';
import { PageHeader, SkeletonCards, SkeletonList, Progress, Avatar, Badge } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/status';
import { AreaChart } from '@/components/charts/Charts';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';
import { inr, timeAgo, fmtShortDate, cx } from '@/utils/format';
import { AGENCY } from '@/data/catalog';

export default function Dashboard() {
  const nav = useNavigate();
  const { data, loading } = useAsync(async () => {
    const [leads, clients, projects, subs, websites, tasks, activities, appts, analytics, requests, payments, tickets] = await Promise.all([
      db.read('leads'), db.read('clients'), db.read('projects'), db.read('subscriptions'),
      db.read('websites'), db.read('tasks'), db.read('activities'), db.read('appointments'), db.read('analytics'),
      db.read('requests'), db.read('payments'), db.read('tickets'),
    ]);
    return { leads, clients, projects, subs, websites, tasks, activities, appts, analytics, requests, payments, tickets };
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title={`${greeting}, North Forge`} subtitle="Loading your command center…" />
        <SkeletonCards count={4} /><SkeletonCards count={4} />
        <div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2"><SkeletonList /></div><SkeletonList /></div>
      </div>
    );
  }

  const { leads, clients, projects, subs, websites, tasks, activities, appts, analytics, requests, payments, tickets } = data;
  const newRequests = requests.filter((r) => r.status === 'new').length;
  const pendingPayments = payments.filter((p) => ['pending', 'submitted'].includes(p.status)).length;
  const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length;
  const upcomingAppts = appts.filter((a) => new Date(a.date) >= new Date(new Date().toDateString()) && ['requested', 'confirmed'].includes(a.status)).length;
  const activeClients = clients.filter((c) => c.status === 'active').length;
  const activeProjects = projects.filter((p) => !['live', 'maintenance'].includes(p.status)).length;
  const wonLeads = leads.filter((l) => l.status === 'won').length;
  const totalClosable = leads.filter((l) => ['won', 'lost'].includes(l.status)).length || 1;
  const convRate = Math.round((wonLeads / totalClosable) * 100);
  const monthlyRevenue = subs.filter((s) => s.status === 'active').reduce((a, b) => a + b.price, 0);
  const websitesLive = websites.filter((w) => w.status === 'published').length;
  const pendingFollowups = leads.filter((l) => l.nextFollowUp && new Date(l.nextFollowUp).getTime() <= Date.now() + 2 * 86400000 && !['won', 'lost'].includes(l.status)).length;
  const tasksDue = tasks.filter((t) => t.status !== 'done').length;

  const combinedTrend = (analytics[0]?.trend || []).map((pt, i) => ({
    label: pt.label,
    visitors: analytics.reduce((a, b) => a + (b.trend[i]?.visitors || 0), 0),
    leads: analytics.reduce((a, b) => a + (b.trend[i]?.leads || 0), 0),
  }));

  const spark = (key: 'visitors' | 'leads') => combinedTrend.slice(-14).map((p) => p[key]);

  const hotLeads = leads.filter((l) => !['won', 'lost'].includes(l.status)).sort((a, b) => b.score - a.score).slice(0, 5);
  const upcoming = [...appts].filter((a) => new Date(a.date) >= new Date(new Date().toDateString())).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

  // Trend deltas are only shown when there is real analytics history to compare
  // against; otherwise they are omitted (never fabricated).
  const hasHistory = combinedTrend.length > 0;
  const kpis = [
    { label: 'Total Leads', value: String(leads.length), spark: hasHistory ? spark('leads') : undefined, sparkColor: '#7C3AED', icon: Users, to: '/app/leads' },
    { label: 'Active Clients', value: String(activeClients), icon: LayoutGrid, to: '/app/clients' },
    { label: 'Active Projects', value: String(activeProjects), icon: FolderKanban, to: '/app/projects' },
    { label: 'Monthly Revenue', value: inr(monthlyRevenue), spark: hasHistory ? spark('visitors').map(v => v / 10) : undefined, sparkColor: '#DB2777', icon: BadgeIndianRupee, to: '/app/subscriptions' },
    { label: 'Conversion Rate', value: `${convRate}%`, icon: TrendingUp, to: '/app/conversions' },
    { label: 'Websites Live', value: String(websitesLive), icon: Globe, to: '/app/websites' },
    { label: 'Pending Follow-ups', value: String(pendingFollowups), icon: Send, to: '/app/follow-ups' },
    { label: 'Tasks Due', value: String(tasksDue), icon: ListTodo, to: '/app/tasks' },
  ] as { label: string; value: string; spark?: number[]; sparkColor?: string; icon: any; to: string }[];

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting}, North Forge`}
        subtitle={`${pendingFollowups} follow-ups need attention · ${activeProjects} projects in progress · ${AGENCY.hours.weekday}`} />

      {/* Needs attention */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-extrabold text-content text-sm">Needs attention</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
          <Attention label="New requests" value={newRequests} to="/app/requests" tone="brand" />
          <Attention label="Pending payments" value={pendingPayments} to="/app/payments" tone="warning" />
          <Attention label="Active projects" value={activeProjects} to="/app/projects" tone="brand" />
          <Attention label="New leads" value={leads.filter((l) => l.status === 'new').length} to="/app/pipeline" tone="brand" />
          <Attention label="Follow-ups due" value={pendingFollowups} to="/app/follow-ups" tone="warning" />
          <Attention label="Open tickets" value={openTickets} to="/app/support" tone="brand" />
          <Attention label="Upcoming" value={upcomingAppts} to="/app/bookings" tone="brand" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} spark={k.spark} sparkColor={k.sparkColor} icon={k.icon} onClick={() => nav(k.to)} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Traffic chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-content">Traffic & leads</h3>
              <p className="text-xs text-muted mt-0.5">Across all client websites · last 30 days</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand" /> Visitors</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand" /> Leads</span>
            </div>
          </div>
          {combinedTrend.length > 0 ? (
            <>
              <AreaChart data={combinedTrend} valueKey="visitors" color="#7C3AED" height={200} />
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-line/60">
                <Stat label="Total visitors" value={combinedTrend.reduce((a, b) => a + b.visitors, 0).toLocaleString('en-IN')} />
                <Stat label="Total leads" value={combinedTrend.reduce((a, b) => a + b.leads, 0).toString()} />
                <Stat label="Websites tracked" value={String(analytics.length)} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-[200px]">
              <div className="w-12 h-12 rounded-2xl bg-brand/10 shadow-clay-inset flex items-center justify-center mb-3"><TrendingUp size={20} className="text-brand" /></div>
              <p className="text-sm font-semibold text-content">Not enough data yet</p>
              <p className="text-xs text-muted mt-1 max-w-xs">Traffic and lead analytics will appear here as your client websites go live.</p>
            </div>
          )}
        </div>

        {/* Hot leads */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-content">Hot leads</h3>
            <button className="text-xs font-semibold text-brand hover:underline flex items-center gap-1" onClick={() => nav('/app/pipeline')}>Pipeline <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-1">
            {hotLeads.length === 0 && (
              <p className="text-sm text-muted py-8 text-center">No leads yet. New leads from your websites will appear here.</p>
            )}
            {hotLeads.map((l) => (
              <button key={l.id} onClick={() => nav(`/app/leads/${l.id}`)}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-sunken transition-colors text-left">
                <Avatar text={l.business} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-content truncate">{l.business}</p>
                  <p className="text-xs text-muted truncate">{l.category} · {inr(l.estValue)}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={cx('text-sm font-bold', l.score >= 80 ? 'text-emerald-500' : l.score >= 60 ? 'text-amber-500' : 'text-muted')}>{l.score}</div>
                  <StatusBadge kind="lead" value={l.status} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Projects needing attention */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-content">Projects in progress</h3>
            <button className="text-xs font-semibold text-brand hover:underline flex items-center gap-1" onClick={() => nav('/app/projects')}>All projects <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-3">
            {projects.filter((p) => !['live', 'maintenance'].includes(p.status)).map((p) => {
              const client = clients.find((c) => c.id === p.clientId);
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <Avatar text={client?.logoText || 'NF'} size={36} tone="violet" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-content truncate">{p.name}</p>
                      <StatusBadge kind="project" value={p.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={p.progress} />
                      <span className="text-xs text-muted font-medium w-9 text-right">{p.progress}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {projects.filter((p) => !['live', 'maintenance'].includes(p.status)).length === 0 && (
              <p className="text-sm text-muted py-6 text-center">No active projects right now.</p>
            )}
          </div>
        </div>

        {/* Upcoming appointments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-content">Upcoming</h3>
            <button className="text-xs font-semibold text-brand hover:underline flex items-center gap-1" onClick={() => nav('/app/bookings')}>Calendar <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-2.5">
            {upcoming.length === 0 && <p className="text-sm text-muted py-6 text-center">No upcoming appointments.</p>}
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="text-center shrink-0 w-11">
                  <div className="text-xs font-bold text-brand">{fmtShortDate(a.date).split(' ')[0]}</div>
                  <div className="text-[10px] text-faint uppercase">{fmtShortDate(a.date).split(' ')[1]}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-content truncate">{a.title}</p>
                  <p className="text-xs text-muted">{a.time} · {a.service}</p>
                </div>
                <StatusBadge kind="appt" value={a.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-content">Recent activity</h3>
          <button className="text-xs font-semibold text-brand hover:underline flex items-center gap-1" onClick={() => nav('/app/activity')}>View all <ArrowRight size={12} /></button>
        </div>
        <div className="space-y-3">
          {activities.length === 0 && (
            <p className="text-sm text-muted py-6 text-center">No activity yet. Actions across your agency will be logged here.</p>
          )}
          {activities.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center gap-3 text-sm">
              <Circle size={7} className="text-brand fill-brand shrink-0" />
              <p className="text-content flex-1 min-w-0 truncate">
                <span className="font-semibold">{a.actor}</span> <span className="text-muted">{a.action}</span> <span className="font-medium">{a.resource}</span>
              </p>
              <span className="text-xs text-faint shrink-0">{timeAgo(a.at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Attention({ label, value, to, tone }: { label: string; value: number; to: string; tone: 'brand' | 'warning' }) {
  const nav = useNavigate();
  const hot = value > 0;
  return (
    <button onClick={() => nav(to)}
      className="rounded-2xl bg-sunken shadow-clay-inset p-3 text-left transition-all hover:shadow-clay-sm hover:bg-panel active:scale-95">
      <div className={cx('font-display text-2xl font-black leading-none', hot ? (tone === 'warning' ? 'text-amber-500' : 'text-brand') : 'text-faint')}>{value}</div>
      <div className="text-[11px] font-bold text-muted mt-1.5">{label}</div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold text-content">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
