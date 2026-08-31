import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { useClientData } from './useClient';
import { CalendarClock } from 'lucide-react';
import { fmtDate } from '@/utils/format';

export default function CBookings() {
  const { appointments } = useClientData();
  return (
    <div>
      <PageHeader title="Bookings" subtitle="Appointments and consultations" />
      {appointments.length === 0 ? <EmptyState icon={CalendarClock} title="No upcoming appointments" message="Bookings made through your website will appear here." /> : (
        <div className="grid sm:grid-cols-2 gap-3">
          {appointments.map((a) => (
            <div key={a.id} className="card p-4"><div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-content">{fmtDate(a.date)}</span><StatusBadge kind="appt" value={a.status} /></div><p className="text-sm text-content">{a.title}</p><p className="text-xs text-muted mt-1">{a.time} · {a.service}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}
