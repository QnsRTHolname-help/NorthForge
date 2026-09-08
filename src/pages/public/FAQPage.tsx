import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MessageCircle, Sparkles } from 'lucide-react';
import { PublicShell, SectionHead } from '@/components/marketing/PublicShell';
import { PUBLIC_FAQS } from '@/data/faq';
import { waLink, waMessages } from '@/utils/contact';
import { cx } from '@/utils/format';

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  const wa = waLink(waMessages.general);

  return (
    <PublicShell
      seoTitle="FAQ — NorthForge | Websites, AI, WhatsApp & Automation"
      seoDescription="Frequently asked questions about NorthForge: website pricing, hosting, SSL, domains, WhatsApp, AI, automation, client portal and support."
    >
      <div className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6"><Sparkles size={13} className="text-brand" /> Straight answers</div>
          <h1 className="font-display font-black text-content leading-[1.02] tracking-tight text-[40px] sm:text-6xl max-w-3xl mx-auto">Questions businesses actually ask.</h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">Everything about what NorthForge builds, how it works, what's included and what happens after launch.</p>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="space-y-3">
            {PUBLIC_FAQS.map((f, i) => (
              <div key={f.q} className={cx('card overflow-hidden transition-all', open === i && 'shadow-clay-lg')}>
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                  <span className="font-display font-bold text-content text-[15px]">{f.q}</span>
                  <span className={cx('w-7 h-7 rounded-full bg-sunken shadow-clay-inset flex items-center justify-center shrink-0 transition-transform', open === i && 'rotate-180')}>
                    <ChevronDown size={16} className="text-brand" />
                  </span>
                </button>
                <div className={cx('grid transition-all duration-300', open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                  <div className="overflow-hidden"><p className="px-5 pb-5 text-sm text-muted leading-relaxed">{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="card p-8 sm:p-12" style={{ background: 'var(--card-hi)' }}>
            <SectionHead eyebrow="Still unsure" title="Ask us directly." sub="Message us on WhatsApp or book an automation audit and we'll tell you honestly what your business needs." />
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/contact" className="btn-primary">Find My Automation Opportunities <ArrowRight size={16} /></Link>
              <a href={wa} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> Talk on WhatsApp</a>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
