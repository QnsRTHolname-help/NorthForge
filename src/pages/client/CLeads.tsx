import { PageHeader, EmptyState, Avatar, Badge } from '@/components/ui/primitives';
import { useClientData } from './useClient';
import { db } from '@/services/db';
import { Users, Phone, MessageCircle } from 'lucide-react';
import { timeAgo, inr } from '@/utils/format';

export default function CLeads() {
  const { client } = useClientData();
  // Client sees leads that came in for their business
  const leads = db.readSync('leads').filter((l) => l.business === client.business || l.category === client.industry).slice(0, 8);
  const analytics = db.readSync('analytics').find((a) => a.clientId === client.id);

  return (
    <div>
      <PageHeader title="My Leads" subtitle="Enquiries your website has generated" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Total enquiries" value={String(analytics?.leads ?? leads.length)} />
        <Stat label="This month" value={String(Math.round((analytics?.leads ?? 0) * 0.7))} />
        <Stat label="WhatsApp leads" value={String(analytics ? analytics.leadSources.find((s) => s.source.includes('WhatsApp'))?.value ?? 0 : 0) + '%'} />
        <Stat label="Conversion" value={`${analytics?.conversion ?? 0}%`} />
      </div>
      {leads.length === 0 ? (
        <EmptyState icon={Users} title="No leads yet" message="When your website generates enquiries, they'll appear here." />
      ) : (
        <div className="card divide-y divide-line">
          {leads.map((l) => (
            <div key={l.id} className="flex items-center gap-3 p-4">
              <Avatar text={l.contact || l.business} size={38} tone="violet" />
              <div className="flex-1 min-w-0"><p className="font-semibold text-content truncate">{l.contact || 'Website enquiry'}</p><p className="text-xs text-muted">{l.source} · {timeAgo(l.createdAt)}</p></div>
              <Badge tone="brand">{l.category}</Badge>
              <div className="flex gap-1">
                <a href={`tel:${l.phone}`} className="btn-ghost !p-1.5"><Phone size={14} /></a>
                <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5"><MessageCircle size={14} /></a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card p-4"><div className="text-2xl font-bold text-content">{value}</div><div className="text-xs text-muted mt-0.5">{label}</div></div>;
}
