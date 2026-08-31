import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, MessageCircle, Globe, Bot, BarChart3, Workflow, Users,
  ChevronDown, Phone, Mail, MapPin, Sparkles, ShieldCheck, Zap, Search,
  CalendarClock, Menu, X, ArrowUpRight,
} from 'lucide-react';
import { Logo } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ClayBlobs } from '@/components/ui/ClayBlobs';
import { ChatWidget } from '@/components/ChatWidget';
import { db } from '@/services/db';
import { defaultAssistant } from '@/data/assistant';
import { PLANS, AGENCY, formatINR } from '@/data/catalog';
import { cx } from '@/utils/format';

import { waLink as buildWa, waMessages, planWa } from '@/utils/contact';
const waLink = buildWa(waMessages.general);

/* Scroll-reveal hook */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, cls: cx('transition-all duration-700', shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8') };
}

export default function Landing() {
  const [menu, setMenu] = useState(false);
  // Visitor-facing chat: first configured assistant, else the default
  // NorthForge assistant built from the catalog.
  const assistant = db.readSync('assistants')[0] || defaultAssistant;
  return (
    <div className="min-h-screen bg-surface relative overflow-x-hidden">
      <ClayBlobs variant="marketing" />
      <Nav menu={menu} setMenu={setMenu} />
      <ChatWidget assistant={assistant} />
      <span id="top" />
      <main className="relative z-10">
        <Hero />
        <ValueStrip />
        <Services />
        <HowItWorks />
        <Pricing />
        <AutomationShowcase />
        <AIShowcase />
        <LeadShowcase />
        <WhyNorthForge />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ============================ NAV ============================ */
const NAV_LINKS: [string, string][] = [['Services', 'services'], ['How It Works', 'how'], ['Pricing', 'pricing'], ['FAQ', 'faq']];

// Smooth-scroll to a section id, accounting for the sticky navbar height.
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const y = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
}

function Nav({ menu, setMenu }: { menu: boolean; setMenu: (v: boolean) => void }) {
  const [elevated, setElevated] = useState(false);
  const [active, setActive] = useState('');

  // Scroll-aware elevation (transform/opacity friendly — just toggles a class).
  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active-section indication via a single IntersectionObserver.
  useEffect(() => {
    const ids = NAV_LINKS.map(([, id]) => id);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const go = (e: React.MouseEvent, id: string) => { e.preventDefault(); setMenu(false); scrollToSection(id); };

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 pt-3">
      <div className={cx(
        'max-w-6xl mx-auto rounded-3xl px-4 sm:px-5 h-16 flex items-center justify-between transition-all duration-300',
        elevated ? 'bg-panel/90 backdrop-blur-xl shadow-clay -translate-y-0' : 'bg-panel/70 backdrop-blur-xl card-sm'
      )}>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }} aria-label="NorthForge home"><Logo size={34} showWord /></a>
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(([l, id]) => (
            <a key={id} href={`#${id}`} onClick={(e) => go(e, id)}
              className={cx('relative px-3.5 py-2 rounded-xl text-sm font-bold transition-all font-display',
                active === id ? 'text-brand bg-brand/10' : 'text-muted hover:text-content hover:bg-sunken')}>
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block"><ThemeToggle /></div>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline btn-sm hidden sm:inline-flex"><MessageCircle size={14} /> WhatsApp</a>
          <Link to="/login" className="btn-primary btn-sm">Get Started</Link>
          <button className="md:hidden btn-ghost !p-2" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>{menu ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <div className={cx('md:hidden max-w-6xl mx-auto overflow-hidden transition-all duration-300', menu ? 'max-h-96 mt-2 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="bg-panel rounded-3xl card p-3">
          {NAV_LINKS.map(([l, id]) => (
            <a key={id} href={`#${id}`} onClick={(e) => go(e, id)}
              className={cx('block px-4 py-3 rounded-2xl text-sm font-bold font-display transition-colors', active === id ? 'text-brand bg-brand/10' : 'text-content hover:bg-sunken')}>{l}</a>
          ))}
          <div className="flex gap-2 mt-2 px-1">
            <Link to="/login" className="btn-outline btn-sm flex-1">Sign In</Link>
            <a href={waLink} target="_blank" rel="noreferrer" className="btn-primary btn-sm flex-1"><MessageCircle size={14} /> Chat</a>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================ HERO ============================ */
function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8 sm:pt-20 sm:pb-16">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-6 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 chip mb-6"><Sparkles size={13} className="text-brand" /> Web · Automation · AI · Growth</div>
          <h1 className="font-display font-black text-content leading-[1.02] tracking-tight text-[42px] sm:text-6xl">
            Premium websites that <span className="relative inline-block">actually
              <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M2 7 Q100 1 198 6" stroke="#DB2777" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
            </span> bring leads.
          </h1>
          <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
            NorthForge builds business websites with lead capture, WhatsApp, AI assistants and automation — so visitors turn into enquiries and enquiries turn into customers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary !px-6 !py-3 text-base">Start Your Website <ArrowRight size={18} /></Link>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="btn-outline !px-6 !py-3 text-base">View Pricing</a>
            <a href={waLink} target="_blank" rel="noreferrer" className="btn-ghost !px-4 !py-3 text-base text-brand"><MessageCircle size={18} /> WhatsApp</a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-muted">
            {['Hosting & SSL included', 'Live in 7–14 days', 'From ₹999 / 28 days'].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><Check size={14} className="text-clay-success" /> {t}</span>
            ))}
          </div>
        </div>
        <HeroComposition />
      </div>
    </section>
  );
}

/* Abstract clay composition — the NorthForge ecosystem as connected physical objects */
function HeroComposition() {
  const nodes = [
    { icon: Globe, label: 'Website', tone: 'violet', pos: 'top-0 left-1/2 -translate-x-1/2', delay: '0s' },
    { icon: Users, label: 'Lead', tone: 'pink', pos: 'top-[30%] right-0', delay: '.6s' },
    { icon: MessageCircle, label: 'WhatsApp', tone: 'success', pos: 'bottom-0 right-[18%]', delay: '1.2s' },
    { icon: Bot, label: 'AI', tone: 'sky', pos: 'bottom-[8%] left-0', delay: '.9s' },
    { icon: BarChart3, label: 'Analytics', tone: 'violet', pos: 'top-[32%] left-0', delay: '.3s' },
  ] as const;
  const toneStyle: Record<string, string> = {
    violet: 'linear-gradient(135deg,#a78bfa,#7C3AED)',
    pink: 'linear-gradient(135deg,#f472b6,#DB2777)',
    sky: 'linear-gradient(135deg,#38bdf8,#0EA5E9)',
    success: 'linear-gradient(135deg,#34d399,#10B981)',
  };
  return (
    <div className="relative mx-auto w-full max-w-[440px] aspect-square animate-fade-up" style={{ animationDelay: '.15s' }}>
      {/* connecting lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" aria-hidden>
        {[[50,14,88,36],[88,36,78,86],[78,86,14,90],[14,90,10,40],[10,40,50,14],[50,50,50,14],[50,50,88,36],[50,50,10,40],[50,50,78,86]].map((l,i)=>(
          <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#7C3AED" strokeWidth="0.6" strokeOpacity="0.28" strokeDasharray="2 2" />
        ))}
      </svg>
      {/* center hub */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-24 h-24 rounded-4xl flex items-center justify-center animate-clay-breathe"
          style={{ background: 'var(--hub-hi)', boxShadow: 'var(--clay-lg)' }}>
          <Logo size={44} />
        </div>
      </div>
      {/* orbiting nodes */}
      {nodes.map((n) => (
        <div key={n.label} className={cx('absolute z-20 animate-clay-float', n.pos)} style={{ animationDelay: n.delay }}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white"
              style={{ background: toneStyle[n.tone], boxShadow: '8px 10px 22px rgba(93,53,177,0.28), -4px -4px 12px rgba(255,255,255,0.6), inset 2px 2px 4px rgba(255,255,255,0.4), inset -3px -3px 8px rgba(0,0,0,0.18)' }}>
              <n.icon size={26} />
            </div>
            <span className="text-[11px] font-black text-content font-display px-2 py-0.5 rounded-full bg-panel card-sm">{n.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================ VALUE STRIP ============================ */
function ValueStrip() {
  const { ref, cls } = useReveal();
  const items = [
    { icon: Globe, t: 'A website that sells', d: 'Designed around enquiries, not just looks.' },
    { icon: MessageCircle, t: 'Reach you on WhatsApp', d: 'Where your customers already are.' },
    { icon: Bot, t: 'AI that answers', d: 'Common questions, handled 24/7.' },
    { icon: BarChart3, t: 'See what works', d: 'Real analytics on leads & traffic.' },
  ];
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-10', cls)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((it) => (
          <div key={it.t} className="card p-5">
            <div className="w-11 h-11 rounded-2xl bg-brand/12 shadow-clay-inset flex items-center justify-center mb-3"><it.icon size={18} className="text-brand" /></div>
            <h3 className="font-display font-extrabold text-content text-[15px]">{it.t}</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ SERVICES (ecosystem) ============================ */
function Services() {
  const { ref, cls } = useReveal();
  const groups = [
    { cat: 'Web', tone: 'violet', items: ['Premium Business Websites', 'Hosting & SSL', 'Custom Domains', 'SEO & Optimization'] },
    { cat: 'Growth', tone: 'pink', items: ['Lead Capture', 'CRM', 'Business Analytics', 'Automated Follow-ups'] },
    { cat: 'AI', tone: 'sky', items: ['AI Assistants', 'AI Lead Qualification'] },
    { cat: 'Automation', tone: 'violet', items: ['WhatsApp Integration', 'WhatsApp Automation', 'Custom Business Workflows', 'Appointment & Booking Systems'] },
    { cat: 'Operations', tone: 'success', items: ['Maintenance & Support'] },
  ];
  const dot: Record<string, string> = { violet: 'bg-brand', pink: 'bg-pink2', sky: 'bg-sky2', success: 'bg-clay-success' };
  return (
    <section id="services" ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="Services" title="One connected system for your business" sub="Not fifteen disconnected tools — a single ecosystem covering your website, growth, AI and automation." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {groups.map((g, i) => (
          <div key={g.cat} className={cx('card p-6', i === 0 && 'lg:row-span-2 lg:flex lg:flex-col')}>
            <div className="flex items-center gap-2 mb-4">
              <span className={cx('w-2.5 h-2.5 rounded-full', dot[g.tone])} />
              <h3 className="font-display font-black text-content text-lg">{g.cat}</h3>
              <span className="badge bg-sunken text-faint ml-auto">{g.items.length}</span>
            </div>
            <ul className={cx('space-y-2.5', i === 0 && 'lg:flex-1')}>
              {g.items.map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm">
                  <Check size={15} className="text-clay-success shrink-0" />
                  <span className="text-content font-medium">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ HOW IT WORKS ============================ */
function HowItWorks() {
  const { ref, cls } = useReveal();
  const steps = [
    { n: '01', t: 'Tell us about your business', d: 'We learn your goals, services and the customers you want.' },
    { n: '02', t: 'We design your system', d: 'A website, lead capture and automation built for you.' },
    { n: '03', t: 'We build & connect everything', d: 'Hosting, SSL, domain, WhatsApp and AI — all wired together.' },
    { n: '04', t: 'You launch & get enquiries', d: 'Go live and start turning visitors into customers.' },
  ];
  return (
    <section id="how" ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="How it works" title="From idea to enquiries in four steps" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        {steps.map((s, i) => (
          <div key={s.n} className="card p-6 relative" style={{ transitionDelay: `${i * 60}ms` }}>
            <div className="w-14 h-14 rounded-3xl flex items-center justify-center font-display font-black text-white text-lg mb-4 animate-clay-float"
              style={{ background: 'linear-gradient(135deg,#a78bfa,#7C3AED)', boxShadow: 'var(--clay)', animationDelay: `${i * 0.4}s` }}>{s.n}</div>
            <h3 className="font-display font-extrabold text-content">{s.t}</h3>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ PRICING ============================ */
function Pricing() {
  const { ref, cls } = useReveal();
  return (
    <section id="pricing" ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="Pricing" title="Plans that grow with your business" sub="Every plan renews every 28 days. Start online, then add customers, then automate. Upgrade any time." />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 items-stretch">
        {PLANS.map((p) => (
          <div key={p.id} className={cx('card card-hover p-6 flex flex-col relative', p.popular && 'lg:-translate-y-3 shadow-clay-lg')}
            style={p.popular ? { background: 'var(--card-hi)' } : undefined}>
            {p.popular && <span className="badge text-white absolute -top-3 left-6" style={{ background: 'linear-gradient(135deg,#f472b6,#DB2777)', boxShadow: '4px 5px 12px rgba(219,39,119,0.4)' }}>Best balance</span>}
            <h3 className="font-display font-black text-content text-xl">{p.name}</h3>
            <p className="text-xs text-muted mt-1 font-medium">{p.goal}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-3xl font-black text-content tracking-tight">{formatINR(p.price)}</span>
              {p.price > 0 && <span className="text-sm text-faint font-bold">/ 28 days</span>}
            </div>
            <ul className="mt-5 space-y-2.5 flex-1">
              {p.features.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <Check size={15} className="text-clay-success shrink-0 mt-0.5" />
                  <span className="text-content font-medium">{f.label}</span>
                </li>
              ))}
            </ul>
            <a href={planWa(p.id)} target="_blank" rel="noreferrer" className={cx('mt-6 w-full', p.popular ? 'btn-primary' : 'btn-outline')}>
              {p.price === 0 ? 'Request a quote' : 'Get started'}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ AUTOMATION SHOWCASE ============================ */
function AutomationShowcase() {
  const { ref, cls } = useReveal();
  const flow = [
    { icon: Globe, label: 'Website enquiry', tone: 'violet' },
    { icon: Bot, label: 'AI qualification', tone: 'sky' },
    { icon: BarChart3, label: 'CRM record', tone: 'violet' },
    { icon: MessageCircle, label: 'WhatsApp confirm', tone: 'success' },
    { icon: Zap, label: 'Follow-up', tone: 'pink' },
    { icon: Check, label: 'Conversion', tone: 'success' },
  ] as const;
  const grad: Record<string, string> = {
    violet: 'linear-gradient(135deg,#a78bfa,#7C3AED)', sky: 'linear-gradient(135deg,#38bdf8,#0EA5E9)',
    success: 'linear-gradient(135deg,#34d399,#10B981)', pink: 'linear-gradient(135deg,#f472b6,#DB2777)',
  };
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="Automation" title="Every enquiry, handled automatically" sub="This is exactly how the workflow builder inside NorthForge Agency OS runs your leads — no enquiry slips through." />
      <div className="card p-6 sm:p-10 mt-10">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {flow.map((step, i) => (
            <div key={step.label} className="flex flex-col lg:flex-row items-center gap-3 lg:flex-1">
              <div className="flex items-center gap-3 w-full lg:flex-col lg:text-center lg:gap-2">
                <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-white shrink-0"
                  style={{ background: grad[step.tone], boxShadow: 'var(--clay)' }}><step.icon size={24} /></div>
                <span className="text-sm font-display font-extrabold text-content lg:text-xs">{step.label}</span>
              </div>
              {i < flow.length - 1 && <ArrowRight size={18} className="text-brand/50 rotate-90 lg:rotate-0 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ AI SHOWCASE ============================ */
function AIShowcase() {
  const { ref, cls } = useReveal();
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <SectionHead align="left" eyebrow="AI" title="An assistant that understands your business" sub="The AI Customer Assistant answers questions from your business information, then qualifies each enquiry and scores intent — automatically." />
          <div className="mt-6 space-y-3">
            {[['Answers common questions instantly', Bot], ['Detects intent & scores each lead', BarChart3], ['Hands hot leads to you on WhatsApp', MessageCircle]].map(([t, Icon]: any) => (
              <div key={t} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-2xl bg-brand/12 shadow-clay-inset flex items-center justify-center"><Icon size={16} className="text-brand" /></span>
                <span className="text-sm font-medium text-content">{t}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Simulated conversation */}
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-line/60">
            <span className="w-9 h-9 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#38bdf8,#0EA5E9)' }}><Bot size={17} /></span>
            <div><p className="font-display font-extrabold text-content text-sm leading-none">NorthForge Assistant</p><p className="text-[11px] text-clay-success font-bold mt-1">● Online</p></div>
          </div>
          <div className="space-y-3 py-4">
            <div className="max-w-[82%] bg-sunken rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-content shadow-clay-inset">How much does a website cost?</div>
            <div className="max-w-[85%] ml-auto text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm" style={{ background: 'linear-gradient(135deg,#a78bfa,#7C3AED)' }}>
              NorthForge plans start at ₹999 for 28 days and include hosting, SSL, WhatsApp and lead capture. Would you like me to book a quick call?
            </div>
          </div>
          <div className="rounded-2xl bg-sunken shadow-clay-inset p-4 mt-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-faint mb-2">Lead detected</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Intent', 'High', 'text-clay-success'], ['Service', 'Website', 'text-brand'], ['Score', '92', 'text-pink2']].map(([k, v, c]) => (
                <div key={k}><p className="text-[11px] text-muted font-bold">{k}</p><p className={cx('font-display font-black text-lg', c)}>{v}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ LEAD SHOWCASE ============================ */
function LeadShowcase() {
  const { ref, cls } = useReveal();
  const stages = [
    { label: 'New Lead', tone: 'sky', name: 'Website enquiry', note: 'Captured automatically' },
    { label: 'Contacted', tone: 'violet', name: 'First response', note: 'WhatsApp or call' },
    { label: 'Qualified', tone: 'violet', name: 'AI-scored intent', note: 'Budget & fit' },
    { label: 'Proposal', tone: 'pink', name: 'Quote sent', note: 'Plan or custom' },
    { label: 'Won', tone: 'success', name: 'New customer', note: 'Onboarded' },
  ];
  const dot: Record<string, string> = { sky: 'bg-sky2', violet: 'bg-brand', pink: 'bg-pink2', success: 'bg-clay-success' };
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="Lead system" title="Turn enquiries into customers" sub="Every lead moves through a clear pipeline inside your Agency OS — from first contact to won." />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-10">
        {stages.map((s, i) => (
          <div key={s.label} className="card p-4" style={{ transitionDelay: `${i * 70}ms` }}>
            <div className="flex items-center gap-2 mb-3"><span className={cx('w-2 h-2 rounded-full', dot[s.tone])} /><span className="text-xs font-display font-extrabold text-content">{s.label}</span></div>
            <div className="rounded-2xl bg-sunken shadow-clay-inset p-3">
              <p className="text-xs font-bold text-content truncate">{s.name}</p>
              <p className="text-[10px] text-muted mt-1">{s.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ WHY ============================ */
function WhyNorthForge() {
  const { ref, cls } = useReveal();
  const items = [
    { icon: Zap, t: 'Built to bring leads', d: 'We design around enquiries — every page has a job to do.' },
    { icon: ShieldCheck, t: 'Fully managed', d: 'Hosting, SSL, updates and maintenance are all handled.' },
    { icon: Search, t: 'Found on Google', d: 'On-page SEO so the right customers can find you.' },
    { icon: CalendarClock, t: 'Live in 7–14 days', d: 'A clear process that gets you online fast.' },
  ];
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="Why NorthForge" title="A growth engine, not just a website" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        {items.map((w) => (
          <div key={w.t} className="card card-hover p-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3" style={{ background: 'linear-gradient(135deg,#f472b6,#DB2777)', boxShadow: 'var(--clay-sm)' }}><w.icon size={20} /></div>
            <h3 className="font-display font-extrabold text-content">{w.t}</h3>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{w.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ FAQ ============================ */
const faqs = [
  { q: 'What is included in the ₹999 plan?', a: 'The Starter plan gets your business online: a premium business website, hosting & SSL, WhatsApp integration, a lead capture system and ongoing website maintenance — for ₹999 every 28 days.' },
  { q: 'Is hosting included?', a: 'Yes. Every plan includes reliable hosting and HTTPS/SSL by default. You never pay separately for hosting.' },
  { q: 'Do I need to buy a domain?', a: 'No. You can use an existing domain, and NorthForge can also help you set up a new custom domain.' },
  { q: 'Can I use my existing domain?', a: 'Absolutely. If you already own a domain, we connect your new website to it.' },
  { q: 'Can you connect WhatsApp?', a: 'Yes. WhatsApp integration is included from Starter, and full WhatsApp Business automation is available on Pro.' },
  { q: 'Can you add an AI assistant?', a: 'Yes. The AI Customer Assistant is included from the Growth plan and answers common questions using your business information.' },
  { q: 'What is the difference between Starter, Growth and Pro?', a: 'Starter gets your business online. Growth adds tools to get more customers — a CRM, AI assistant, follow-ups and analytics. Pro automates your business with advanced AI automation, WhatsApp Business automation and custom workflows.' },
  { q: 'Can I upgrade later?', a: 'Yes — move from Starter to Growth to Pro at any time as your business grows.' },
  { q: 'How long does a website take?', a: 'Typically around 7–14 days after the required content (text, images, logo) is ready. We keep you updated at each stage.' },
  { q: 'Do you maintain the website after launch?', a: 'Yes. Maintenance & support is included in every plan — updates, fixes and content changes are covered.' },
  { q: 'Can you build custom features?', a: 'Yes, through a Custom Quote tailored to your project, beyond the standard plans.' },
  { q: 'Can you build booking systems?', a: 'Yes. Appointment & booking systems are available on Pro and as part of custom builds.' },
  { q: 'Can you automate follow-ups?', a: 'Yes. Automated follow-ups are included from Growth, with full workflow automation on Pro.' },
  { q: 'Do you work with businesses outside Mangalore?', a: 'NorthForge is based in Mangalore and works closely with local businesses. We also work with businesses beyond Mangalore — message us on WhatsApp and we will discuss what fits.' },
  { q: 'How do I get started?', a: 'Tap Start Your Website or message us on WhatsApp. We will learn about your business and design your system.' },
];

function FAQ() {
  const { ref, cls } = useReveal();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" ref={ref} className={cx('max-w-3xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <SectionHead eyebrow="FAQ" title="Questions clients actually ask" />
      <div className="mt-8 space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className={cx('card overflow-hidden transition-all', open === i && 'shadow-clay-lg')}>
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
              <span className="font-display font-bold text-content text-[15px]">{f.q}</span>
              <span className={cx('w-7 h-7 rounded-full bg-sunken shadow-clay-inset flex items-center justify-center shrink-0 transition-transform', open === i && 'rotate-180')}><ChevronDown size={16} className="text-brand" /></span>
            </button>
            <div className={cx('grid transition-all duration-300', open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <div className="overflow-hidden"><p className="px-5 pb-5 text-sm text-muted leading-relaxed">{f.a}</p></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ FINAL CTA ============================ */
function FinalCTA() {
  const { ref, cls } = useReveal();
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <div className="card p-8 sm:p-14 text-center relative overflow-hidden" style={{ background: 'var(--card-hi)' }}>
        <div className="w-16 h-16 rounded-4xl mx-auto flex items-center justify-center mb-6 animate-clay-float" style={{ background: 'linear-gradient(135deg,#a78bfa,#7C3AED)', boxShadow: 'var(--clay-lg)' }}><Sparkles size={28} className="text-white" /></div>
        <h2 className="font-display font-black text-content tracking-tight text-3xl sm:text-[40px] max-w-2xl mx-auto leading-[1.08]">Your business already has something worth finding.</h2>
        <p className="text-muted mt-4 max-w-lg mx-auto text-lg">Now give people a better way to find it.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login" className="btn-primary !px-6 !py-3 text-base">Start with NorthForge <ArrowRight size={18} /></Link>
          <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline !px-6 !py-3 text-base"><MessageCircle size={18} /> Chat on WhatsApp</a>
        </div>
      </div>
    </section>
  );
}

/* ============================ FOOTER ============================ */
function Footer() {
  return (
    <footer className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-10">
      <div className="card p-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <Logo size={34} showWord />
            <p className="text-sm text-muted mt-4 max-w-xs leading-relaxed">Premium websites, lead systems, AI assistants and automation for growing businesses in Mangalore and beyond.</p>
            <div className="flex gap-2 mt-4">
              <a href={waLink} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={14} /> WhatsApp</a>
              <Link to="/login" className="btn-primary btn-sm">Get Started <ArrowUpRight size={14} /></Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-content text-sm mb-3">Contact</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="flex items-center gap-2"><Phone size={14} className="text-brand" /> {AGENCY.phone}</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-brand" /> <span className="truncate">{AGENCY.email}</span></li>
              <li className="flex items-center gap-2"><MapPin size={14} className="text-brand" /> {AGENCY.location}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-content text-sm mb-3">Hours</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>{AGENCY.hours.weekday}</li><li>{AGENCY.hours.saturday}</li><li>{AGENCY.hours.sunday}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-faint">
          <span>© {new Date().getFullYear()} NorthForge · {AGENCY.website}</span>
          <div className="flex gap-4"><Link to="/login" className="hover:text-content">Sign in</Link><a href={waLink} target="_blank" rel="noreferrer" className="hover:text-content">Contact</a></div>
        </div>
      </div>
    </footer>
  );
}

/* ============================ SHARED ============================ */
function SectionHead({ eyebrow, title, sub, align = 'center' }: { eyebrow: string; title: string; sub?: string; align?: 'center' | 'left' }) {
  return (
    <div className={cx(align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-xl')}>
      <div className="inline-flex items-center gap-2 chip mb-4"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> {eyebrow}</div>
      <h2 className="font-display font-black text-content tracking-tight text-3xl sm:text-[38px] leading-[1.08]">{title}</h2>
      {sub && <p className="text-muted mt-4 text-lg leading-relaxed">{sub}</p>}
    </div>
  );
}
