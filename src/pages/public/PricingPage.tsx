import { Link } from 'react-router-dom';
import { ArrowRight, Check, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { PublicShell, SectionHead, Reveal } from '@/components/marketing/PublicShell';
import { PLANS, formatINR, planById, serviceById } from '@/data/catalog';
import { planWa, waLink, waMessages } from '@/utils/contact';
import { cx } from '@/utils/format';

export default function PricingPage() {
  const wa = waLink(waMessages.general);
  return (
    <PublicShell
      seoTitle="Pricing — NorthForge | ₹999 · ₹1,999 · ₹2,999 per 28 days"
      seoDescription="NorthForge plans: Starter ₹999, Growth ₹1,999 and Pro ₹2,999 per 28-day cycle. Website, lead capture, AI, WhatsApp and automation in one system."
    >
      <div className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6"><Sparkles size={13} className="text-brand" /> Simple recurring pricing · 28-day cycle</div>
          <h1 className="font-display font-black text-content leading-[1.02] tracking-tight text-[40px] sm:text-6xl max-w-3xl mx-auto">Pay for a system, not a one-off website.</h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">Every plan includes hosting, SSL, lead capture and maintenance. Start online, add growth tools, then automate — and upgrade any time.</p>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 items-stretch">
            {PLANS.map((p) => {
              const included = p.includedServices.map(serviceById).filter(Boolean);
              return (
                <Reveal key={p.id} className="h-full">
                  <div className={cx('card card-hover p-6 flex flex-col relative h-full', p.popular && 'lg:-translate-y-3 shadow-clay-lg')}
                    style={p.popular ? { background: 'var(--card-hi)' } : undefined}>
                    {p.popular && <span className="badge text-white absolute -top-3 left-6" style={{ background: 'linear-gradient(135deg,#f472b6,#DB2777)', boxShadow: '4px 5px 12px rgba(219,39,119,0.4)' }}>Recommended</span>}
                    <div className="flex items-center gap-2">
                      <h2 className="font-display font-black text-content text-xl">{p.name}</h2>
                      {p.id === 'custom' && <ShieldCheck size={16} className="text-brand" />}
                    </div>
                    <p className="text-xs text-muted mt-1 font-medium">{p.goal}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-black text-content tracking-tight">{formatINR(p.price)}</span>
                      {p.price > 0 && <span className="text-sm text-faint font-bold">/ {p.cycleDays} days</span>}
                    </div>
                    <p className="text-[11px] text-faint font-medium mt-1">Recurring subscription · cancel or upgrade any time</p>
                    <div className="mt-5 space-y-2.5 flex-1">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <Check size={15} className="text-clay-success shrink-0 mt-0.5" />
                          <span className="text-content font-medium">{f.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-line/60">
                      <p className="text-[11px] font-black uppercase tracking-wider text-faint mb-2">Included services</p>
                      <div className="flex flex-wrap gap-1.5">
                        {included.slice(0, 6).map((s) => (
                          <span key={s!.id} className="chip text-[10px] !py-1 !px-2">{s!.name}</span>
                        ))}
                        {included.length > 6 && <span className="chip text-[10px] !py-1 !px-2">+{included.length - 6} more</span>}
                      </div>
                    </div>
                    <a href={planWa(p.id)} target="_blank" rel="noreferrer" className={cx('mt-6 w-full', p.popular ? 'btn-primary' : 'btn-outline')}>
                      {p.price === 0 ? 'Request a quote' : 'Get started'}
                    </a>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
          <div className="card p-7">
            <h2 className="font-display font-black text-content text-xl">How billing works</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li className="flex gap-3"><Check size={16} className="text-clay-success shrink-0 mt-0.5" /><span><strong className="text-content">One-time setup context.</strong> NorthForge plans are recurring subscriptions billed every 28 days. We will always explain what is included before you start.</span></li>
              <li className="flex gap-3"><Check size={16} className="text-clay-success shrink-0 mt-0.5" /><span><strong className="text-content">Upgrades.</strong> You can move between Starter, Growth and Pro at any time. Your library, leads and data remain in place.</span></li>
              <li className="flex gap-3"><Check size={16} className="text-clay-success shrink-0 mt-0.5" /><span><strong className="text-content">Custom work.</strong> Larger or specialised projects are quoted separately and will never be hidden inside a recurring charge.</span></li>
              <li className="flex gap-3"><Check size={16} className="text-clay-success shrink-0 mt-0.5" /><span><strong className="text-content">Third-party costs.</strong> A new domain, AI usage beyond the included allowance, WhatsApp/API services or external integrations may carry separate third-party costs. We list these clearly instead of claiming everything is included forever.</span></li>
            </ul>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="card p-8 sm:p-12" style={{ background: 'var(--card-hi)' }}>
            <SectionHead eyebrow="Not sure which plan" title="Start with the plan you need today." sub="We recommend Growth for most businesses — it adds the CRM, AI assistant, follow-ups and analytics that turn a website into a lead engine." />
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href={planWa('growth')} target="_blank" rel="noreferrer" className="btn-primary">Start with {planById('growth').name} <ArrowRight size={16} /></a>
              <Link to="/contact" className="btn-outline">Book an automation audit</Link>
              <a href={wa} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> Talk on WhatsApp</a>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
