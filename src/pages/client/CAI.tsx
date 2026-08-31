import { PageHeader, EmptyState } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { useClientData } from './useClient';
import { Bot, MessageSquare, Target, CheckCircle2 } from 'lucide-react';

export default function CAI() {
  const { assistant } = useClientData();
  if (!assistant) return <div><PageHeader title="AI Assistant" /><EmptyState icon={Bot} title="AI Assistant available on Growth & Pro" message="Upgrade your plan to add an AI assistant that answers customer questions for you." /></div>;
  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Your website's AI assistant, working 24/7" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KpiCard label="Questions answered" value={assistant.stats.questions.toLocaleString('en-IN')} icon={MessageSquare} />
        <KpiCard label="Leads captured" value={String(assistant.stats.leads)} icon={Target} sparkColor="#DB2777" />
        <KpiCard label="Resolved" value={assistant.stats.resolved.toLocaleString('en-IN')} icon={CheckCircle2} />
      </div>
      <div className="card p-5 max-w-md">
        <div className="flex items-center gap-2 mb-3"><span className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Bot size={16} className="text-brand" /></span><span className="font-semibold text-content">{assistant.name}</span><span className="badge bg-emerald-500/10 text-emerald-500 ml-auto"><span className="w-1.5 h-1.5 rounded-full bg-current" /> Online</span></div>
        <div className="rounded-2xl bg-surface border border-line p-4 space-y-3">
          <div className="bg-panel rounded-xl rounded-tl-sm p-3 text-sm text-content border border-line">{assistant.greeting}</div>
          <div className="bg-brand text-white rounded-xl rounded-tr-sm p-3 text-sm ml-auto max-w-[80%]">{assistant.faqs[0]?.q}</div>
          <div className="bg-panel rounded-xl rounded-tl-sm p-3 text-sm text-content border border-line">{assistant.faqs[0]?.a}</div>
        </div>
      </div>
    </div>
  );
}
