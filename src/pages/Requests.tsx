import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState, Avatar, Badge } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { requestService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import type { ClientRequest, RequestStatus } from '@/types';
import { timeAgo, fmtDate } from '@/utils/format';

export default function Requests() {
  const { data, loading, reload } = useAsync(() => requestService.list(), []);
  const [detail, setDetail] = useState<ClientRequest | null>(null);
  const [status, setStatus] = useState('all');

  const head = <PageHeader title="Client Requests" subtitle="Everything clients have asked NorthForge to do" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={6} /></div>;

  const rows = status === 'all' ? data : data.filter((r) => r.status === status);
  const newCount = data.filter((r) => r.status === 'new').length;

  const cols: Column<ClientRequest>[] = [
    { key: 'title', header: 'Request', sortValue: (r) => r.title, render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar text={db.readSync('clients').find((c) => c.id === r.clientId)?.logoText || r.clientName} size={34} tone="violet" />
        <div className="min-w-0"><div className="font-bold text-content truncate">{r.title}</div><div className="text-xs text-muted">{r.clientName} · {r.type}</div></div>
      </div>
    )},
    { key: 'priority', header: 'Priority', hideOnMobile: true, sortValue: (r) => r.priority, render: (r) => <StatusBadge kind="priority" value={r.priority} /> },
    { key: 'updated', header: 'Updated', hideOnMobile: true, sortValue: (r) => r.updatedAt, render: (r) => <span className="text-muted">{timeAgo(r.updatedAt)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="request" value={r.status} dot /> },
  ];

  return (
    <div>
      {head}
      {newCount > 0 && (
        <div className="card p-4 mb-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-brand/12 shadow-clay-inset flex items-center justify-center"><Inbox size={18} className="text-brand" /></span>
          <p className="text-sm text-content"><b>{newCount} new request{newCount > 1 ? 's' : ''}</b> waiting for review.</p>
        </div>
      )}
      {data.length === 0 ? (
        <EmptyState icon={Inbox} title="No requests yet" message="When clients submit requests from their portal, they'll appear here." />
      ) : (
        <DataTable rows={rows} columns={cols} onRowClick={(r) => setDetail(r)}
          searchKeys={[(r) => r.title, (r) => r.clientName, (r) => r.type, (r) => r.description]}
          searchPlaceholder="Search requests…"
          filters={
            <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
              {['all', 'new', 'in-progress', 'waiting', 'completed', 'cancelled'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
            </select>
          } />
      )}
      {detail && <RequestDrawer request={detail} onClose={() => setDetail(null)} onUpdate={reload} />}
    </div>
  );
}

function RequestDrawer({ request, onClose, onUpdate }: { request: ClientRequest; onClose: () => void; onUpdate: () => void }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo || '');
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const client = db.readSync('clients').find((c) => c.id === request.clientId);

  const save = async () => {
    setSaving(true);
    try {
      await requestService.update(request.id, { status, assignedTo: assignedTo || undefined, adminNotes });
      toast(status !== request.status ? `Request marked ${status.replace('-', ' ')} — client notified` : 'Request updated', 'success');
      onUpdate(); onClose();
    } catch { toast('Unable to update request.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Drawer open onClose={onClose} title="Request details"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save & notify client'}</button></>}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar text={client?.logoText || request.clientName} size={42} tone="violet" />
          <div><p className="font-display font-extrabold text-content">{request.clientName}</p><p className="text-xs text-muted">{request.type} · {fmtDate(request.createdAt)}</p></div>
        </div>
        <div><Badge tone="neutral">{request.type}</Badge></div>
        <div>
          <h3 className="font-display font-extrabold text-content">{request.title}</h3>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">{request.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status"><Select value={status} onChange={(v) => setStatus(v as RequestStatus)} options={['new','in-progress','waiting','completed','cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1).replace('-', ' ') }))} /></Field>
          <Field label="Priority"><input className="input" value={request.priority} disabled /></Field>
        </div>
        <Field label="Assigned to"><input className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="North Forge" /></Field>
        <Field label="Internal notes (not shown to client)"><textarea className="input min-h-[90px]" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add internal notes…" /></Field>
      </div>
    </Drawer>
  );
}
