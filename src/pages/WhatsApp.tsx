import { useState } from 'react';
import { MessageCircle, CheckCircle2, Copy, Zap } from 'lucide-react';
import { PageHeader, SkeletonList, Avatar, Badge } from '@/components/ui/primitives';
import { useAsync } from '@/hooks/useAsync';
import { messageService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import { AGENCY } from '@/data/catalog';
import { timeAgo, cx } from '@/utils/format';

const tabs = ['Conversations', 'Templates', 'Automation'] as const;

export default function WhatsApp() {
  const { data, loading } = useAsync(async () => ({ messages: await messageService.list(), templates: db.readSync('templates'), workflows: db.readSync('workflows') }), []);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Conversations');
  const { toast } = useToast();
  const clients = db.readSync('clients');

  const head = <PageHeader title="WhatsApp Center" subtitle="Messages, templates and automation" />;
  if (loading || !data) return <div>{head}<SkeletonList rows={5} /></div>;

  return (
    <div>
      {head}
      <div className="card p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"><MessageCircle size={18} className="text-emerald-500" /></span>
          <div><p className="font-semibold text-content">{AGENCY.whatsapp}</p><p className="text-xs text-muted">Business WhatsApp number</p></div>
        </div>
        <Badge tone="success" dot>Connected</Badge>
      </div>

      <div className="flex gap-1 border-b border-line mb-5 overflow-x-auto">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cx('px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors', tab === t ? 'border-brand text-content' : 'border-transparent text-muted hover:text-content')}>{t}</button>)}
      </div>

      {tab === 'Conversations' && (
        <div className="space-y-3">
          <p className="text-xs text-muted">Recent WhatsApp activity from client websites. Messages here reflect logged conversations; sending requires a connected WhatsApp Business account.</p>
          {data.messages.map((m) => {
            const c = clients.find((x) => x.id === m.clientId);
            return (
              <div key={m.id} className={cx('card p-4 flex gap-3', m.direction === 'out' && 'bg-brand/[0.03]')}>
                <Avatar text={m.direction === 'in' ? m.from.slice(-2) : (c?.logoText || 'NF')} size={38} tone={m.direction === 'out' ? 'brand' : 'ink'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-content">{m.from}</span><span className="text-xs text-faint">{timeAgo(m.at)}</span></div>
                  <p className="text-sm text-muted mt-1">{m.body}</p>
                  {c && <span className="text-[11px] text-faint mt-1 inline-block">via {c.business}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'Templates' && (
        <div className="grid sm:grid-cols-2 gap-3">
          {data.templates.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-center justify-between mb-2"><span className="font-semibold text-content text-sm">{t.name}</span><Badge tone="brand">{t.category}</Badge></div>
              <div className="rounded-xl bg-surface border border-line p-3 text-sm text-muted">{t.body}</div>
              <button className="btn-ghost btn-sm mt-2" onClick={() => { navigator.clipboard?.writeText(t.body); toast('Template copied'); }}><Copy size={13} /> Copy</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'Automation' && (
        <div className="space-y-3">
          {data.workflows.filter((w) => w.nodes.some((n) => n.type === 'whatsapp')).map((w) => (
            <div key={w.id} className="card p-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center"><Zap size={18} className="text-brand" /></span>
              <div className="flex-1 min-w-0"><p className="font-semibold text-content">{w.name}</p><p className="text-xs text-muted">{w.runs} runs · {w.nodes.filter((n) => n.type === 'whatsapp').length} WhatsApp steps</p></div>
              <Badge tone={w.active ? 'success' : 'neutral'} dot>{w.active ? 'Active' : 'Inactive'}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
