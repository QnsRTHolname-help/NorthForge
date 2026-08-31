import { ExternalLink, ShieldCheck, ShieldAlert, Globe } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { RingProgress } from '@/components/charts/Charts';
import { useClientData } from './useClient';
import { fmtDate } from '@/utils/format';

export default function CWebsite() {
  const { website, client } = useClientData();
  if (!website) return <div><PageHeader title="My Website" /><EmptyState icon={Globe} title="Website in progress" message="Your website is being built. We'll notify you the moment it's live." /></div>;
  return (
    <div>
      <PageHeader title="My Website" subtitle="Your live website, hosted & maintained by NorthForge"
        actions={<a href={`https://${website.domain}`} target="_blank" rel="noreferrer" className="btn-outline"><ExternalLink size={16} /> Visit site</a>} />
      <div className="card p-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center"><Globe size={22} className="text-brand" /></span><div><p className="font-bold text-content text-lg">{website.domain}</p><p className="text-sm text-muted">Hosted on {website.hosting}</p></div></div>
        <StatusBadge kind="website" value={website.status} dot />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-5 flex items-center gap-3"><RingProgress value={website.performance} size={60} label={String(website.performance)} /><div><p className="text-xs text-muted">Performance</p><p className="font-semibold text-content">{website.performance >= 90 ? 'Excellent' : 'Good'}</p></div></div>
        <div className="card p-5 flex items-center gap-3"><RingProgress value={website.seo} size={60} color="#DB2777" label={String(website.seo)} /><div><p className="text-xs text-muted">SEO</p><p className="font-semibold text-content">{website.seo >= 85 ? 'Strong' : 'Fair'}</p></div></div>
        <div className="card p-5"><p className="text-xs text-muted">Leads (30 days)</p><p className="text-2xl font-bold text-content mt-1">{website.leads30d}</p></div>
        <div className="card p-5"><p className="text-xs text-muted mb-2">Security (SSL)</p>{website.ssl ? <span className="flex items-center gap-1.5 text-emerald-500 font-medium"><ShieldCheck size={16} /> Secure</span> : <span className="flex items-center gap-1.5 text-amber-500 font-medium"><ShieldAlert size={16} /> Setting up</span>}</div>
      </div>
      <div className="card p-6 mt-4"><h3 className="font-bold text-content mb-3">Details</h3><div className="grid sm:grid-cols-2 gap-3 text-sm">{[['Domain', website.domain],['WhatsApp number', website.whatsappNumber],['Last update', fmtDate(website.lastDeploy)],['Hosting', website.hosting]].map(([k,v]) => <div key={k} className="flex justify-between rounded-xl bg-surface border border-line px-3 py-2.5"><span className="text-muted">{k}</span><span className="font-medium text-content">{v}</span></div>)}</div></div>
    </div>
  );
}
