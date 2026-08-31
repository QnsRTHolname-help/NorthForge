import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { CreateModal } from '@/components/forms/QuickCreate';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { appointmentService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import type { Appointment, ApptStatus } from '@/types';
import { fmtDate, cx } from '@/utils/format';

export default function Bookings() {
  const { data, loading, reload } = useAsync(() => appointmentService.list(), []);
  const [create, setCreate] = useState(false);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [cursor, setCursor] = useState(new Date('2026-08-20'));
  const [detail, setDetail] = useState<Appointment | null>(null);

  const head = <PageHeader title="Bookings & Appointments" subtitle="Consultations, reviews and client calls"
    actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Appointment</button>} />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const startDay = monthStart.getDay();
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));

  const apptsOn = (d: Date) => data.filter((a) => a.date === d.toISOString().slice(0, 10));
  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const shift = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));

  return (
    <div>
      {head}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
          <span className="font-bold text-content min-w-[140px] text-center">{monthLabel}</span>
          <button className="btn-outline btn-sm" onClick={() => shift(1)}><ChevronRight size={16} /></button>
        </div>
        <div className="inline-flex rounded-xl border border-line p-0.5">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cx('px-3 py-1.5 rounded-lg text-sm font-medium capitalize', view === v ? 'bg-brand/10 text-brand' : 'text-muted')}>{v}</button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="px-2 py-2 text-xs font-bold text-faint text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => (
              <div key={i} className={cx('min-h-[92px] border-b border-r border-line/60 p-1.5', !d && 'bg-surface/40', i % 7 === 6 && 'border-r-0')}>
                {d && <>
                  <div className={cx('text-xs font-semibold mb-1', d.toISOString().slice(0,10) === '2026-08-20' ? 'text-brand' : 'text-muted')}>{d.getDate()}</div>
                  <div className="space-y-1">
                    {apptsOn(d).slice(0, 2).map((a) => (
                      <button key={a.id} onClick={() => setDetail(a)} className="w-full text-left px-1.5 py-1 rounded-md bg-brand/10 text-[10px] font-medium text-brand truncate hover:bg-brand/20 transition-colors">{a.time} {a.who}</button>
                    ))}
                    {apptsOn(d).length > 2 && <span className="text-[10px] text-faint px-1.5">+{apptsOn(d).length - 2} more</span>}
                  </div>
                </>}
              </div>
            ))}
          </div>
        </div>
      )}

      {view !== 'month' && (
        <div className="space-y-2">
          {[...data].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((a) => (
            <button key={a.id} onClick={() => setDetail(a)} className="card card-hover p-4 w-full text-left flex items-center gap-4">
              <div className="text-center shrink-0 w-14"><div className="text-xs font-bold text-brand">{fmtDate(a.date, { day: 'numeric', month: 'short' })}</div><div className="text-sm font-bold text-content">{a.time}</div></div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-content truncate">{a.title}</p><p className="text-xs text-muted">{a.who} · {a.service}</p></div>
              <StatusBadge kind="appt" value={a.status} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-bold text-content mb-3">Upcoming appointments</h3>
        {data.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No upcoming appointments" message="Schedule a consultation or client call to see it here."
            action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Appointment</button>} />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {[...data].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 6).map((a) => (
              <button key={a.id} onClick={() => setDetail(a)} className="card card-hover p-4 text-left">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-content">{fmtDate(a.date)}</span><StatusBadge kind="appt" value={a.status} /></div>
                <p className="text-sm text-content mt-2">{a.title}</p>
                <p className="text-xs text-muted mt-1">{a.time} · {a.who}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateModal kind={create ? 'appointment' : null} onClose={() => setCreate(false)} onCreated={reload} />
      {detail && <ApptDetail appt={detail} onClose={() => setDetail(null)} onUpdate={reload} />}
    </div>
  );
}

function ApptDetail({ appt, onClose, onUpdate }: { appt: Appointment; onClose: () => void; onUpdate: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<ApptStatus>(appt.status);
  const client = db.readSync('clients').find((c) => c.id === appt.clientId);
  const save = async () => { await appointmentService.update(appt.id, { status }); toast('Appointment updated'); onUpdate(); onClose(); };
  return (
    <Modal open onClose={onClose} title={appt.title} size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Close</button><button className="btn-primary" onClick={save}>Save</button></>}>
      <div className="space-y-3 text-sm">
        <Row label="With" value={appt.who} /><Row label="Service" value={appt.service} />
        <Row label="Date" value={`${fmtDate(appt.date)} at ${appt.time}`} />
        {client && <Row label="Client" value={client.business} />}
        <div><label className="label">Status</label>
          <Select value={status} onChange={(v) => setStatus(v as ApptStatus)} options={['requested','confirmed','completed','cancelled','no-show'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1).replace('-', ' ') }))} />
        </div>
      </div>
    </Modal>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-medium text-content">{value}</span></div>;
}
