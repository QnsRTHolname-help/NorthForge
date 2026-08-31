import { Check, Users, Send, UserPlus, BadgeIndianRupee, AlertTriangle, CalendarClock, MessageCircle, Globe, Zap, LifeBuoy } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { notificationService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { NotifType } from '@/types';
import { timeAgo, cx } from '@/utils/format';

const icons: Record<NotifType, any> = {
  lead: Users, 'follow-up': Send, client: UserPlus, payment: BadgeIndianRupee, overdue: AlertTriangle,
  deadline: CalendarClock, message: MessageCircle, website: Globe, automation: Zap, support: LifeBuoy,
};
const tones: Record<NotifType, string> = {
  lead: 'text-brand bg-brand/10', 'follow-up': 'text-brand bg-brand/10', client: 'text-emerald-500 bg-emerald-500/10',
  payment: 'text-emerald-500 bg-emerald-500/10', overdue: 'text-rose-500 bg-rose-500/10', deadline: 'text-amber-500 bg-amber-500/10',
  message: 'text-sky-500 bg-sky-500/10', website: 'text-brand bg-brand/10', automation: 'text-brand bg-brand/10', support: 'text-amber-500 bg-amber-500/10',
};

export default function Notifications() {
  const { data, loading, reload } = useAsync(() => notificationService.listFor('admin'), []);
  const { toast } = useToast();
  const head = (
    <PageHeader title="Notifications" subtitle="Everything that needs your attention"
      actions={<button className="btn-outline" onClick={async () => { await notificationService.markAllRead('admin'); toast('All marked as read'); reload(); }}><Check size={16} /> Mark all read</button>} />
  );
  if (loading || !data) return <div>{head}<SkeletonList rows={6} /></div>;

  return (
    <div>
      {head}
      {data.length === 0 ? (
        <EmptyState icon={Check} title="You're all caught up" message="New notifications will appear here." />
      ) : (
        <div className="card divide-y divide-line">
          {data.map((n) => {
            const Icon = icons[n.type];
            return (
              <button key={n.id} onClick={async () => { await notificationService.markRead(n.id); reload(); }}
                className={cx('w-full flex items-start gap-3 p-4 text-left hover:bg-surface/60 transition-colors', !n.read && 'bg-brand/[0.03]')}>
                <span className={cx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tones[n.type])}><Icon size={16} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="font-semibold text-content">{n.title}</p>{!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}</div>
                  <p className="text-sm text-muted mt-0.5">{n.body}</p>
                </div>
                <span className="text-xs text-faint shrink-0">{timeAgo(n.at)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
