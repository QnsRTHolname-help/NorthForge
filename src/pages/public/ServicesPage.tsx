import { Link } from 'react-router-dom';
import { ArrowRight, Check, MessageCircle, Sparkles } from 'lucide-react';
import { PublicShell, SectionHead, Reveal } from '@/components/marketing/PublicShell';
import { SERVICES, AGENCY } from '@/data/catalog';
import { waLink, waMessages } from '@/utils/contact';
import { cx } from '@/utils/format';

const CATEGORY_META: Record<string, { tone: string; title: string; blurb: string }> = {
  Website: { tone: 'violet', title: 'Web', blurb: 'A premium website built to represent your business and turn visitors into enquiries.' },
  Infrastructure: { tone: 'sky', title: 'Infrastructure', blurb: 'Reliable hosting, SSL and domains so your website stays fast and secure.' },
  Marketing: { tone: 'pink', title: 'Lead Engine', blurb: 'Capture opportunities and understand what actually drives enquiries.' },
  CRM: { tone: 'violet', title: 'CRM', blurb: 'One pipeline from first enquiry to closed customer.' },
  AI: { tone: 'sky', title: 'AI', blurb: 'Assistants that answer, qualify and recommend actions from real business context.' },
  Automation: { tone: 'success', title: 'Automation', blurb: 'Repetitive follow-ups, WhatsApp and bookings handled automatically.' },
  Analytics: { tone: 'violet', title: 'Analytics', blurb: 'See what is happening with your website and leads.' },
  Support: { tone: 'pink', title: 'Support', blurb: 'Ongoing maintenance, optimisation and help when you need it.' },
};

const DOT: Record<string, string> = { violet: 'bg-brand', sky: 'bg-sky2', pink: 'bg-pink2', success: 'bg-clay-success' };

export default function ServicesPage() {
  const wa = waLink(waMessages.general);
  const groups = Object.entries(CATEGORY_META).map(([cat, meta]) => ({
    ...meta,
    cat,
    items: SERVICES.filter((s) => s.category === cat && s.active),
  })).filter((g) => g.items.length > 0);

  return (
    <PublicShell
      seoTitle="Services — NorthForge | Websites · Automation · AI · Growth"
      seoDescription="NorthForge services: premium business websites, hosting & SSL, lead capture, CRM, AI assistants, WhatsApp automation, analytics and support."
    >
      <div className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6"><Sparkles size={13} className="text-brand" /> Web · Lead Engine · AI · Automation · Analytics</div>
          <h1 className="font-display font-black text-content leading-[1.02] tracking-tight text-[40px] sm:text-6xl max-w-4xl mx-auto">A system that turns your website into a growth engine.</h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">NorthForge connects your website, lead capture, CRM, AI, WhatsApp and analytics into one working system — so enquiries don't just arrive, they get handled.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login" className="btn-primary !px-6 !py-3 text-base">Start with NorthForge <ArrowRight size={18} /></Link>
            <a href={wa} target="_blank" rel="noreferrer" className="btn-outline !px-6 !py-3 text-base"><MessageCircle size={18} /> WhatsApp</a>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid md:grid-cols-2 gap-4">
            {groups.map((g) => (
              <Reveal key={g.cat}>
                <div className="card p-6 sm:p-7 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={cx('w-2.5 h-2.5 rounded-full', DOT[g.tone])} />
                    <h2 className="font-display font-black text-content text-xl">{g.title}</h2>
                    <span className="badge bg-sunken text-faint ml-auto">{g.items.length}</span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed mb-5">{g.blurb}</p>
                  <ul className="grid sm:grid-cols-2 gap-2.5">
                    {g.items.map((s) => (
                      <li key={s.id} className="flex items-start gap-2.5 text-sm">
                        <Check size={15} className="text-clay-success shrink-0 mt-0.5" />
                        <div>
                          <p className="text-content font-semibold">{s.name}</p>
                          <p className="text-xs text-faint mt-0.5">{s.priceNote}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="card p-8 sm:p-12" style={{ background: 'var(--card-hi)' }}>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <SectionHead align="left" eyebrow="Not sure where to start" title="Let NorthForge find the automation opportunities in your business." sub="Book a short automation audit. We'll look at your current site and tools and show you exactly where time is being lost." />
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/contact" className="btn-primary">Find My Automation Opportunities <ArrowRight size={16} /></Link>
                  <a href={wa} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> Talk on WhatsApp</a>
                </div>
              </div>
              <div className="card p-5">
                <p className="text-xs font-black uppercase tracking-wider text-faint mb-3">{AGENCY.name} system</p>
                <div className="space-y-2">
                  {['Website', 'Lead capture', 'AI', 'WhatsApp', 'Automation', 'Analytics'].map((n, i) => (
                    <div key={n} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-brand/10 flex items-center justify-center font-display font-black text-brand text-xs">{i + 1}</span>
                      <span className="text-sm font-bold text-content">{n}</span>
                      {i < 5 && <ArrowRight size={14} className="text-brand/40 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
