import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Save, UserPlus } from 'lucide-react';
import { PageHeader, Avatar, Badge, Progress, EmptyState } from '@/components/ui/primitives';
import { Field, Select } from '@/components/forms/Field';
import { useAsync } from '@/hooks/useAsync';
import { clientService } from '@/services';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import { PLANS, SERVICES } from '@/data/catalog';
import { cx } from '@/utils/format';

const STEPS = [
  'Business Information', 'Contact Information', 'Branding', 'Services', 'Website Content',
  'Domain', 'WhatsApp', 'Lead Capture', 'AI Assistant', 'Automation', 'Final Review',
];

export default function Onboarding() {
  const { toast } = useToast();
  const nav = useNavigate();
  const { data, loading, reload } = useAsync(() => clientService.list(), []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const onboarding = (data || []).filter((c) => c.status === 'onboarding' || c.onboardingStep !== undefined);
  const active = onboarding.find((c) => c.id === activeId);

  return (
    <div>
      <PageHeader title="Client Onboarding" subtitle="Guide new clients through setup" />
      {loading ? null : onboarding.length === 0 ? (
        <EmptyState icon={UserPlus} title="No clients onboarding" message="New clients you add will appear here to complete their setup."
          action={<button className="btn-primary" onClick={() => nav('/app/clients')}>Go to clients</button>} />
      ) : !active ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {onboarding.map((c) => {
            const step = c.onboardingStep ?? 0;
            const pct = Math.round((step / STEPS.length) * 100);
            return (
              <button key={c.id} onClick={() => setActiveId(c.id)} className="card card-hover p-5 text-left">
                <div className="flex items-center justify-between"><Avatar text={c.logoText} size={40} tone="violet" /><Badge tone="warning">Step {step + 1}/{STEPS.length}</Badge></div>
                <h3 className="font-bold text-content mt-3">{c.business}</h3>
                <p className="text-xs text-muted">{STEPS[step]}</p>
                <div className="flex items-center gap-2 mt-3"><Progress value={pct} tone="violet" /><span className="text-xs text-muted">{pct}%</span></div>
              </button>
            );
          })}
        </div>
      ) : (
        <Wizard client={active} onExit={() => { setActiveId(null); reload(); }} onSave={reload} />
      )}
    </div>
  );
}

