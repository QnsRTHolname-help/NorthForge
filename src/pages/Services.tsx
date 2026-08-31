import { useState } from 'react';
import { Globe, ShieldCheck, MessageCircle, BarChart3, Workflow, Bot, Clock, Check } from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/primitives';
import { SERVICES, planById } from '@/data/catalog';
import type { ServiceCategory } from '@/types';
import { cx } from '@/utils/format';

const catIcon: Record<ServiceCategory, any> = {
  Website: Globe, Infrastructure: ShieldCheck, Marketing: MessageCircle, CRM: BarChart3,
  Automation: Workflow, AI: Bot, Analytics: BarChart3, Support: Clock,
};

export default function Services() {
  const cats = Array.from(new Set(SERVICES.map((s) => s.category)));
  const [cat, setCat] = useState<string>('all');
  const filtered = cat === 'all' ? SERVICES : SERVICES.filter((s) => s.category === cat);

  return (
    <div>
      <PageHeader title="Service Catalog" subtitle="Everything NorthForge offers — consistent across pricing, CRM & proposals" />
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setCat('all')} className={cx('chip', cat === 'all' && '!bg-brand !text-white !border-brand')}>All</button>
        {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={cx('chip', cat === c && '!bg-brand !text-white !border-brand')}>{c}</button>)}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const Icon = catIcon[s.category];
          return (
            <div key={s.id} className="card card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center"><Icon size={18} className="text-brand" /></div>
                <Badge tone={s.active ? 'success' : 'neutral'} dot>{s.active ? 'Active' : 'Inactive'}</Badge>
              </div>
              <h3 className="font-semibold text-content mt-3">{s.name}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{s.description}</p>
              <div className="mt-4 pt-3 border-t border-line">
                <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted">{s.category}</span><span className="text-xs font-medium text-content">{s.priceNote}</span></div>
                <div className="flex flex-wrap gap-1">
                  {s.includedIn.map((pid) => <span key={pid} className="badge bg-line/60 text-muted"><Check size={10} /> {planById(pid).name}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
