import { useState } from 'react';
import { LifeBuoy, Plus } from 'lucide-react';
import { PageHeader, SkeletonList, Avatar, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { supportService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import type { Ticket, TicketStatus } from '@/types';
import { timeAgo, cx } from '@/utils/format';

export default function Support() {
  const { data, loading, reload } = useAsync(() => supportService.list(), []);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const clients = db.readSync('clients');
  const head = <PageHeader title="Support" subtitle="Client requests and tickets" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const cols: { id: TicketStatus; label: string }[] = [
    { id: 'open', label: 'Open' }, { id: 'in-progress', label: 'In progress' }, { id: 'waiting', label: 'Waiting' }, { id: 'resolved', label: 'Resolved' },
  ];

  return (
    <div>
      {head}
      {data.length === 0 ? <EmptyState icon={LifeBuoy} title="No open tickets" message="Client support requests will appear here." /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {cols.map((col) => {
            const items = data.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="rounded-2xl border border-line bg-surface/50 p-2.5">
                <div className="flex items-center gap-2 px-1.5 py-1 mb-2"><StatusBadge kind="ticket" value={col.id} dot /><span className="text-xs text-muted font-semibold">{items.length}</span></div>
                <div className="space-y-2">
                  {items.map((t) => {
                    const c = clients.find((x) => x.id === t.clientId);
                    return (
                      <button key={t.id} onClick={() => setDetail(t)} className="card card-hover w-full p-3 text-left">
                        <p className="text-sm font-medium text-content">{t.subject}</p>
                        <div className="flex items-center gap-2 mt-2"><Avatar text={c?.logoText || 'NF'} size={22} tone="violet" /><span className="text-xs text-muted truncate">{c?.business}</span></div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60"><StatusBadge kind="priority" value={t.priority} /><span className="text-[11px] text-faint">{timeAgo(t.updated)}</span></div>
                      </button>
                    );
                  })}
                  {items.length === 0 && <p className="text-xs text-faint text-center py-4">None</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {detail && <TicketModal ticket={detail} onClose={() => setDetail(null)} onUpdate={reload} />}
    </div>
  );
}

function TicketModal({ ticket, onClose, onUpdate }: { ticket: Ticket; onClose: () => void; onUpdate: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const c = db.readSync('clients').find((x) => x.id === ticket.clientId);
  const save = async () => { await supportService.update(ticket.id, { status }); toast('Ticket updated'); onUpdate(); onClose(); };
  return (
    <Modal open onClose={onClose} title={ticket.number} size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Close</button><button className="btn-primary" onClick={save}>Save</button></>}>
      <div className="space-y-3">
        <div><p className="text-xs text-muted">Subject</p><p className="font-semibold text-content">{ticket.subject}</p></div>
        <div className="flex justify-between text-sm"><span className="text-muted">Client</span><span className="font-medium text-content">{c?.business}</span></div>
        <div className="flex justify-between text-sm"><span className="text-muted">Priority</span><StatusBadge kind="priority" value={ticket.priority} /></div>
        <Field label="Status"><Select value={status} onChange={(v) => setStatus(v as TicketStatus)} options={['open','in-progress','waiting','resolved','closed'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1).replace('-', ' ') }))} /></Field>
      </div>
    </Modal>
  );
}
