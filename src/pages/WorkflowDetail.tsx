import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { SkeletonList, Badge } from '@/components/ui/primitives';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';
import { workflowService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { uid } from '@/services/db';
import type { NodeType, WorkflowNode } from '@/types';
import { nodeIcon, nodeColor } from './Workflows';
import { cx } from '@/utils/format';

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: 'trigger', label: 'Trigger' }, { value: 'ai', label: 'AI Step' }, { value: 'crm', label: 'CRM Update' },
  { value: 'whatsapp', label: 'WhatsApp' }, { value: 'notify', label: 'Notification' }, { value: 'delay', label: 'Delay' }, { value: 'condition', label: 'Condition' },
];

export default function WorkflowDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const { data, loading, reload } = useAsync(async () => (await db.read('workflows')).find((w) => w.id === id), [id]);
  const [addOpen, setAddOpen] = useState(false);
  const [nodes, setNodes] = useState<WorkflowNode[] | null>(null);
  const [nf, setNf] = useState<{ type: NodeType; label: string; detail: string }>({ type: 'ai', label: '', detail: '' });

  if (loading) return <SkeletonList rows={5} />;
  if (!data) return <div className="text-center py-20"><p className="text-muted">Workflow not found.</p><Link to="/app/workflows" className="btn-outline mt-4 inline-flex">Back</Link></div>;

  const list = nodes || data.nodes;
  const save = async (next: WorkflowNode[]) => { setNodes(next); await workflowService.update(data.id, { nodes: next }); reload(); };
  const addNode = async () => { if (!nf.label) return; await save([...list, { id: uid('wn'), ...nf }]); toast('Step added'); setAddOpen(false); setNf({ type: 'ai', label: '', detail: '' }); };
  const removeNode = async (nid: string) => { await save(list.filter((n) => n.id !== nid)); toast('Step removed', 'info'); };
  const toggle = async () => { await workflowService.update(data.id, { active: !data.active }); toast(!data.active ? 'Workflow activated' : 'Workflow deactivated'); reload(); };

  return (
    <div>
      <button onClick={() => nav('/app/workflows')} className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Back to workflows</button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-content tracking-tight">{data.name}</h1><Badge tone={data.active ? 'success' : 'neutral'} dot>{data.active ? 'Active' : 'Inactive'}</Badge></div>
          <p className="text-sm text-muted mt-1">{data.description || 'Visual automation flow'} · {data.runs} runs</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setAddOpen(true)}><Plus size={16} /> Add step</button>
          <button className={data.active ? 'btn-outline' : 'btn-primary'} onClick={toggle}>{data.active ? 'Deactivate' : 'Activate'}</button>
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="max-w-md mx-auto space-y-0">
          {list.map((n, i) => {
            const Icon = nodeIcon[n.type];
            return (
              <div key={n.id}>
                <div className="group flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 hover:border-brand/40 transition-all animate-fade-up">
                  <span className={cx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', nodeColor[n.type])}><Icon size={18} /></span>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-content">{n.label}</p><p className="text-xs text-muted truncate">{n.detail}</p></div>
                  {n.type !== 'trigger' && <button onClick={() => removeNode(n.id)} className="btn-ghost !p-1.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={15} /></button>}
                </div>
                {i < list.length - 1 && <div className="flex justify-center py-1.5"><div className="w-px h-5 bg-line" /></div>}
              </div>
            );
          })}
          <div className="flex justify-center pt-4">
            <button className="btn-outline btn-sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add step</button>
          </div>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add workflow step" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn-primary" onClick={addNode}><Save size={14} /> Add step</button></>}>
        <div className="space-y-3.5">
          <Field label="Step type"><Select value={nf.type} onChange={(v) => setNf({ ...nf, type: v as NodeType })} options={NODE_TYPES} /></Field>
          <Field label="Label"><input className="input" value={nf.label} onChange={(e) => setNf({ ...nf, label: e.target.value })} placeholder="e.g. Send WhatsApp confirmation" /></Field>
          <Field label="Detail"><input className="input" value={nf.detail} onChange={(e) => setNf({ ...nf, detail: e.target.value })} placeholder="What this step does" /></Field>
        </div>
      </Modal>
    </div>
  );
}
