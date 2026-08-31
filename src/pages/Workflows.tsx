import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Workflow as WfIcon, Zap, Bot, Database, MessageCircle, Bell, Clock, GitBranch } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState, Badge } from '@/components/ui/primitives';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { workflowService } from '@/services';
import { useToast } from '@/hooks/useToast';
import type { NodeType } from '@/types';
import { cx } from '@/utils/format';

export const nodeIcon: Record<NodeType, any> = {
  trigger: Zap, ai: Bot, crm: Database, whatsapp: MessageCircle, notify: Bell, delay: Clock, condition: GitBranch,
};
export const nodeColor: Record<NodeType, string> = {
  trigger: 'text-brand bg-brand/10', ai: 'text-brand bg-brand/10', crm: 'text-sky-500 bg-sky-500/10',
  whatsapp: 'text-emerald-500 bg-emerald-500/10', notify: 'text-amber-500 bg-amber-500/10',
  delay: 'text-muted bg-line/60', condition: 'text-rose-500 bg-rose-500/10',
};

export default function Workflows() {
  const nav = useNavigate();
  const { toast } = useToast();
  const { data, loading, reload } = useAsync(() => workflowService.list(), []);
  const [create, setCreate] = useState(false);

  const head = <PageHeader title="Workflows" subtitle="Automate how NorthForge handles every lead"
    actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Workflow</button>} />;
  if (loading || !data) return <div>{head}<SkeletonList rows={4} /></div>;

  const toggle = async (id: string, active: boolean) => { await workflowService.update(id, { active }); toast(active ? 'Workflow activated' : 'Workflow deactivated', active ? 'success' : 'info'); reload(); };

  return (
    <div>
      {head}
      {data.length === 0 ? (
        <EmptyState icon={WfIcon} title="No active workflows" message="Create a workflow to automate your next lead."
          action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Workflow</button>} />
      ) : (
        <div className="space-y-4">
          {data.map((w) => (
            <div key={w.id} className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <button onClick={() => nav(`/app/workflows/${w.id}`)} className="text-left min-w-0">
                  <div className="flex items-center gap-2"><h3 className="font-bold text-content">{w.name}</h3><Badge tone={w.active ? 'success' : 'neutral'} dot>{w.active ? 'Active' : 'Inactive'}</Badge></div>
                  <p className="text-sm text-muted mt-0.5">{w.description}</p>
                  <p className="text-xs text-faint mt-1">{w.runs} runs · {w.nodes.length} steps</p>
                </button>
                <label className="inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" checked={w.active} onChange={(e) => toggle(w.id, e.target.checked)} />
                  <div className="w-10 h-6 bg-line rounded-full peer peer-checked:bg-brand transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {w.nodes.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-1.5 shrink-0">
                    <div className={cx('flex items-center gap-2 rounded-xl border border-line px-2.5 py-1.5', )}>
                      <span className={cx('w-6 h-6 rounded-lg flex items-center justify-center', nodeColor[n.type])}>{(() => { const I = nodeIcon[n.type]; return <I size={13} />; })()}</span>
                      <span className="text-xs font-medium text-content whitespace-nowrap">{n.label}</span>
                    </div>
                    {i < w.nodes.length - 1 && <span className="text-faint">→</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <CreateModal kind={create ? 'workflow' : null} onClose={() => setCreate(false)} onCreated={reload} />
    </div>
  );
}
