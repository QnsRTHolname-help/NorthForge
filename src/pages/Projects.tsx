import { useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { PageHeader, SkeletonList, Avatar, Progress, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { Modal } from '@/components/ui/Modal';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { projectService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import type { Project, WebsiteStage } from '@/types';
import { fmtDate, cx } from '@/utils/format';

const STAGES: { id: WebsiteStage; label: string }[] = [
  { id: 'discovery', label: 'Discovery' }, { id: 'content', label: 'Content' }, { id: 'wireframe', label: 'Wireframe' },
  { id: 'design', label: 'Design' }, { id: 'development', label: 'Development' }, { id: 'mobile-qa', label: 'Mobile QA' },
  { id: 'client-review', label: 'Client Review' }, { id: 'revisions', label: 'Revisions' }, { id: 'seo', label: 'SEO' },
  { id: 'deployment', label: 'Deployment' }, { id: 'live', label: 'Live' },
];

export default function Projects() {
  const { data, loading, reload } = useAsync(() => projectService.list(), []);
  const [create, setCreate] = useState(false);
  const [detail, setDetail] = useState<Project | null>(null);
  const clients = db.readSync('clients');

  const head = <PageHeader title="Projects" subtitle="Website production across all clients"
    actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Project</button>} />;

  if (loading) return <div>{head}<SkeletonList rows={5} /></div>;

  return (
    <div>
      {head}
      {(data || []).length === 0 ? (
        <EmptyState icon={FolderKanban} title="No active projects" message="Create your first project to start tracking delivery."
          action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Project</button>} />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {(data || []).map((p) => {
            const client = clients.find((c) => c.id === p.clientId);
            return (
              <button key={p.id} onClick={() => setDetail(p)} className="card card-hover p-5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0"><Avatar text={client?.logoText || 'NF'} size={40} tone="violet" /><div className="min-w-0"><h3 className="font-bold text-content truncate">{p.name}</h3><p className="text-xs text-muted">{client?.business || 'Unassigned'}</p></div></div>
                  <StatusBadge kind="project" value={p.status} />
                </div>
                <div className="flex items-center gap-2 mt-4"><Progress value={p.progress} /><span className="text-xs text-muted font-medium w-9 text-right">{p.progress}%</span></div>
                <div className="flex items-center justify-between mt-3 text-xs text-muted">
                  <span>Stage: {STAGES.find((s) => s.id === p.stage)?.label}</span>
                  <span>Launch: {fmtDate(p.targetLaunch)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <CreateModal kind={create ? 'project' : null} onClose={() => setCreate(false)} onCreated={reload} />
      {detail && <ProjectDrawer project={detail} onClose={() => setDetail(null)} onUpdate={reload} />}
    </div>
  );
}

function ProjectDrawer({ project, onClose, onUpdate }: { project: Project; onClose: () => void; onUpdate: () => void }) {
  const { toast } = useToast();
  const [p, setP] = useState(project);
  const client = db.readSync('clients').find((c) => c.id === p.clientId);
  const curIdx = STAGES.findIndex((s) => s.id === p.stage);

  const setStage = async (stage: WebsiteStage) => {
    const idx = STAGES.findIndex((s) => s.id === stage);
    const progress = Math.round(((idx + 1) / STAGES.length) * 100);
    const next = { ...p, stage, progress };
    setP(next);
    await projectService.update(p.id, { stage, progress });
    toast(`Stage → ${STAGES[idx].label}`, 'info'); onUpdate();
  };

  return (
    <Modal open onClose={onClose} title={project.name} size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Avatar text={client?.logoText || 'NF'} size={40} tone="violet" /><div><p className="font-semibold text-content">{client?.business}</p><p className="text-xs text-muted">{p.plan.toUpperCase()} · Lead: {p.lead}</p></div></div>
          <StatusBadge kind="project" value={p.status} />
        </div>

        {/* Production pipeline */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">Website production pipeline</h4>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map((s, i) => (
              <button key={s.id} onClick={() => setStage(s.id)}
                className={cx('px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                  i < curIdx ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  i === curIdx ? 'bg-brand text-white border-brand' : 'border-line text-muted hover:border-brand/40')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Start" value={fmtDate(p.start)} /><Info label="Target launch" value={fmtDate(p.targetLaunch)} />
          <Info label="Progress" value={`${p.progress}%`} /><Info label="Current stage" value={STAGES[curIdx]?.label || '—'} />
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">Milestones</h4>
          <div className="space-y-2">
            {p.milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5 text-sm">
                <span className={cx('w-4 h-4 rounded flex items-center justify-center', m.done ? 'bg-emerald-500 text-white' : 'border border-line')}>{m.done && '✓'}</span>
                <span className={cx(m.done ? 'text-muted line-through' : 'text-content')}>{m.label}</span>
                {m.due && !m.done && <span className="text-xs text-faint ml-auto">{fmtDate(m.due)}</span>}
              </div>
            ))}
            {p.milestones.length === 0 && <p className="text-sm text-muted">No milestones defined.</p>}
          </div>
        </div>

        {p.notes && <div className="rounded-xl bg-surface border border-line p-3"><p className="text-sm text-muted">{p.notes}</p></div>}
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="card p-3"><div className="text-xs text-muted">{label}</div><div className="font-semibold text-content mt-0.5">{value}</div></div>;
}
