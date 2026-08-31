import { PageHeader, EmptyState, Avatar, Badge } from '@/components/ui/primitives';
import { useClientData } from './useClient';
import { MessageCircle } from 'lucide-react';
import { timeAgo } from '@/utils/format';
import { waLink, waMessages } from '@/utils/contact';

export default function CWhatsApp() {
  const { messages, website, client } = useClientData();
  const number = website?.whatsappNumber || client.whatsapp;
  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Messages from your website visitors"
        actions={<a href={waLink(waMessages.support)} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> Message NorthForge</a>} />
      <div className="card p-4 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3"><span className="w-10 h-10 rounded-2xl bg-clay-success/12 shadow-clay-inset flex items-center justify-center"><MessageCircle size={18} className="text-clay-success" /></span><div><p className="font-bold text-content">{number}</p><p className="text-xs text-muted">Your business WhatsApp</p></div></div>
        <Badge tone="success" dot>Connected</Badge>
      </div>
      {messages.length === 0 ? <EmptyState icon={MessageCircle} title="No messages yet" message="Messages from your website's WhatsApp button will appear here." /> : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`card p-4 flex gap-3 ${m.direction === 'out' ? 'bg-brand/[0.03]' : ''}`}>
              <Avatar text={m.direction === 'in' ? m.from.slice(-2) : client.logoText} size={38} tone={m.direction === 'out' ? 'violet' : 'ink'} />
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-content">{m.direction === 'in' ? m.from : 'You'}</span><span className="text-xs text-faint">{timeAgo(m.at)}</span></div><p className="text-sm text-muted mt-1">{m.body}</p></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
