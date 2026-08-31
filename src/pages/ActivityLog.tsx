import { PageHeader, SkeletonList, EmptyState, Avatar } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { activityService } from '@/services';
import { timeAgo, fmtDate } from '@/utils/format';
import { Activity } from 'lucide-react';

export default function ActivityLog() {
  const { data, loading } = useAsync(() => activityService.list(), []);
  const head = <PageHeader title="Activity" subtitle="Everything happening across NorthForge" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={6} /></div>;

  return (
    <div>
      {head}
      {data.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" message="Actions across the agency will be logged here." />
      ) : (
        <div className="card p-6">
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-line" />
            <div className="space-y-5">
              {data.map((a) => (
                <div key={a.id} className="flex gap-4 relative">
                  <Avatar text={a.actor === 'System' || a.actor === 'Workflow' ? 'SY' : a.actor} size={40} tone={a.actor === 'North Forge' ? 'ink' : 'violet'} />
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-content"><span className="font-semibold">{a.actor}</span> <span className="text-muted">{a.action}</span> <span className="font-medium">{a.resource}</span></p>
                    <p className="text-xs text-faint mt-0.5">{timeAgo(a.at)} · {fmtDate(a.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
