import { PageHeader, EmptyState, Progress } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { useClientData } from './useClient';
import { fmtDate } from '@/utils/format';
import { FolderKanban, Check } from 'lucide-react';

const STAGES = ['discovery','content','wireframe','design','development','mobile-qa','client-review','revisions','seo','deployment','live'];
const STAGE_LABEL: Record<string,string> = { discovery:'Discovery', content:'Content', wireframe:'Wireframe', design:'Design', development:'Development', 'mobile-qa':'Mobile QA', 'client-review':'Client Review', revisions:'Revisions', seo:'SEO', deployment:'Deployment', live:'Live' };

export default function CProject() {
  const { project } = useClientData();
  if (!project) return <div><PageHeader title="My Project" /><EmptyState icon={FolderKanban} title="No active project" message="Once your project kicks off, you'll be able to track its progress here." /></div>;
  const curIdx = STAGES.indexOf(project.stage);
  return (
    <div>
      <PageHeader title="My Project" subtitle="Track your website production" />
      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-content">{project.name}</h3><StatusBadge kind="project" value={project.status} /></div>
        <div className="flex items-center gap-2 mb-1"><Progress value={project.progress} tone="violet" /><span className="text-sm font-semibold text-content w-10 text-right">{project.progress}%</span></div>
        <p className="text-xs text-muted">Target launch: {fmtDate(project.targetLaunch)}</p>
      </div>
      <div className="card p-6 mb-4">
        <h3 className="font-bold text-content mb-4">Production stages</h3>
        <div className="space-y-0">
          {STAGES.map((s, i) => (
            <div key={s}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${i < curIdx ? 'bg-emerald-500 text-white' : i === curIdx ? 'bg-brand text-white' : 'bg-line text-faint'}`}>{i < curIdx ? <Check size={12} /> : i + 1}</span>
                <span className={`text-sm ${i <= curIdx ? 'text-content font-medium' : 'text-muted'}`}>{STAGE_LABEL[s]}</span>
                {i === curIdx && <span className="badge bg-brand/10 text-brand ml-auto">In progress</span>}
              </div>
              {i < STAGES.length - 1 && <div className="ml-3 w-px h-4 bg-line" />}
            </div>
          ))}
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-bold text-content mb-3">Milestones</h3>
        <div className="space-y-2">
          {project.milestones.map((m) => <div key={m.id} className="flex items-center gap-2.5 text-sm"><span className={`w-4 h-4 rounded flex items-center justify-center ${m.done ? 'bg-emerald-500 text-white' : 'border border-line'}`}>{m.done && <Check size={11} />}</span><span className={m.done ? 'text-muted line-through' : 'text-content'}>{m.label}</span></div>)}
        </div>
      </div>
    </div>
  );
}
