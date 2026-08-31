import { useState } from 'react';
import { Users, Eye, MousePointerClick, MessageCircle, TrendingUp, Target } from 'lucide-react';
import { PageHeader, SkeletonCards } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { AreaChart, BarChart, Donut } from '@/components/charts/Charts';
import { useAsync } from '@/hooks/useAsync';
import { analyticsService } from '@/services';
import { db } from '@/services/db';
import { compact, cx } from '@/utils/format';

const RANGES = [{ id: 7, label: '7 days' }, { id: 30, label: '30 days' }, { id: 90, label: '90 days' }, { id: 365, label: '12 months' }];

export default function Analytics() {
  const { data, loading } = useAsync(() => analyticsService.list(), []);
  const [clientId, setClientId] = useState('all');
  const [range, setRange] = useState(30);
  const clients = db.readSync('clients');

  const head = <PageHeader title="Analytics" subtitle="Business performance across all client websites" />;
  if (loading || !data) return <div>{head}<SkeletonCards count={4} /></div>;

  const sets = clientId === 'all' ? data : data.filter((a) => a.clientId === clientId);
  const sum = (fn: (a: any) => number) => sets.reduce((acc, a) => acc + fn(a), 0);
  const visitors = sum((a) => a.visitors), pageViews = sum((a) => a.pageViews), sessions = sum((a) => a.sessions);
  const leads = sum((a) => a.leads), cta = sum((a) => a.ctaClicks), wa = sum((a) => a.whatsappClicks);
  const conv = visitors ? ((leads / visitors) * 100) : 0;

  const trendLen = range;
  const base = sets.reduce((best, s) => ((s.trend?.length || 0) > (best?.trend?.length || 0) ? s : best), sets[0]);
  const baseTrend = (base?.trend || []).slice(-trendLen);
  const merged = baseTrend.map((pt, i) => ({
    label: pt.label,
    visitors: sets.reduce((a, s) => a + (s.trend.slice(-trendLen)[i]?.visitors || 0), 0),
    leads: sets.reduce((a, s) => a + (s.trend.slice(-trendLen)[i]?.leads || 0), 0),
    conversions: sets.reduce((a, s) => a + (s.trend.slice(-trendLen)[i]?.conversions || 0), 0),
  }));

  const mergeBreakdown = (key: 'sources' | 'devices' | 'leadSources') => {
    const map: Record<string, number> = {};
    sets.forEach((s) => s[key].forEach((d: any) => { map[d.source || d.device] = (map[d.source || d.device] || 0) + d.value; }));
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(map).map(([k, v]) => ({ source: k, device: k, value: Math.round((v / total) * 100) }));
  };

  const topPages: Record<string, number> = {};
  sets.forEach((s) => s.topPages.forEach((p: any) => { topPages[p.page] = (topPages[p.page] || 0) + p.views; }));
  const pages = Object.entries(topPages).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxPage = pages[0]?.[1] || 1;

  return (
    <div>
      {head}
      <div className="flex flex-wrap gap-2 mb-5">
        <select className="input sm:w-56" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="all">All websites</option>
          {data.map((a) => <option key={a.clientId} value={a.clientId}>{clients.find((c) => c.id === a.clientId)?.business}</option>)}
        </select>
        <div className="inline-flex rounded-xl border border-line p-0.5">
          {RANGES.map((r) => <button key={r.id} onClick={() => setRange(r.id)} className={cx('px-3 py-1.5 rounded-lg text-sm font-medium', range === r.id ? 'bg-brand/10 text-brand' : 'text-muted')}>{r.label}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Visitors" value={compact(visitors)} icon={Users} spark={merged.map((m) => m.visitors)} />
        <KpiCard label="Page views" value={compact(pageViews)} icon={Eye} />
        <KpiCard label="Leads" value={String(leads)} icon={Target} sparkColor="#DB2777" spark={merged.map((m) => m.leads)} />
        <KpiCard label="Conversion rate" value={`${conv.toFixed(2)}%`} icon={TrendingUp} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Unique sessions" value={compact(sessions)} icon={Users} />
        <KpiCard label="CTA clicks" value={compact(cta)} icon={MousePointerClick} />
        <KpiCard label="WhatsApp clicks" value={compact(wa)} icon={MessageCircle} />
        <KpiCard label="Websites" value={String(sets.length)} icon={Eye} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-content">Traffic trend</h3><div className="flex gap-3 text-xs"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand" /> Visitors</span></div></div>
          <AreaChart data={merged} valueKey="visitors" color="#7C3AED" height={220} />
        </div>
        <div className="card p-5"><h3 className="font-bold text-content mb-4">Traffic sources</h3><Donut data={mergeBreakdown('sources')} /></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5"><h3 className="font-bold text-content mb-4">Lead trend</h3><BarChart data={merged} valueKey="leads" color="#DB2777" height={180} /></div>
        <div className="card p-5"><h3 className="font-bold text-content mb-4">Devices</h3><Donut data={mergeBreakdown('devices')} /></div>
        <div className="card p-5">
          <h3 className="font-bold text-content mb-4">Top pages</h3>
          <div className="space-y-2.5">
            {pages.map(([page, views]) => (
              <div key={page}>
                <div className="flex justify-between text-xs mb-1"><span className="text-content font-medium">{page}</span><span className="text-muted">{compact(views)}</span></div>
                <div className="h-1.5 rounded-full bg-line/70 overflow-hidden"><div className="h-full rounded-full bg-brand animate-grow-bar origin-left" style={{ width: `${(views / maxPage) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5"><h3 className="font-bold text-content mb-4">Lead sources</h3><Donut data={mergeBreakdown('leadSources')} /></div>
        <div className="card p-5 flex flex-col justify-center">
          <h3 className="font-bold text-content mb-2">Conversion trend</h3>
          <AreaChart data={merged} valueKey="conversions" color="#22c55e" height={140} />
        </div>
      </div>
    </div>
  );
}