function Wizard({ client, onExit, onSave }: { client: any; onExit: () => void; onSave: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<number>(client.onboardingStep ?? 0);
  const [f, setF] = useState<Record<string, any> & { services: string[] }>({
    business: client.business, contact: client.contact, email: client.email, phone: client.phone,
    whatsapp: client.whatsapp, industry: client.industry, location: client.location, plan: client.plan,
    services: (client.services || []) as string[],
  });
  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));

  const saveProgress = async (nextStep: number, done = false) => {
    await clientService.update(client.id, {
      ...f, onboardingStep: done ? undefined : nextStep, status: done ? 'active' : 'onboarding',
    });
    onSave();
  };

  const next = async () => {
    if (step < STEPS.length - 1) { const n = step + 1; setStep(n); await saveProgress(n); }
    else { await saveProgress(STEPS.length, true); toast(`${client.business} is now active`, 'success'); onExit(); }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const saveExit = async () => { await saveProgress(step); toast('Progress saved'); onExit(); };

  const toggleService = (id: string) => {
    const services: string[] = f.services;
    set('services', services.includes(id) ? services.filter((s) => s !== id) : [...services, id]);
  };

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      {/* Steps sidebar */}
      <div className="card p-3 h-fit lg:sticky lg:top-20">
        <div className="flex items-center gap-2 px-2 py-2 mb-1"><Avatar text={client.logoText} size={32} tone="violet" /><div className="min-w-0"><p className="text-sm font-semibold text-content truncate">{client.business}</p><p className="text-[11px] text-muted">Onboarding</p></div></div>
        <div className="space-y-0.5">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={cx('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm text-left transition-colors',
                i === step ? 'bg-brand/10 text-content font-semibold' : 'text-muted hover:bg-line/40')}>
              <span className={cx('w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand text-white' : 'bg-line text-faint')}>
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div><p className="text-xs font-bold uppercase tracking-wider text-brand">Step {step + 1} of {STEPS.length}</p><h2 className="text-xl font-bold text-content mt-1">{STEPS[step]}</h2></div>
          <button className="btn-ghost btn-sm" onClick={saveExit}><Save size={14} /> Save & exit</button>
        </div>
        <Progress value={((step) / (STEPS.length - 1)) * 100} />

        <div className="mt-6 space-y-4">
          {step === 0 && <>
            <Field label="Business name"><input className="input" value={f.business} onChange={(e) => set('business', e.target.value)} /></Field>
            <div className="grid sm:grid-cols-2 gap-4"><Field label="Industry"><input className="input" value={f.industry} onChange={(e) => set('industry', e.target.value)} /></Field><Field label="Location"><input className="input" value={f.location} onChange={(e) => set('location', e.target.value)} /></Field></div>
          </>}
          {step === 1 && <>
            <Field label="Contact person"><input className="input" value={f.contact} onChange={(e) => set('contact', e.target.value)} /></Field>
            <div className="grid sm:grid-cols-2 gap-4"><Field label="Email"><input className="input" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field><Field label="Phone"><input className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field></div>
          </>}
          {step === 2 && <>
            <Field label="Primary brand color" hint="Used across the website"><input type="color" className="input h-11 w-24" value={f.color || '#7C3AED'} onChange={(e) => set('color', e.target.value)} /></Field>
            <Field label="Logo initials"><input className="input w-24" maxLength={3} value={f.logoText || client.logoText} onChange={(e) => set('logoText', e.target.value)} /></Field>
          </>}
          {step === 3 && <>
            <p className="text-sm text-muted -mt-2">Select the plan and services for this client.</p>
            <Field label="Plan"><Select value={f.plan} onChange={(v) => set('plan', v)} options={PLANS.map((p) => ({ value: p.id, label: p.name }))} /></Field>
            <div className="grid sm:grid-cols-2 gap-2">
              {SERVICES.map((s) => (
                <button key={s.id} onClick={() => toggleService(s.id)}
                  className={cx('flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-sm',
                    f.services.includes(s.id) ? 'border-brand bg-brand/5 text-content' : 'border-line text-muted hover:border-brand/40')}>
                  <span className={cx('w-4 h-4 rounded flex items-center justify-center shrink-0', f.services.includes(s.id) ? 'bg-brand text-white' : 'border border-line')}>{f.services.includes(s.id) && <Check size={11} />}</span>
                  {s.name}
                </button>
              ))}
            </div>
          </>}
          {step === 4 && <Field label="Website content notes" hint="Pages, sections and content the site should include"><textarea className="input min-h-[120px]" value={f.content || ''} onChange={(e) => set('content', e.target.value)} placeholder="Home, Services, Portfolio, Testimonials, Contact…" /></Field>}
          {step === 5 && <>
            <Field label="Domain" hint="Existing domain, or leave blank and NorthForge will assist"><input className="input" value={f.domain || ''} onChange={(e) => set('domain', e.target.value)} placeholder="yourbusiness.in" /></Field>
          </>}
          {step === 6 && <Field label="WhatsApp number" hint="Where website enquiries are sent"><input className="input" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>}
          {step === 7 && <StepInfo title="Lead capture" body="Enquiry forms and CTA-based lead capture will feed directly into the CRM. Configure the fields you want to collect." />}
          {step === 8 && <StepInfo title="AI Assistant" body="An AI assistant can answer common customer questions using your business information. Available from the Growth plan." />}
          {step === 9 && <StepInfo title="Automation" body="Automated follow-ups and WhatsApp workflows keep every enquiry warm. Full automation is available on Pro." />}
          {step === 10 && (
            <div className="space-y-3">
              <StepInfo title="Final review" body="Confirm the details below, then activate this client." />
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                {[['Business', f.business], ['Contact', f.contact], ['Email', f.email], ['Phone', f.phone], ['Plan', PLANS.find(p=>p.id===f.plan)?.name || f.plan], ['Services', `${f.services.length} selected`]].map(([k, v]) => (
                  <div key={k} className="flex justify-between card p-3"><span className="text-muted">{k}</span><span className="font-medium text-content">{v}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-line">
          <button className="btn-outline" onClick={back} disabled={step === 0}><ChevronLeft size={16} /> Back</button>
          <button className="btn-primary" onClick={next}>{step === STEPS.length - 1 ? <>Activate client <Check size={16} /></> : <>Continue <ChevronRight size={16} /></>}</button>
        </div>
      </div>
    </div>
  );
}

function StepInfo({ title, body }: { title: string; body: string }) {
  return <div className="rounded-xl bg-surface border border-line p-4"><h3 className="font-semibold text-content">{title}</h3><p className="text-sm text-muted mt-1.5">{body}</p></div>;
}
