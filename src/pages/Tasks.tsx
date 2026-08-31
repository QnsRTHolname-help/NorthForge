import { useState } from 'react';
import { Plus, ListTodo } from 'lucide-react';
import { PageHeader, SkeletonList, EmptyState } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { CreateModal } from '@/components/forms/QuickCreate';
import { useAsync } from '@/hooks/useAsync';
import { taskService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import type { Task, TaskStatus } from '@/types';
import { fmtShortDate, cx } from '@/utils/format';

const COLS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To do' }, { id: 'in-progress', label: 'In progress' }, { id: 'review', label: 'Review' }, { id: 'done', label: 'Done' },
];

export default function Tasks() {
  const { data, loading, reload } = useAsync(() => taskService.list(), []);
  const [create, setCreate] = useState(false);
  const [view, setView] = useState<'all' | 'mine' | 'done'>('all');
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [local, setLocal] = useState<Task[] | null>(null);
  const { toast } = useToast();
  const clients = db.readSync('clients');

  const tasks = local || data;
  const head = <PageHeader title="Tasks" subtitle="Everything the team is working on"
    actions={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Task</button>} />;

  if (loading || !tasks) return <div>{head}<SkeletonList rows={6} /></div>;

  const move = async (id: string, status: TaskStatus) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    setLocal(tasks.map((x) => (x.id === id ? { ...x, status } : x)));
    await taskService.update(id, { status });
    toast(`Task → ${COLS.find((c) => c.id === status)?.label}`, 'info'); reload();
  };

  const visible = view === 'done' ? tasks.filter((t) => t.status === 'done') : view === 'mine' ? tasks.filter((t) => t.assignee === 'North Forge') : tasks;

  return (
    <div>
      {head}
      <div className="inline-flex rounded-xl border border-line p-0.5 mb-4">
        {(['all', 'mine', 'done'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cx('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', view === v ? 'bg-brand/10 text-brand' : 'text-muted')}>
            {v === 'all' ? 'All Tasks' : v === 'mine' ? 'My Tasks' : 'Completed'}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState icon={ListTodo} title="No tasks yet" message="Create a task to start tracking your work."
          action={<button className="btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> New Task</button>} />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {COLS.map((col) => {
            const items = visible.filter((t) => t.status === col.id);
            return (
              <div key={col.id}
                onDragOver={(e) => { e.preventDefault(); setOver(col.id); }} onDragLeave={() => setOver(null)}
                onDrop={() => { if (dragId) move(dragId, col.id); setDragId(null); setOver(null); }}
                className={cx('rounded-2xl border border-line bg-surface/50 p-2.5 min-h-[120px]', over === col.id && 'ring-2 ring-brand/50')}>
                <div className="flex items-center gap-2 px-1.5 py-1 mb-2"><StatusBadge kind="task" value={col.id} dot /><span className="text-xs text-muted font-semibold">{items.length}</span></div>
                <div className="space-y-2">
                  {items.map((t) => {
                    const c = clients.find((x) => x.id === t.clientId);
                    return (
                      <div key={t.id} draggable onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)}
                        className={cx('card p-3 cursor-grab active:cursor-grabbing hover:border-brand/40 transition-all', dragId === t.id && 'opacity-40')}>
                        <p className="text-sm font-medium text-content">{t.title}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <StatusBadge kind="priority" value={t.priority} />
                          {c && <span className="text-[11px] text-muted">{c.business}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/60">
                          <span className="text-[11px] text-faint">{fmtShortDate(t.due)}</span>
                          {t.tags[0] && <span className="chip !py-0.5 !text-[10px]">{t.tags[0]}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <CreateModal kind={create ? 'task' : null} onClose={() => setCreate(false)} onCreated={reload} />
    </div>
  );
}
