import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Phone, MessageCircle, GripVertical } from 'lucide-react';
import { PageHeader, SkeletonList, Avatar } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { leadService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { Lead, LeadStatus } from '@/types';
import { inr, cx } from '@/utils/format';

const columns: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'New' }, { id: 'contacted', label: 'Contacted' }, { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' }, { id: 'negotiation', label: 'Negotiation' }, { id: 'won', label: 'Won' }, { id: 'lost', label: 'Lost' },
];

export default function Pipeline() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { data, loading, reload } = useAsync(() => leadService.list(), []);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [local, setLocal] = useState<Lead[] | null>(null);

  const leads = local || data;

  if (loading || !leads) return <div><PageHeader title="Pipeline" subtitle="Drag leads through the sales stages" /><SkeletonList rows={6} /></div>;

  const move = async (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    setLocal(leads.map((l) => (l.id === id ? { ...l, status } : l)));
    await leadService.move(id, status);
    toast(`${lead.business} → ${columns.find((c) => c.id === status)?.label}`, 'info');
    reload();
  };

  return (
    <div>
      <PageHeader title="Pipeline" subtitle={`${leads.filter(l=>!['won','lost'].includes(l.status)).length} active leads across ${columns.length} stages`}
        actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Lead</button>} />
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
        {columns.map((col) => {
          const items = leads.filter((l) => l.status === col.id);
          const total = items.reduce((a, b) => a + b.estValue, 0);
          return (
            <div key={col.id}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={() => setOverCol(null)}
              onDrop={() => { if (dragId) move(dragId, col.id); setDragId(null); setOverCol(null); }}
              className={cx('shrink-0 w-[280px] snap-start rounded-2xl border border-line bg-surface/50 flex flex-col max-h-[calc(100vh-220px)]',
                overCol === col.id && 'ring-2 ring-brand/50 bg-brand/[0.03]')}>
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-line sticky top-0">
                <div className="flex items-center gap-2">
                  <StatusBadge kind="lead" value={col.id} dot />
                  <span className="text-xs font-semibold text-muted">{items.length}</span>
                </div>
                {total > 0 && <span className="text-xs text-faint font-medium">{inr(total)}</span>}
              </div>
              <div className="p-2 space-y-2 overflow-y-auto">
                {items.map((l) => (
                  <div key={l.id} draggable
                    onDragStart={() => setDragId(l.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => nav(`/app/leads/${l.id}`)}
                    className={cx('card p-3 cursor-pointer group hover:shadow-clay-lg hover:border-brand/40 transition-all', dragId === l.id && 'opacity-40')}>
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-faint mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-content truncate">{l.business}</p>
                          <span className={cx('text-xs font-bold shrink-0', l.score >= 80 ? 'text-emerald-500' : l.score >= 60 ? 'text-amber-500' : 'text-muted')}>{l.score}</span>
                        </div>
                        <p className="text-xs text-muted truncate mt-0.5">{l.category} · {l.contact || '—'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-content">{inr(l.estValue)}</span>
                          <StatusBadge kind="priority" value={l.priority} />
                        </div>
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-line/60" onClick={(e) => e.stopPropagation()}>
                          <a href={`tel:${l.phone}`} className="btn-ghost !p-1"><Phone size={12} /></a>
                          <a href={`https://wa.me/${l.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn-ghost !p-1"><MessageCircle size={12} /></a>
                          <span className="text-[10px] text-faint ml-auto">{l.source}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-center text-xs text-faint py-6">Drop leads here</div>}
              </div>
            </div>
          );
        })}
      </div>
      <CreateModal kind={create ? 'lead' : null} onClose={() => setCreate(false)} onCreated={reload} />
    </div>
  );
}
