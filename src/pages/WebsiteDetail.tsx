import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe, ShieldCheck, ShieldAlert, ExternalLink, Save } from 'lucide-react';
import { SkeletonList } from '@/components/ui/primitives';
import { RingProgress } from '@/components/charts/Charts';
import { StatusBadge } from '@/components/ui/status';
import { Field } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';
import { websiteService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { planById } from '@/data/catalog';
import { fmtDate, cx } from '@/utils/format';

const tabs = ['Overview', 'Deployment', 'Domain & SSL', 'SEO', 'Settings'] as const;

export default function WebsiteDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const { data, loading, reload } = useAsync(async () => {
    const w = (await db.read('websites')).find((x) => x.id === id);
    const c = db.readSync('clients').find((x) => x.id === w?.clientId);
    return { w, c };
  }, [id]);

  if (loading) return <SkeletonList rows={5} />;
  if (!data?.w) return <div className="text-center py-20"><p className="text-muted">Website not found.</p><Link to="/app/websites" className="btn-outline mt-4 inline-flex">Back</Link></div>;
  const { w, c } = data;

  return (
    <div>
      <button onClick={() => nav('/app/websites')} className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Back to websites</button>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center"><Globe size={22} className="text-brand" /></span>
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-content tracking-tight">{w.domain}</h1><StatusBadge kind="website" value={w.status} dot /></div>
            <p className="text-sm text-muted mt-0.5">{c?.business} · {planById(w.plan).name} plan</p>
          </div>
        </div>
        <a href={`https://${w.domain}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><ExternalLink size={14} /> Visit site</a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4 flex items-center gap-3"><RingProgress value={w.performance} size={56} label={String(w.performance)} /><div><p className="text-xs text-muted">Performance</p><p className="font-semibold text-content">{w.performance >= 90 ? 'Excellent' : w.performance ? 'Good' : 'Building'}</p></div></div>
        <div className="card p-4 flex items-center gap-3"><RingProgress value={w.seo} size={56} color="#DB2777" label={String(w.seo)} /><div><p className="text-xs text-muted">SEO score</p><p className="font-semibold text-content">{w.seo >= 85 ? 'Strong' : w.seo ? 'Fair' : 'Pending'}</p></div></div>
        <div className="card p-4"><p className="text-xs text-muted">Leads (30d)</p><p className="text-2xl font-bold text-content mt-1">{w.leads30d}</p></div>
        <div className="card p-4"><p className="text-xs text-muted">SSL</p><div className="mt-2">{w.ssl ? <span className="flex items-center gap-1.5 text-emerald-500 font-medium"><ShieldCheck size={16} /> Active</span> : <span className="flex items-center gap-1.5 text-amber-500 font-medium"><ShieldAlert size={16} /> Pending</span>}</div></div>
      </div>

      <div className="flex gap-1 border-b border-line overflow-x-auto mb-5">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cx('px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors', tab === t ? 'border-brand text-content' : 'border-transparent text-muted hover:text-content')}>{t}</button>)}
      </div>

      {tab === 'Overview' && <InfoGrid items={[['Domain', w.domain], ['Hosting', w.hosting], ['Plan', planById(w.plan).name], ['Status', w.status], ['WhatsApp', w.whatsappNumber], ['Last deploy', fmtDate(w.lastDeploy)]]} />}
      {tab === 'Deployment' && (
        <div className="card p-5 space-y-3">
          <InfoGrid items={[['Hosting', w.hosting], ['Last deployment', fmtDate(w.lastDeploy)], ['Status', w.status], ['SSL', w.ssl ? 'Active' : 'Pending']]} />
          <button className="btn-primary btn-sm" onClick={() => { websiteService.update(w.id, { lastDeploy: new Date().toISOString() }); toast('Deployment triggered'); reload(); }}>Trigger redeploy</button>
        </div>
      )}
      {tab === 'Domain & SSL' && <InfoGrid items={[['Domain', w.domain], ['SSL', w.ssl ? 'Active (HTTPS)' : 'Pending'], ['Hosting', w.hosting]]} />}
      {tab === 'SEO' && (
        <SEOEditor w={w} onSave={reload} />
      )}
      {tab === 'Settings' && (
        <SEOEditor w={w} onSave={reload} settings />
      )}
    </div>
  );
}

function InfoGrid({ items }: { items: [string, string][] }) {
  return <div className="grid sm:grid-cols-2 gap-3">{items.map(([k, v]) => <div key={k} className="card p-4 flex justify-between"><span className="text-muted text-sm">{k}</span><span className="font-medium text-content text-sm text-right">{v}</span></div>)}</div>;
}

function SEOEditor({ w, onSave, settings }: { w: any; onSave: () => void; settings?: boolean }) {
  const { toast } = useToast();
  const [f, setF] = useState({ seoTitle: w.seoTitle || '', seoDescription: w.seoDescription || '', whatsappNumber: w.whatsappNumber });
  const save = async () => { await websiteService.update(w.id, f); toast('Website settings saved'); onSave(); };
  return (
    <div className="card p-5 space-y-4 max-w-2xl">
      {!settings && <>
        <Field label="SEO title"><input className="input" value={f.seoTitle} onChange={(e) => setF({ ...f, seoTitle: e.target.value })} placeholder="Business — tagline" /></Field>
        <Field label="SEO description"><textarea className="input min-h-[80px]" value={f.seoDescription} onChange={(e) => setF({ ...f, seoDescription: e.target.value })} /></Field>
      </>}
      {settings && <Field label="WhatsApp number" hint="Where website enquiries are routed"><input className="input" value={f.whatsappNumber} onChange={(e) => setF({ ...f, whatsappNumber: e.target.value })} /></Field>}
      <button className="btn-primary btn-sm" onClick={save}><Save size={14} /> Save changes</button>
    </div>
  );
}
