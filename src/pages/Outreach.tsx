import { Target, Send, MessageSquare, Users, CalendarCheck, FileText, TrendingUp, MessageCircle, Mail, Phone } from 'lucide-react';
import { PageHeader, SkeletonCards, Badge } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';

const sequence = [
  { day: 'Day 0', title: 'Initial message', detail: 'Introduce NorthForge and the value we bring.', channel: 'WhatsApp' },
  { day: 'Day 2', title: 'Follow-up', detail: 'Gentle nudge with a relevant example.', channel: 'WhatsApp' },
  { day: 'Day 5', title: 'Value message', detail: 'Share a case study or a specific benefit.', channel: 'Email' },
  { day: 'Day 10', title: 'Final follow-up', detail: 'Last touch before moving to low-touch.', channel: 'Call' },
];

const channelIcon: Record<string, any> = { WhatsApp: MessageCircle, Email: Mail, Call: Phone };

export default function Outreach() {
  const { data, loading } = useAsync(async () => db.read('leads'), []);
  const head = <PageHeader title="Outreach" subtitle="Research, message and convert new prospects" />;
  if (loading || !data) return <div>{head}<SkeletonCards count={4} /></div>;

  const researched = data.length;
  const messaged = data.filter((l) => l.status !== 'new').length;
  const replies = data.filter((l) => ['contacted', 'qualified', 'proposal', 'negotiation', 'won'].includes(l.status)).length;
  const interested = data.filter((l) => ['qualified', 'proposal', 'negotiation', 'won'].includes(l.status)).length;
  const meetings = db.readSync('appointments').filter((a) => a.leadId).length;
  const proposals = db.readSync('proposals').length;
  const conversions = data.filter((l) => l.status === 'won').length;

  return (
    <div>
      {head}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Leads researched" value={String(researched)} icon={Users} />
        <KpiCard label="Messages sent" value={String(messaged)} icon={Send} sparkColor="#DB2777" />
        <KpiCard label="Replies" value={String(replies)} icon={MessageSquare} />
        <KpiCard label="Interested" value={String(interested)} icon={Target} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Meetings" value={String(meetings)} icon={CalendarCheck} />
        <KpiCard label="Proposals" value={String(proposals)} icon={FileText} />
        <KpiCard label="Conversions" value={String(conversions)} icon={TrendingUp} />
        <KpiCard label="Reply rate" value={`${Math.round((replies / (messaged || 1)) * 100)}%`} icon={MessageSquare} />
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-content mb-1">Outreach sequence</h3>
        <p className="text-sm text-muted mb-6">A four-touch sequence NorthForge runs for every new prospect.</p>
        <div className="relative">
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-line" />
          <div className="space-y-5">
            {sequence.map((s) => {
              const Icon = channelIcon[s.channel];
              return (
                <div key={s.day} className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0 z-10 border-4 border-panel"><Icon size={16} className="text-brand" /></div>
                  <div className="flex-1 card p-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap"><div className="flex items-center gap-2"><span className="text-xs font-bold text-brand">{s.day}</span><span className="font-semibold text-content">{s.title}</span></div><Badge tone="neutral">{s.channel}</Badge></div>
                    <p className="text-sm text-muted mt-1.5">{s.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
