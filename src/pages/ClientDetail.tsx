import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Mail, Globe, Check } from 'lucide-react';
import { SkeletonList, Avatar, Badge, Progress } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';
import { planById, serviceById } from '@/data/catalog';
import { inr, fmtDate, cx } from '@/utils/format';

const tabs = ['Overview', 'Services', 'Projects', 'Websites', 'Billing'] as const;

export default function ClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const { data, loading } = useAsync(async () => {
    const c = (await db.read('clients')).find((x) => x.id === id);
    return { c, projects: db.readSync('projects').filter((p) => p.clientId === id),
      websites: db.readSync('websites').filter((w) => w.clientId === id),
      subs: db.readSync('subscriptions').filter((s) => s.clientId === id),
      invoices: db.readSync('invoices').filter((i) => i.clientId === id),
      leads: db.readSync('leads').filter((l) => l.business === c?.business),
      analytics: db.readSync('analytics').find((a) => a.clientId === id) };
  }, [id]);

  if (loading) return <SkeletonList rows={6} />;
  if (!data?.c) return <div className="text-center py-20"><p className="text-muted">Client not found.</p><Link to="/app/clients" className="btn-outline mt-4 inline-flex">Back to clients</Link></div>;
  const { c, projects, websites, subs, invoices, analytics } = data;
  const plan = planById(c.plan);
  const sub = subs[0];

  return (
    <div>
      <button onClick={() => nav('/app/clients')} className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Back to clients</button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <Avatar text={c.logoText} size={56} tone="violet" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-content tracking-tight">{c.business}</h1>
              <StatusBadge kind="client" value={c.status} dot />
            </div>
            <p className="text-sm text-muted mt-1">{c.contact} · {c.industry} · {c.location}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge tone={c.plan === 'pro' ? 'violet' : c.plan === 'growth' ? 'brand' : 'neutral'}>{plan.name} Plan</Badge>
              {c.domain && <Badge tone="neutral">{c.domain}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${c.phone}`} className="btn-outline btn-sm"><Phone size={14} /> Call</a>
          <a href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={14} /> WhatsApp</a>
          <a href={`mailto:${c.email}`} className="btn-outline btn-sm"><Mail size={14} /> Email</a>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Plan" value={plan.name} />
        <MiniStat label="Active projects" value={String(projects.filter((p) => !['live', 'maintenance'].includes(p.status)).length)} />
        <MiniStat label="Websites" value={String(websites.length)} />
        <MiniStat label="Leads (30d)" value={String(analytics?.leads ?? websites.reduce((a, w) => a + w.leads30d, 0))} />
      </div>

      <div className="flex gap-1 border-b border-line overflow-x-auto mb-5">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cx('px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
            tab === t ? 'border-brand text-content' : 'border-transparent text-muted hover:text-content')}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">Business details</h4>
            <dl className="space-y-2.5 text-sm">
              {[['Contact', c.contact], ['Email', c.email], ['Phone', c.phone], ['WhatsApp', c.whatsapp], ['Industry', c.industry], ['Location', c.location], ['Hours', c.hours || '—'], ['Client since', fmtDate(c.createdAt)]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="font-medium text-content text-right truncate">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="card p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">Subscription</h4>
            {sub ? (
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Plan</dt><dd className="font-medium text-content">{plan.name}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Price</dt><dd className="font-medium text-content">{inr(sub.price)} / 28 days</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Renews</dt><dd className="font-medium text-content">{fmtDate(sub.renewal)}</dd></div>
                <div className="flex justify-between items-center"><dt className="text-muted">Status</dt><dd><StatusBadge kind="sub" value={sub.status} /></dd></div>
              </dl>
            ) : <p className="text-sm text-muted">No active subscription.</p>}
          </div>
        </div>
      )}

      {tab === 'Services' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {c.services.map((sid) => {
            const s = serviceById(sid);
            if (!s) return null;
            return <div key={sid} className="card p-4 flex items-start gap-3"><Check size={16} className="text-emerald-500 mt-0.5 shrink-0" /><div><p className="text-sm font-semibold text-content">{s.name}</p><p className="text-xs text-muted mt-0.5">{s.category}</p></div></div>;
          })}
          {c.services.length === 0 && <p className="text-sm text-muted">No services assigned yet.</p>}
        </div>
      )}

      {tab === 'Projects' && (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between gap-2"><p className="font-semibold text-content">{p.name}</p><StatusBadge kind="project" value={p.status} /></div>
              <div className="flex items-center gap-2 mt-2"><Progress value={p.progress} /><span className="text-xs text-muted w-9 text-right">{p.progress}%</span></div>
              <p className="text-xs text-muted mt-2">Target launch: {fmtDate(p.targetLaunch)}</p>
            </div>
          ))}
          {projects.length === 0 && <p className="text-sm text-muted card p-6 text-center">No projects yet.</p>}
        </div>
      )}

      {tab === 'Websites' && (
        <div className="space-y-3">
          {websites.map((w) => (
            <button key={w.id} onClick={() => nav(`/app/websites/${w.id}`)} className="card card-hover p-4 w-full text-left">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2"><Globe size={16} className="text-brand" /><span className="font-semibold text-content">{w.domain}</span></div>
                <StatusBadge kind="website" value={w.status} />
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted"><span>SSL: {w.ssl ? 'Active' : 'Pending'}</span><span>Performance: {w.performance}</span><span>Leads: {w.leads30d}</span></div>
            </button>
          ))}
          {websites.length === 0 && <p className="text-sm text-muted card p-6 text-center">No websites yet.</p>}
        </div>
      )}

      {tab === 'Billing' && (
        <div className="space-y-3">
          {invoices.map((i) => (
            <div key={i.id} className="card p-4 flex items-center justify-between gap-3">
              <div><p className="font-semibold text-content text-sm">{i.number}</p><p className="text-xs text-muted">{fmtDate(i.date)} · due {fmtDate(i.due)}</p></div>
              <div className="text-right"><p className="font-bold text-content">{inr(i.amount)}</p><StatusBadge kind="invoice" value={i.status} /></div>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-sm text-muted card p-6 text-center">No invoices yet.</p>}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="card p-4"><div className="text-lg font-bold text-content">{value}</div><div className="text-xs text-muted">{label}</div></div>;
}
