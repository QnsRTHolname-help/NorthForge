import { useState } from 'react';
import { Plus, FileText, Send, Eye, Check } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState, Badge } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { proposalService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { Proposal } from '@/types';
import { AGENCY } from '@/data/catalog';
import { inr, fmtDate } from '@/utils/format';

export default function Proposals() {
  const { data, loading, reload } = useAsync(() => proposalService.list(), []);
  const [create, setCreate] = useState(false);
  const [preview, setPreview] = useState<Proposal | null>(null);
  const { toast } = useToast();

  const head = <PageHeader title="Proposals" subtitle="Quotes and proposals sent to prospects"
    actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Proposal</button>} />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  const cols: Column<Proposal>[] = [
    { key: 'number', header: 'Proposal', sortValue: (r) => r.number, render: (r) => <div><div className="font-semibold text-content">{r.clientName}</div><div className="text-xs text-muted">{r.number}</div></div> },
    { key: 'total', header: 'Total', sortValue: (r) => r.total, render: (r) => <span className="font-semibold text-content">{inr(r.total)}</span> },
    { key: 'valid', header: 'Valid until', hideOnMobile: true, sortValue: (r) => r.validUntil, render: (r) => <span className="text-muted">{fmtDate(r.validUntil)}</span> },
    { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <StatusBadge kind="proposal" value={r.status} dot /> },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button className="btn-ghost !p-1.5" title="Preview" onClick={() => setPreview(r)}><Eye size={14} /></button>
        {r.status === 'draft' && <button className="btn-ghost !p-1.5 text-brand" title="Send" onClick={async () => { await proposalService.update(r.id, { status: 'sent' }); toast('Proposal sent'); reload(); }}><Send size={14} /></button>}
      </div>
    )},
  ];

  return (
    <div>
      {head}
      {data.length === 0 ? (
        <EmptyState icon={FileText} title="No proposals yet" message="Create a proposal to send a quote to a prospect."
          action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Proposal</button>} />
      ) : (
        <DataTable rows={data} columns={cols} onRowClick={(r) => setPreview(r)}
          searchKeys={[(r) => r.clientName, (r) => r.number]} searchPlaceholder="Search proposals…" />
      )}
      <CreateModal kind={create ? 'proposal' : null} onClose={() => setCreate(false)} onCreated={reload} />
      {preview && <PreviewModal proposal={preview} onClose={() => setPreview(null)} onUpdate={reload} />}
    </div>
  );
}

function PreviewModal({ proposal, onClose, onUpdate }: { proposal: Proposal; onClose: () => void; onUpdate: () => void }) {
  const { toast } = useToast();
  const subtotal = proposal.items.reduce((a, b) => a + b.amount, 0);
  const act = async (status: any, msg: string) => { await proposalService.update(proposal.id, { status }); toast(msg); onUpdate(); onClose(); };
  return (
    <Modal open onClose={onClose} title="Proposal preview" size="lg"
      footer={<>
        {proposal.status === 'draft' && <button className="btn-primary" onClick={() => act('sent', 'Proposal sent')}><Send size={14} /> Send proposal</button>}
        {['sent', 'viewed'].includes(proposal.status) && <button className="btn-primary" onClick={() => act('accepted', 'Marked as accepted')}><Check size={14} /> Mark accepted</button>}
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </>}>
      <div className="rounded-2xl border border-line overflow-hidden">
        <div className="bg-clay-ink text-white p-6">
          <div className="flex items-center justify-between">
            <div><div className="text-xl font-bold">NorthForge</div><div className="text-xs text-white/50 mt-0.5">{AGENCY.location}</div></div>
            <div className="text-right"><div className="text-xs text-white/50">Proposal</div><div className="font-bold">{proposal.number}</div></div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between mb-6">
            <div><p className="text-xs text-muted">Prepared for</p><p className="font-bold text-content">{proposal.clientName}</p></div>
            <div className="text-right"><p className="text-xs text-muted">Valid until</p><p className="font-medium text-content">{fmtDate(proposal.validUntil)}</p></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left"><th className="py-2 text-muted font-semibold text-xs">Item</th><th className="py-2 text-muted font-semibold text-xs text-right">Amount</th></tr></thead>
            <tbody>
              {proposal.items.map((it, i) => <tr key={i} className="border-b border-line/60"><td className="py-3 text-content">{it.label}</td><td className="py-3 text-content text-right font-medium">{inr(it.amount)}</td></tr>)}
            </tbody>
          </table>
          <div className="mt-4 ml-auto max-w-[240px] space-y-1.5 text-sm">
            <div className="flex justify-between text-muted"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
            {proposal.discount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount</span><span>−{inr(proposal.discount)}</span></div>}
            <div className="flex justify-between font-bold text-content text-base pt-2 border-t border-line"><span>Total</span><span>{inr(proposal.total)}</span></div>
          </div>
          <p className="text-xs text-muted mt-6 pt-4 border-t border-line">Every plan renews every 28 days · Hosting & SSL included · {AGENCY.phone} · {AGENCY.email}</p>
        </div>
      </div>
    </Modal>
  );
}
