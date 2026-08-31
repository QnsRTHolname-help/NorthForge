import { useNavigate } from 'react-router-dom';
import { Globe, Users, TrendingUp, MessageCircle, LifeBuoy, ArrowRight, Sparkles, Inbox } from 'lucide-react';
import { PageHeader, Badge, Progress } from '@/components/ui/primitives';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/status';
import { AreaChart } from '@/components/charts/Charts';
import { useClientData } from './useClient';
import { planById } from '@/data/catalog';
import { inr, fmtDate, compact } from '@/utils/format';

export default function CDashboard() {
  const nav = useNavigate();
  const { client, website, project, subscription, analytics, tickets, payments, requests } = useClientData();
  const latestPayment = payments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const openRequests = requests.filter((r) => !['completed', 'cancelled'].includes(r.status)).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const plan = planById(client.plan);
  const openTickets = tickets.filter((t) => !['resolved', 'closed'].includes(t.status)).length;
  const trend = (analytics?.trend || []).slice(-14);
  const lastWeek = trend.slice(0, 7).reduce((a, p) => a + p.leads, 0);
  const thisWeek = trend.slice(7).reduce((a, p) => a + p.leads, 0);

  return (
    <div className="space-y-6">
      <PageHeader title={`${greeting}, ${client.contact.split(' ')[0]}`} subtitle={`Here's how ${client.business} is doing today.`} />

      {/* Insight banner */}
      {analytics && (
        <div className="card p-5 bg-gradient-to-br from-brand/[0.06] to-brand/[0.06] border-brand/20">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center shrink-0"><Sparkles size={18} className="text-brand" /></span>
            <div>
              <h3 className="font-bold text-content">Your business overview</h3>
              <p className="text-sm text-muted mt-1">
                {thisWeek >= lastWeek
                  ? `Your website generated more enquiries this week than last week — ${thisWeek} new leads. Keep it up!`
                  : `Your website is steady with ${thisWeek} enquiries this week. A quick WhatsApp campaign could boost this.`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Website visitors" value={analytics ? compact(analytics.visitors) : '—'} icon={Globe} spark={trend.map((t) => t.visitors)} />
        <KpiCard label="New leads" value={analytics ? String(analytics.leads) : '—'} icon={Users} sparkColor="#DB2777" spark={trend.map((t) => t.leads)} />
        <KpiCard label="Conversion rate" value={analytics ? `${analytics.conversion}%` : '—'} icon={TrendingUp} />
        <KpiCard label="WhatsApp clicks" value={analytics ? String(analytics.whatsappClicks) : '—'} icon={MessageCircle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-content">Website traffic</h3><p className="text-xs text-muted">Last 14 days</p></div><button className="text-xs font-semibold text-brand hover:underline flex items-center gap-1" onClick={() => nav('/portal/analytics')}>Full analytics <ArrowRight size={12} /></button></div>
          {analytics ? <AreaChart data={trend} valueKey="visitors" height={200} /> : <p className="text-sm text-muted py-10 text-center">Analytics will appear once your website is live.</p>}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display font-extrabold text-content mb-3">Your plan</h3>
            <div className="flex items-center justify-between"><Badge tone={client.plan === 'pro' ? 'violet' : client.plan === 'growth' ? 'brand' : 'neutral'}>{plan.name}</Badge>{subscription && <StatusBadge kind="sub" value={subscription.status} />}</div>
            {subscription && <p className="text-sm text-muted mt-3">{inr(subscription.price)} / 28 days · Renews {fmtDate(subscription.renewal)}</p>}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-line/60">
              <span className="text-xs font-bold text-muted">Payment</span>
              {latestPayment ? <StatusBadge kind="payment" value={latestPayment.status} dot /> : <Badge tone="neutral">No payments</Badge>}
            </div>
            <button className="btn-outline btn-sm w-full mt-3" onClick={() => nav('/portal/subscription')}>Manage plan</button>
          </div>
          {website && (
            <div className="card p-5">
              <h3 className="font-bold text-content mb-2">My website</h3>
              <div className="flex items-center gap-2 mb-2"><Globe size={15} className="text-brand" /><span className="text-sm font-medium text-content">{website.domain}</span></div>
              <StatusBadge kind="website" value={website.status} dot />
              <button className="btn-outline btn-sm w-full mt-3" onClick={() => nav('/portal/website')}>View website</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {project && (
          <div className="card p-5">
            <h3 className="font-bold text-content mb-3">Project progress</h3>
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-content">{project.name}</span><StatusBadge kind="project" value={project.status} /></div>
            <div className="flex items-center gap-2"><Progress value={project.progress} /><span className="text-xs text-muted w-9 text-right">{project.progress}%</span></div>
            <button className="btn-outline btn-sm mt-4" onClick={() => nav('/portal/project')}>View project</button>
          </div>
        )}
        <div className="card p-5">
          <h3 className="font-bold text-content mb-3">Quick actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <QA icon={Inbox} label={`Requests${openRequests ? ` (${openRequests})` : ''}`} onClick={() => nav('/portal/requests')} />
            <QA icon={Users} label="View leads" onClick={() => nav('/portal/leads')} />
            <QA icon={MessageCircle} label="WhatsApp" onClick={() => nav('/portal/whatsapp')} />
            <QA icon={LifeBuoy} label={`Support${openTickets ? ` (${openTickets})` : ''}`} onClick={() => nav('/portal/support')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QA({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-line hover:border-brand/40 hover:bg-surface/60 transition-all"><Icon size={20} className="text-brand" /><span className="text-xs font-medium text-content">{label}</span></button>;
}
