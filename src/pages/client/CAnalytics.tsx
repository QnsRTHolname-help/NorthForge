import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { AreaChart, Donut } from '@/components/charts/Charts';
import { useClientData } from './useClient';
import { compact } from '@/utils/format';
import { BarChart3, Users, MessageCircle, TrendingUp, Sparkles } from 'lucide-react';

export default function CAnalytics() {
  const { analytics } = useClientData();
  if (!analytics) return <div><PageHeader title="My Analytics" /><EmptyState icon={BarChart3} title="No analytics yet" message="Your website analytics will appear here once your site is live and receiving visitors." /></div>;
  const trend = analytics.trend.slice(-30);
  const lastWeek = trend.slice(-14, -7).reduce((a, p) => a + p.leads, 0);
  const thisWeek = trend.slice(-7).reduce((a, p) => a + p.leads, 0);

  return (
    <div>
      <PageHeader title="My Analytics" subtitle="How your website is performing" />
      <div className="card p-5 mb-5 bg-gradient-to-br from-brand/[0.06] to-brand/[0.06] border-brand/20 flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0"><Sparkles size={18} className="text-brand" /></span>
        <div><h3 className="font-bold text-content">In plain language</h3><p className="text-sm text-muted mt-1">{thisWeek >= lastWeek ? `Your website generated more enquiries this week than last week (${thisWeek} vs ${lastWeek}). Most visitors come from mobile and reach you via WhatsApp.` : `Your website had ${thisWeek} enquiries this week. Traffic is steady — sharing your site on WhatsApp and Instagram can bring more visitors.`}</p></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Visitors" value={compact(analytics.visitors)} icon={Users} spark={trend.map((t) => t.visitors)} />
        <KpiCard label="Enquiries" value={String(analytics.leads)} icon={TrendingUp} sparkColor="#DB2777" spark={trend.map((t) => t.leads)} />
        <KpiCard label="WhatsApp clicks" value={String(analytics.whatsappClicks)} icon={MessageCircle} />
        <KpiCard label="Conversion" value={`${analytics.conversion}%`} icon={TrendingUp} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5"><h3 className="font-bold text-content mb-4">Visitors over time</h3><AreaChart data={trend} valueKey="visitors" height={220} /></div>
        <div className="card p-5"><h3 className="font-bold text-content mb-4">Where visitors come from</h3><Donut data={analytics.sources} /></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-5"><h3 className="font-bold text-content mb-4">Popular pages</h3><div className="space-y-2.5">{analytics.topPages.map((p) => { const max = analytics.topPages[0].views; return <div key={p.page}><div className="flex justify-between text-xs mb-1"><span className="text-content font-medium">{p.page}</span><span className="text-muted">{compact(p.views)}</span></div><div className="h-1.5 rounded-full bg-line/70 overflow-hidden"><div className="h-full rounded-full bg-brand animate-grow-bar origin-left" style={{ width: `${(p.views / max) * 100}%` }} /></div></div>; })}</div></div>
        <div className="card p-5"><h3 className="font-bold text-content mb-4">How leads reach you</h3><Donut data={analytics.leadSources} /></div>
      </div>
    </div>
  );
}
