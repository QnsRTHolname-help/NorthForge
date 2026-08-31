import { useNavigate } from 'react-router-dom';
import { Send, Phone, MessageCircle, Mail, Check, Clock } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState, Avatar } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { useAsync } from '@/hooks/useAsync';
import { leadService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { fmtDate, cx } from '@/utils/format';

export default function FollowUps() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { data, loading, reload } = useAsync(() => leadService.list(), []);
  const head = <PageHeader title="Follow-ups" subtitle="Leads waiting to hear back from you" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const withFollowups = data.filter((l) => l.nextFollowUp && !['won', 'lost'].includes(l.status))
    .sort((a, b) => (a.nextFollowUp || '').localeCompare(b.nextFollowUp || ''));
  const today = new Date().toISOString().slice(0, 10);
  const overdue = withFollowups.filter((l) => (l.nextFollowUp || '').slice(0, 10) < today);
  const dueToday = withFollowups.filter((l) => (l.nextFollowUp || '').slice(0, 10) === today);
  const upcoming = withFollowups.filter((l) => (l.nextFollowUp || '').slice(0, 10) > today);

  const done = async (id: string, business: string) => { await leadService.update(id, { nextFollowUp: undefined, lastContact: new Date().toISOString() }); toast(`Followed up with ${business}`); reload(); };

  const Section = ({ title, items, tone }: { title: string; items: typeof withFollowups; tone: 'danger' | 'warning' | 'brand' }) => (
    items.length === 0 ? null : (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3"><h3 className="font-bold text-content">{title}</h3><span className={cx('badge', tone === 'danger' ? 'bg-rose-500/10 text-rose-500' : tone === 'warning' ? 'bg-amber-500/12 text-amber-500' : 'bg-brand/10 text-brand')}>{items.length}</span></div>
        <div className="space-y-2">
          {items.map((l) => (
            <div key={l.id} className="card p-4 flex items-center gap-3">
              <button onClick={() => nav(`/app/leads/${l.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Avatar text={l.business} size={38} />
                <div className="min-w-0"><p className="font-semibold text-content truncate">{l.business}</p><p className="text-xs text-muted">{l.contact || l.category} · <Clock size={11} className="inline" /> {fmtDate(l.nextFollowUp!)}</p></div>
              </button>
              <StatusBadge kind="lead" value={l.status} />
              <div className="flex gap-1">
                <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn-ghost !p-1.5" title="WhatsApp"><MessageCircle size={15} /></a>
                <a href={`tel:${l.phone}`} className="btn-ghost !p-1.5" title="Call"><Phone size={15} /></a>
                <a href={`mailto:${l.email}`} className="btn-ghost !p-1.5" title="Email"><Mail size={15} /></a>
                <button className="btn-ghost !p-1.5 text-emerald-500" title="Mark done" onClick={() => done(l.id, l.business)}><Check size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div>
      {head}
      {withFollowups.length === 0 ? (
        <EmptyState icon={Send} title="No follow-ups scheduled" message="Schedule a follow-up from any lead to see it here." />
      ) : <>
        <Section title="Overdue" items={overdue} tone="danger" />
        <Section title="Due today" items={dueToday} tone="warning" />
        <Section title="Upcoming" items={upcoming} tone="brand" />
      </>}
    </div>
  );
}
