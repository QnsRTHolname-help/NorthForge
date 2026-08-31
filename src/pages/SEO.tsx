import { Search, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader, SkeletonList, Badge } from '@/components/ui/primitives';
import { RingProgress } from '@/components/charts/Charts';
import { useAsync } from '@/hooks/useAsync';
import { websiteService } from '@/services';
import { db } from '@/services/db';
import { cx } from '@/utils/format';

const checks = ['Meta title & description', 'Mobile responsiveness', 'Page speed', 'HTTPS/SSL', 'Structured data', 'Image alt text'];

export default function SEO() {
  const { data, loading } = useAsync(() => websiteService.list(), []);
  const clients = db.readSync('clients');
  const head = <PageHeader title="SEO" subtitle="Search visibility and optimization across websites" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const live = data.filter((w) => w.seo > 0);
  const avg = Math.round(live.reduce((a, w) => a + w.seo, 0) / (live.length || 1));

  return (
    <div>
      {head}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-5 flex items-center gap-4"><RingProgress value={avg} size={68} color="#DB2777" label={String(avg)} /><div><p className="text-sm text-muted">Average SEO score</p><p className="text-lg font-bold text-content">{avg >= 85 ? 'Strong' : 'Improving'}</p></div></div>
        <div className="card p-5"><p className="text-sm text-muted">Websites optimized</p><p className="text-2xl font-bold text-content mt-1">{live.length}/{data.length}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">Total leads (30d)</p><p className="text-2xl font-bold text-content mt-1">{data.reduce((a, w) => a + w.leads30d, 0)}</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {data.map((w) => {
          const c = clients.find((x) => x.id === w.clientId);
          return (
            <div key={w.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Search size={16} className="text-brand" /><div><p className="font-semibold text-content">{w.domain}</p><p className="text-xs text-muted">{c?.business}</p></div></div>
                <RingProgress value={w.seo} size={52} color="#DB2777" label={String(w.seo)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {checks.map((chk, i) => {
                  const pass = w.seo > 0 && (i < 4 || w.seo > 85);
                  return <div key={chk} className="flex items-center gap-2 text-xs">{pass ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertCircle size={14} className="text-amber-500" />}<span className={cx(pass ? 'text-muted' : 'text-content')}>{chk}</span></div>;
                })}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-line text-xs text-muted"><TrendingUp size={13} className="text-emerald-500" /> {w.leads30d} leads generated in the last 30 days</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
