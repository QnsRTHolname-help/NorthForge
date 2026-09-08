import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { PublicShell, SectionHead, Reveal } from '@/components/marketing/PublicShell';
import { waLink, waMessages } from '@/utils/contact';
import { cx } from '@/utils/format';

const STEPS = [
  { n: '01', title: 'Discover', text: 'We understand your business, customers and goals — and where repetitive work is quietly costing you time.', tone: 'violet' },
  { n: '02', title: 'Design', text: 'We design your visual identity and conversion structure so every page has a clear job: attract, inform and capture.', tone: 'pink' },
  { n: '03', title: 'Build', text: 'We build your website, hosting, SSL, domain and digital infrastructure — clean, fast and ready to work.', tone: 'sky' },
  { n: '04', title: 'Connect', text: 'We wire in lead capture, CRM, AI, WhatsApp, analytics and the automations your business needs.', tone: 'violet' },
  { n: '05', title: 'Launch', text: 'Your system goes live. We verify everything, set up the portal and make sure enquiries flow correctly.', tone: 'success' },
  { n: '06', title: 'Grow', text: 'We monitor, measure and optimise continuously so your system improves as your business does.', tone: 'pink' },
];

const GRAD: Record<string, string> = {
  violet: 'linear-gradient(135deg,#a78bfa,#7C3AED)',
  pink: 'linear-gradient(135deg,#f472b6,#DB2777)',
  sky: 'linear-gradient(135deg,#38bdf8,#0EA5E9)',
  success: 'linear-gradient(135deg,#34d399,#10B981)',
};

export default function HowItWorksPage() {
  const wa = waLink(waMessages.general);
  return (
    <PublicShell
      seoTitle="How It Works — NorthForge | Discover → Design → Build → Connect → Launch → Grow"
      seoDescription="NorthForge's six-step process: discover, design, build, connect, launch and grow a complete digital system for your business."
    >
      <div className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="inline-flex items-center gap-2 chip mb-6"><Sparkles size={13} className="text-brand" /> A clear path from idea to system</div>
          <h1 className="font-display font-black text-content leading-[1.02] tracking-tight text-[40px] sm:text-6xl max-w-4xl mx-auto">From first conversation to a working system.</h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">No mystery, no endless meetings. Six focused steps take your business from its current setup to a website that captures, qualifies and follows up automatically.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact" className="btn-primary !px-6 !py-3 text-base">Start Step One <ArrowRight size={18} /></Link>
            <a href={wa} target="_blank" rel="noreferrer" className="btn-outline !px-6 !py-3 text-base"><MessageCircle size={18} /> WhatsApp</a>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <Reveal key={s.n}>
                <div className={cx('card p-6 sm:p-8 grid md:grid-cols-[auto_1fr] gap-4 md:gap-6 items-start', i % 2 === 1 && 'md:-rotate-[0.4deg]')}>
                  <div className="w-16 h-16 rounded-4xl flex items-center justify-center text-white animate-clay-float shrink-0"
                    style={{ background: GRAD[s.tone], boxShadow: 'var(--clay)', animationDelay: `${i * 0.35}s` }}>
                    <span className="font-display font-black text-xl">{s.n}</span>
                  </div>
                  <div>
                    <h2 className="font-display font-black text-content text-2xl tracking-tight">{s.title}</h2>
                    <p className="text-muted mt-2 leading-relaxed max-w-2xl">{s.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="card p-8 sm:p-12 text-center" style={{ background: 'var(--card-hi)' }}>
            <SectionHead eyebrow="What you get" title="A website that is only the beginning." sub="Behind the website sits a lead engine, AI assistant, CRM, WhatsApp automation, analytics and a client portal — all connected." />
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/pricing" className="btn-primary">View Pricing <ArrowRight size={16} /></Link>
              <a href={wa} target="_blank" rel="noreferrer" className="btn-outline"><MessageCircle size={16} /> Talk on WhatsApp</a>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
