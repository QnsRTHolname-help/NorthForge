import { TrendingUp, Users, Target, MessageCircle } from 'lucide-react';
import { PageHeader, SkeletonCards } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { AreaChart } from '@/components/charts/Charts';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';

export default function Conversions() {
  const { data, loading } = useAsync(async () => {
    const leads = await db.read('leads');
    const analytics = db.readSync('analytics');
    return { leads, analytics };
  }, []);

  const head = <PageHeader title="Conversions" subtitle="How visitors and leads turn into customers" />;
  if (loading || !data) return <div>{head}<SkeletonCards count={4} /></div>;

  const { leads, analytics } = data;
  const stages = [
    { label: 'New', count: leads.filter((l) => l.status === 'new').length },
    { label: 'Contacted', count: leads.filter((l) => l.status === 'contacted').length },
    { label: 'Qualified', count: leads.filter((l) => l.status === 'qualified').length },
    { label: 'Proposal', count: leads.filter((l) => l.status === 'proposal').length },
    { label: 'Negotiation', count: leads.filter((l) => l.status === 'negotiation').length },
    { label: 'Won', count: leads.filter((l) => l.status === 'won').length },
  ];
  const totalLeads = leads.length;
  const won = leads.filter((l) => l.status === 'won').length;
  const closable = leads.filter((l) => ['won', 'lost'].includes(l.status)).length || 1;
  const winRate = Math.round((won / closable) * 100);
  const totalVisitors = analytics.reduce((a, b) => a + b.visitors, 0);
  const totalLeadsFromSites = analytics.reduce((a, b) => a + b.leads, 0);
  const visitorConv = ((totalLeadsFromSites / totalVisitors) * 100).toFixed(2);
  const maxStage = Math.max(...stages.map((s) => s.count), 1);

  const merged = (analytics[0]?.trend || []).map((pt, i) => ({ label: pt.label, conversions: analytics.reduce((a, s) => a + (s.trend[i]?.conversions || 0), 0) }));

  return (
    <div>
      {head}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Win rate" value={`${winRate}%`} icon={TrendingUp} />
        <KpiCard label="Visitor → lead" value={`${visitorConv}%`} icon={Users} />
        <KpiCard label="Leads won" value={String(won)} icon={Target} sparkColor="#DB2777" />
        <KpiCard label="Total leads" value={String(totalLeads)} icon={MessageCircle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold text-content mb-4">Conversion funnel</h3>
          <div className="space-y-2.5">
            {stages.map((s, i) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium text-content">{s.label}</span><span className="text-muted">{s.count}</span></div>
                <div className="h-7 rounded-lg bg-line/60 overflow-hidden">
                  <div className="h-full rounded-lg bg-gradient-to-r from-brand to-brand flex items-center px-2 text-white text-xs font-semibold animate-grow-bar origin-left"
                    style={{ width: `${Math.max(8, (s.count / maxStage) * 100)}%`, opacity: 1 - i * 0.1 }}>
                    {maxStage > 0 && `${Math.round((s.count / totalLeads) * 100)}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-bold text-content mb-4">Conversion trend</h3>
          <AreaChart data={merged} valueKey="conversions" color="#22c55e" height={220} />
          <p className="text-xs text-muted mt-3">Conversions have trended upward over the tracked period across all client websites.</p>
        </div>
      </div>
    </div>
  );
}
