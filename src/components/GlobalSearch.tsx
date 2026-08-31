import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, Users, LayoutGrid, FolderKanban, Globe, ListTodo, Receipt, FileText, CornerDownLeft } from 'lucide-react';
import { db } from '@/services/db';
import { cx } from '@/utils/format';

interface Result { id: string; label: string; sub: string; group: string; to: string; icon: any; }

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!open) return [];
    const term = q.trim().toLowerCase();
    const out: Result[] = [];
    const push = (arr: Result[]) => { for (const r of arr) out.push(r); };
    push(db.readSync('clients').map((c) => ({ id: c.id, label: c.business, sub: c.industry + ' · ' + c.location, group: 'Clients', to: `/app/clients/${c.id}`, icon: LayoutGrid })));
    push(db.readSync('leads').map((l) => ({ id: l.id, label: l.business, sub: `${l.code} · ${l.category}`, group: 'Leads', to: `/app/leads/${l.id}`, icon: Users })));
    push(db.readSync('projects').map((p) => ({ id: p.id, label: p.name, sub: 'Project', group: 'Projects', to: `/app/projects`, icon: FolderKanban })));
    push(db.readSync('websites').map((w) => ({ id: w.id, label: w.domain, sub: 'Website', group: 'Websites', to: `/app/websites`, icon: Globe })));
    push(db.readSync('tasks').map((t) => ({ id: t.id, label: t.title, sub: 'Task', group: 'Tasks', to: `/app/tasks`, icon: ListTodo })));
    push(db.readSync('invoices').map((i) => ({ id: i.id, label: i.number, sub: 'Invoice', group: 'Invoices', to: `/app/invoices`, icon: Receipt })));
    push(db.readSync('proposals').map((p) => ({ id: p.id, label: p.number, sub: p.clientName, group: 'Proposals', to: `/app/proposals`, icon: FileText })));
    const filtered = term
      ? out.filter((r) => r.label.toLowerCase().includes(term) || r.sub.toLowerCase().includes(term))
      : out.slice(0, 7);
    return filtered.slice(0, 24);
  }, [q, open]);

  const grouped = useMemo(() => {
    const g: Record<string, Result[]> = {};
    results.forEach((r) => { (g[r.group] ||= []).push(r); });
    return g;
  }, [results]);

  const flat = results;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      if (e.key === 'Enter' && flat[active]) { nav(flat[active].to); onClose(); }
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, flat, active, nav, onClose]);

  if (!open) return null;
  let idx = -1;
  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-clay-ink/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-elevated rounded-3xl shadow-clay-xl animate-scale-in overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <Search size={18} className="text-faint" />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Search clients, leads, projects, websites, tasks…"
            className="flex-1 bg-transparent py-3.5 text-sm text-content placeholder:text-faint outline-none" />
          <span className="kbd">Esc</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {flat.length === 0 && <div className="py-10 text-center text-sm text-muted">No results found.</div>}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-faint">{group}</div>
              {items.map((r) => {
                idx++;
                const isActive = idx === active;
                const Icon = r.icon;
                return (
                  <button key={r.id} onMouseEnter={() => setActive(flat.indexOf(r))}
                    onClick={() => { nav(r.to); onClose(); }}
                    className={cx('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors',
                      isActive ? 'bg-brand/10' : 'hover:bg-line/40')}>
                    <span className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center shrink-0"><Icon size={15} className="text-muted" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-content truncate">{r.label}</div>
                      <div className="text-xs text-muted truncate">{r.sub}</div>
                    </div>
                    {isActive && <CornerDownLeft size={14} className="text-faint" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
