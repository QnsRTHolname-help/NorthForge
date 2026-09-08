import { useState } from 'react';
import { ArrowRight, Check, Loader2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { PublicShell, SectionHead } from '@/components/marketing/PublicShell';
import { AGENCY } from '@/data/catalog';
import { contactService } from '@/services';
import { waLink, waMessages, mailto, tel } from '@/utils/contact';
import { validate, LIMITS, rateLimit, isBot, HONEYPOT_NAME, type FieldRule } from '@/utils/security';
import { cx } from '@/utils/format';

const BUSINESS_TYPES = ['Local business', 'Clinic / Healthcare', 'Restaurant / Café', 'Real Estate', 'Education / Training', 'Beauty / Salon', 'Online service', 'Other'];
const CURRENT_TOOLS = ['Nothing / no website', 'WhatsApp only', 'Google Business Profile', 'Instagram / Facebook', 'WordPress / website', 'CRM or booking tool', 'ERP / other'];
const MONTHLY_ENQUIRIES = ['0–5', '6–20', '21–50', '50+', 'Not sure'];

export default function ContactPage() {
  const [f, setF] = useState({
    name: '', business: '', email: '', phone: '', businessType: '',
    currentTools: '', biggestTimeSink: '', monthlyEnquiries: '', message: '', [HONEYPOT_NAME]: '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<{ ref?: string } | null>(null);

  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (isBot(f[HONEYPOT_NAME])) { setErr('Something went wrong. Please try again.'); return; }
    const rules: Record<string, { value: string; rule: FieldRule }> = {
      name: { value: f.name, rule: { required: true, max: LIMITS.name } },
      business: { value: f.business, rule: { required: true, max: LIMITS.business } },
      email: { value: f.email, rule: { required: true, kind: 'email', max: LIMITS.email } },
      phone: { value: f.phone, rule: { kind: 'phone', max: LIMITS.phone } },
      businessType: { value: f.businessType, rule: { required: true, max: LIMITS.short } },
    };
    const errors = validate(rules);
    const first = Object.values(errors)[0];
    if (first) { setErr(first); return; }
    const rl = rateLimit('contact:audit', 4, 60_000);
    if (!rl.ok) { setErr(`Too many submissions. Please wait ${Math.ceil(rl.retryInMs / 1000)}s and try again.`); return; }

    setLoading(true);
    try {
      const res = await contactService.submitAudit({
        name: f.name, business: f.business, email: f.email, phone: f.phone,
        businessType: f.businessType, currentTools: f.currentTools,
        biggestTimeSink: f.biggestTimeSink, monthlyEnquiries: f.monthlyEnquiries,
        message: f.message,
      });
      setDone({ ref: res.backend.ref || res.lead.code });
    } catch {
      setErr("We couldn't submit your enquiry. Please try again or message us on WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicShell
      seoTitle="Contact / Automation Audit — NorthForge"
      seoDescription="Tell NorthForge about your business and current tools. We'll find where repetitive work can be automated and build a system that turns enquiries into customers."
    >
      <div className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6"><Mail size={13} className="text-brand" /> Automation audit</div>
          <h1 className="font-display font-black text-content leading-[1.02] tracking-tight text-[40px] sm:text-6xl max-w-3xl mx-auto">Find your automation opportunities.</h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">Tell us what you're working with and where time is being lost. NorthForge will show you what a connected website + automation system could save.</p>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
            <div className="card p-6 sm:p-8">
              {done ? (
                <div className="text-center py-10 animate-fade-up">
                  <div className="w-16 h-16 rounded-4xl mx-auto flex items-center justify-center text-white mb-5" style={{ background: 'linear-gradient(135deg,#34d399,#10B981)', boxShadow: 'var(--clay)' }}>
                    <Check size={28} />
                  </div>
                  <h2 className="font-display font-black text-content text-2xl">Enquiry recorded.</h2>
                  <p className="text-sm text-muted mt-2 max-w-sm mx-auto leading-relaxed">Thanks {f.name}. You're now in the NorthForge pipeline. We'll review your business and get back to you on WhatsApp or email shortly.</p>
                  {done.ref && <p className="mt-3 text-xs text-faint font-bold">Reference: {done.ref}</p>}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <a href={waLink(waMessages.general)} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={14} /> Message now</a>
                    <a href={mailto('Re: Automation audit', `Reference: ${done.ref || ''}`)} className="btn-outline btn-sm"><Mail size={14} /> Email us</a>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="label">Your name *</label><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Full name" /></div>
                    <div><label className="label">Business name *</label><input className="input" value={f.business} onChange={(e) => set('business', e.target.value)} autoComplete="organization" placeholder="Business name" /></div>
                    <div><label className="label">Email *</label><input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="you@business.in" /></div>
                    <div><label className="label">WhatsApp / Phone</label><input className="input" type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" placeholder="+91 …" /></div>
                    <div><label className="label">Business type *</label>
                      <select className="input" value={f.businessType} onChange={(e) => set('businessType', e.target.value)}>
                        <option value="">Select a type…</option>
                        {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Current tools</label>
                      <select className="input" value={f.currentTools} onChange={(e) => set('currentTools', e.target.value)}>
                        <option value="">Select tools you use…</option>
                        {CURRENT_TOOLS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2"><label className="label">What process takes the most time?</label>
                      <textarea className="input min-h-[70px]" value={f.biggestTimeSink} onChange={(e) => set('biggestTimeSink', e.target.value)} placeholder="e.g. answering the same WhatsApp questions, manually updating bookings, following up on enquiries…" maxLength={LIMITS.short} />
                    </div>
                    <div><label className="label">Approximate monthly enquiries</label>
                      <select className="input" value={f.monthlyEnquiries} onChange={(e) => set('monthlyEnquiries', e.target.value)}>
                        <option value="">Select range…</option>
                        {MONTHLY_ENQUIRIES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div><label className="label">Anything else</label>
                      <input className="input" value={f.message} onChange={(e) => set('message', e.target.value)} placeholder="Optional" maxLength={LIMITS.message} />
                    </div>
                  </div>
                  <input type="text" name={HONEYPOT_NAME} tabIndex={-1} autoComplete="off" aria-hidden="true"
                    value={f[HONEYPOT_NAME]} onChange={(e) => set(HONEYPOT_NAME, e.target.value)}
                    className="absolute -left-[9999px] w-px h-px opacity-0" />
                  {err && <p className="mt-4 text-xs text-rose-500 font-medium">{err}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full mt-6 !py-3">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <>Find my automation opportunities <ArrowRight size={16} /></>}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-4">
              <div className="card p-6">
                <h2 className="font-display font-black text-content text-lg">How we use this</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">Your details go straight into the NorthForge pipeline. A real person reviews it and replies with specific opportunities for your business — no auto-drip spam.</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-3"><Phone size={15} className="text-brand shrink-0" /><a href={tel()} className="font-medium text-content hover:text-brand">{AGENCY.phone}</a></div>
                  <div className="flex items-center gap-3"><MessageCircle size={15} className="text-brand shrink-0" /><a href={waLink(waMessages.general)} target="_blank" rel="noreferrer" className="font-medium text-content hover:text-brand">Message on WhatsApp</a></div>
                  <div className="flex items-center gap-3"><Mail size={15} className="text-brand shrink-0" /><a href={mailto()} className="font-medium text-content hover:text-brand">{AGENCY.email}</a></div>
                  <div className="flex items-center gap-3"><MapPin size={15} className="text-brand shrink-0" /><span className="font-medium text-content">{AGENCY.location}</span></div>
                </div>
              </div>
              <div className={cx('card p-6')}>
                <p className="text-xs font-black uppercase tracking-wider text-faint mb-3">What happens next</p>
                <ol className="space-y-3">
                  {['A NorthForge team member reviews your business.', 'We identify where time is lost with your current tools.', 'We show you the system we would recommend.', 'You decide — no pressure, no obligation.'].map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-6 h-6 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-display font-black text-xs shrink-0">{i + 1}</span>
                      <span className="text-muted">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
