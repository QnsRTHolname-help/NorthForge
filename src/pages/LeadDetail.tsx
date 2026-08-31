import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, MessageCircle, Mail, StickyNote, CalendarPlus, FileText,
  UserCheck, XCircle, Sparkles, Building2, MapPin, Star, TrendingUp,
} from 'lucide-react';
import { PageHeader, SkeletonList, Avatar, Badge, Progress } from '@/components/ui/primitives';
import { StatusBadge } from '@/components/ui/status';
import { Modal } from '@/components/ui/Modal';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { db } from '@/services/db';
import { leadService, clientService, proposalService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { inr, timeAgo, fmtDate, cx } from '@/utils/format';
import { PLANS } from '@/data/catalog';

const tabs = ['Overview', 'Contact', 'Business', 'Notes', 'Activity'] as const;

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast } = useToast();
  const { data, loading, reload } = useAsync(async () => (await db.read('leads')).find((l) => l.id === id), [id]);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [followOpen, setFollowOpen] = useState(false);
  const [propOpen, setPropOpen] = useState(false);

  if (loading) return <SkeletonList rows={6} />;
  if (!data) return <div className="text-center py-20"><p className="text-muted">Lead not found.</p><Link to="/app/leads" className="btn-outline mt-4 inline-flex">Back to leads</Link></div>;
  const l = data;
  const wa = `https://wa.me/${l.whatsapp.replace(/[^0-9]/g, '')}`;

  const addNote = async () => {
    if (!note.trim()) return;
    await leadService.addNote(l.id, note.trim());
    toast('Note added'); setNote(''); setNoteOpen(false); reload();
  };
  const convert = async () => {
    const c = await clientService.convertLead(l.id);
    toast('Lead converted to client', 'success');
    nav(`/app/clients/${c.id}`);
  };
  const markLost = async () => { await leadService.move(l.id, 'lost'); toast('Lead marked as lost', 'warning'); reload(); };

  return (
    <div>
      <button onClick={() => nav('/app/pipeline')} className="btn-ghost btn-sm mb-4 -ml-2"><ArrowLeft size={15} /> Back to pipeline</button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <Avatar text={l.business} size={56} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-content tracking-tight">{l.business}</h1>
              <StatusBadge kind="lead" value={l.status} dot />
            </div>
            <p className="text-sm text-muted mt-1">{l.code} · {l.category} · {l.contact || 'No contact'}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge kind="priority" value={l.priority} />
              <StatusBadge kind="intent" value={l.intent} />
              <Badge tone="neutral">{l.source}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`tel:${l.phone}`} className="btn-outline btn-sm"><Phone size={14} /> Call</a>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={14} /> WhatsApp</a>
          <a href={`mailto:${l.email}`} className="btn-outline btn-sm"><Mail size={14} /> Email</a>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button className="btn-ghost btn-sm border border-line" onClick={() => setNoteOpen(true)}><StickyNote size={14} /> Add note</button>
        <button className="btn-ghost btn-sm border border-line" onClick={() => setFollowOpen(true)}><CalendarPlus size={14} /> Schedule follow-up</button>
        <button className="btn-ghost btn-sm border border-line" onClick={() => setPropOpen(true)}><FileText size={14} /> Create proposal</button>
        <button className="btn-primary btn-sm ml-auto" onClick={convert}><UserCheck size={14} /> Convert to client</button>
        {l.status !== 'lost' && <button className="btn-ghost btn-sm border border-line text-rose-500" onClick={markLost}><XCircle size={14} /> Mark lost</button>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-line overflow-x-auto">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cx('px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  tab === t ? 'border-brand text-content' : 'border-transparent text-muted hover:text-content')}>{t}</button>
            ))}
          </div>

          {tab === 'Overview' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoCard title="Sales" items={[
                ['Estimated value', inr(l.estValue)], ['Source', l.source], ['Assigned to', l.assignee],
                ['Last contact', fmtDate(l.lastContact)], ['Next follow-up', l.nextFollowUp ? fmtDate(l.nextFollowUp) : '—'],
              ]} />
              <InfoCard title="Business" items={[
                ['Category', l.category], ['Website', l.websiteStatus || '—'],
                ['Google rating', l.googleRating ? `${l.googleRating} ★` : '—'], ['Reviews', l.reviews ? String(l.reviews) : '—'],
              ]} />
              {l.pitch && (
                <div className="card p-4 sm:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-2">Sales pitch</h4>
                  <p className="text-sm text-content">{l.pitch}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'Contact' && (
            <InfoCard title="Contact details" items={[
              ['Contact person', l.contact || '—'], ['Phone', l.phone], ['WhatsApp', l.whatsapp],
              ['Email', l.email || '—'], ['Address', l.address || '—'],
            ]} />
          )}

          {tab === 'Business' && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2"><Building2 size={16} className="text-brand" /><span className="font-semibold text-content">{l.business}</span></div>
              <div className="flex items-center gap-2 text-sm text-muted"><MapPin size={14} /> {l.address || 'Location not provided'}</div>
              {l.googleRating && <div className="flex items-center gap-2 text-sm text-muted"><Star size={14} className="text-amber-500" /> {l.googleRating} rating · {l.reviews} reviews</div>}
              <div className="pt-3 border-t border-line">
                <span className="text-xs font-semibold text-muted">Website status</span>
                <div className="mt-1"><Badge tone={l.websiteStatus === 'None' ? 'danger' : l.websiteStatus === 'Needs Verification' ? 'warning' : 'success'}>{l.websiteStatus}</Badge></div>
              </div>
            </div>
          )}

          {tab === 'Notes' && (
            <div className="space-y-3">
              <button className="btn-outline btn-sm" onClick={() => setNoteOpen(true)}><StickyNote size={14} /> Add note</button>
              {l.notes.length === 0 && <p className="text-sm text-muted py-6 text-center card">No notes yet.</p>}
              {l.notes.map((n) => (
                <div key={n.id} className="card p-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-content">{n.author}</span><span className="text-xs text-faint">{timeAgo(n.at)}</span></div>
                  <p className="text-sm text-muted mt-1.5">{n.body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'Activity' && (
            <div className="card p-5 space-y-4">
              {[
                { a: 'Lead created', t: l.createdAt },
                { a: `Status set to ${l.status}`, t: l.lastContact },
                ...(l.notes.map((n) => ({ a: 'Note added', t: n.at }))),
              ].sort((x, y) => y.t.localeCompare(x.t)).map((e, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                  <span className="text-content flex-1">{e.a}</span>
                  <span className="text-xs text-faint">{timeAgo(e.t)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI qualification sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center"><Sparkles size={16} className="text-brand" /></div>
              <div><h3 className="font-bold text-content text-sm">AI Lead Qualification</h3><p className="text-[11px] text-muted">Automated intent scoring</p></div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <svg width="72" height="72" className="-rotate-90">
                  <circle cx="36" cy="36" r="30" fill="none" strokeWidth="6" className="stroke-line" />
                  <circle cx="36" cy="36" r="30" fill="none" strokeWidth="6" stroke={l.score >= 80 ? '#22c55e' : l.score >= 60 ? '#f59e0b' : '#94a3b8'}
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 30} strokeDashoffset={2 * Math.PI * 30 * (1 - l.score / 100)}
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-bold text-content">{l.score}</span>
              </div>
              <div>
                <StatusBadge kind="intent" value={l.intent} />
                <p className="text-xs text-muted mt-1.5 max-w-[150px]">This lead scored {l.score}/100 based on the factors below.</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(l.scoreFactors || []).map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted">{f.label}</span><span className="font-semibold text-content">{f.value}/20</span></div>
                  <Progress value={(f.value / 20) * 100} tone="violet" />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-line flex items-start gap-2">
              <TrendingUp size={14} className="text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted"><span className="font-semibold text-content">Recommended:</span> {l.score >= 80 ? 'Prioritise outreach — schedule a consultation and prepare a proposal.' : l.score >= 60 ? 'Nurture with a value-focused follow-up within 2 days.' : 'Add to a low-touch sequence and revisit later.'}</p>
            </div>
          </div>
        </div>
      </div>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Add note" size="sm"
        footer={<><button className="btn-ghost" onClick={() => setNoteOpen(false)}>Cancel</button><button className="btn-primary" onClick={addNote}>Add note</button></>}>
        <textarea className="input min-h-[100px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note about this lead…" autoFocus />
      </Modal>

      <FollowUpModal open={followOpen} onClose={() => setFollowOpen(false)} lead={l} onDone={reload} />
      <ProposalModal open={propOpen} onClose={() => setPropOpen(false)} lead={l} onDone={() => { setPropOpen(false); nav('/app/proposals'); }} />
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="card p-5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-faint mb-3">{title}</h4>
      <dl className="space-y-2.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-muted">{k}</dt><dd className="font-medium text-content text-right truncate">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function FollowUpModal({ open, onClose, lead, onDone }: { open: boolean; onClose: () => void; lead: any; onDone: () => void }) {
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const save = async () => {
    await leadService.update(lead.id, { nextFollowUp: date ? new Date(date).toISOString() : undefined });
    toast('Follow-up scheduled'); onClose(); onDone();
  };
  return (
    <Modal open={open} onClose={onClose} title="Schedule follow-up" size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Schedule</button></>}>
      <div className="space-y-3.5">
        <Field label="Channel"><Select value={channel} onChange={setChannel} options={[{value:'whatsapp',label:'WhatsApp'},{value:'call',label:'Call'},{value:'email',label:'Email'}]} /></Field>
        <Field label="Date"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ProposalModal({ open, onClose, lead, onDone }: { open: boolean; onClose: () => void; lead: any; onDone: () => void }) {
  const { toast } = useToast();
  const [plan, setPlan] = useState('growth');
  const save = async () => {
    const p = PLANS.find((x) => x.id === plan)!;
    await proposalService.create({ clientName: lead.business, leadId: lead.id, plan: plan as any,
      items: p.price ? [{ label: `${p.name} Plan (28 days)`, amount: p.price }] : [{ label: 'Custom project', amount: lead.estValue }],
      status: 'draft' });
    await leadService.move(lead.id, 'proposal');
    toast('Proposal created'); onClose(); onDone();
  };
  return (
    <Modal open={open} onClose={onClose} title="Create proposal" size="sm"
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Create proposal</button></>}>
      <div className="space-y-3.5">
        <p className="text-sm text-muted">Create a proposal for <b className="text-content">{lead.business}</b>.</p>
        <Field label="Plan"><Select value={plan} onChange={setPlan} options={PLANS.map((p) => ({ value: p.id, label: `${p.name}${p.price ? ` — ₹${p.price}` : ''}` }))} /></Field>
      </div>
    </Modal>
  );
}
