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
import { PUBLIC_FAQS } from '@/data/faq';
import { cx } from '@/utils/format';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { ScrollProgress, Parallax, Marquee, useReducedMotion, useMobileDevice } from '@/components/motion/motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

import { waLink as buildWa, waMessages, planWa } from '@/utils/contact';
const waLink = buildWa(waMessages.general);

/* Scroll-reveal hook — GSAP ScrollTrigger fade/rise for every major section. */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [reduced]);
  return { ref, cls: '' };
}

export default function Landing() {
  const [menu, setMenu] = useState(false);
  // Visitor-facing chat: first configured assistant, else the default
  // NorthForge assistant built from the catalog.
  const assistant = db.readSync('assistants')[0] || defaultAssistant;
  useSmoothScroll();

  useEffect(() => {
    document.title = 'NorthForge — Websites · Automation · AI · Growth';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'NorthForge builds premium websites connected to lead capture, WhatsApp, AI, automation and analytics — a complete digital system that turns visitors into customers.');
  }, []);

  return (
    <div className="min-h-screen bg-surface relative overflow-x-hidden">
      <ScrollProgress />
      <ClayBlobs variant="marketing" />
      <Nav menu={menu} setMenu={setMenu} />
      <ChatWidget assistant={assistant} />
      <span id="top" />
      <main className="relative z-10">
        <CinematicStage />
        <ValueStrip />
        <Services />
        <HowItWorks />
        <Pricing />
        <AutomationShowcase />
        <AIShowcase />
        <LeadShowcase />
        <WhyNorthForge />
        <SystemMonitor />
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
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Hero entrance choreography — navbar handled by Nav, then eyebrow,
  // headline, copy, CTAs, notes, then the connected system visual.
  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      const parts = [
        '[data-hero-eyebrow]',
        '[data-hero-headline]',
        '[data-hero-copy]',
        '[data-hero-cta]',
        '[data-hero-notes]',
        '[data-hero-visual]',
      ];
      gsap.set(parts, { autoAlpha: 0, y: 24 });
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
      tl.fromTo('[data-hero-eyebrow]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45 })
        .fromTo('[data-hero-headline]', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0 }, '-=0.15')
        .fromTo('[data-hero-copy]', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0 }, '-=0.4')
        .fromTo('[data-hero-cta]', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0 }, '-=0.4')
        .fromTo('[data-hero-notes]', { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.35')
        .fromTo('[data-hero-visual]', { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1 }, '-=0.3');
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={root} className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-8 sm:pt-20 sm:pb-16">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-6 items-center">
        <div>
          <div data-hero-eyebrow className="inline-flex items-center gap-2 chip mb-6"><Sparkles size={13} className="text-brand" /> Web · Automation · AI · Growth</div>
          <h1 data-hero-headline className="font-display font-black text-content leading-[1.02] tracking-tight text-[42px] sm:text-6xl">
            Premium websites that <span className="relative inline-block">actually
              <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M2 7 Q100 1 198 6" stroke="#DB2777" strokeWidth="4" fill="none" strokeLinecap="round"/></svg>
            </span> bring leads.
          </h1>
          <p data-hero-copy className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
            NorthForge builds business websites with lead capture, WhatsApp, AI assistants and automation — so visitors turn into enquiries and enquiries turn into customers.
          </p>
          <div data-hero-cta className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login" className="btn-primary !px-6 !py-3 text-base">Start Your Website <ArrowRight size={18} /></Link>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="btn-outline !px-6 !py-3 text-base">View Pricing</a>
            <a href={waLink} target="_blank" rel="noreferrer" className="btn-ghost !px-4 !py-3 text-base text-brand"><MessageCircle size={18} /> WhatsApp</a>
          </div>
          <div data-hero-notes className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-muted">
            {['Hosting & SSL included', 'Live in 7–14 days', 'From ₹999 / 28 days'].map((t) => (
              <span key={t} className="flex items-center gap-1.5"><Check size={14} className="text-clay-success" /> {t}</span>
            ))}
          </div>
        </div>
        <div data-hero-visual>
          <Parallax speed={11}><HeroComposition /></Parallax>
        </div>
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

/* ============================ CINEMATIC STAGE =============================
   Igloo-style scroll: the first three stories are one pinned scene. As you
   scroll, the camera moves forward — the hero drifts away, a flash washes
   across, then the problem and promise scenes rise into view. Scrubbed to
   scroll, fully reversed on scroll-up, and disabled on mobile/reduced motion
   where a simple stacked read is the right call. */
const PAINS = [
  { icon: MessageCircle, title: 'Missed enquiries', text: 'A visitor reaches out at night and never hears back.' },
  { icon: Zap, title: 'Slow replies', text: 'Answering the same questions over and over instead of doing the work.' },
  { icon: CalendarClock, title: 'Manual follow-ups', text: 'Chasing leads by memory and hoping they get back to you.' },
  { icon: Users, title: 'Scattered customer info', text: 'WhatsApp chats, emails, spreadsheets — nowhere connected.' },
  { icon: Search, title: 'Poor visibility', text: 'You know the website gets traffic, but you can\u2019t see what happens after.' },
  { icon: Bot, title: 'Disconnected tools', text: 'Each tool solves one problem, and they don\u2019t talk to each other.' },
];
const PROMISES = [
  { n: 'FIND', text: 'Find the repetitive business work that quietly steals your time.' },
  { n: 'CONNECT', text: 'Connect the tools you already use into one system.' },
  { n: 'AUTOMATE', text: 'Turn repetitive work into intelligent, reliable workflows.' },
  { n: 'MEASURE', text: 'Track what is really happening, so you can grow with evidence.' },
];

function ProblemScene() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 text-center">
      <div className="inline-flex items-center gap-2 chip mb-5"><span className="w-1.5 h-1.5 rounded-full bg-pink2" /> The real problem</div>
      <h2 className="font-display font-black text-content leading-[1.05] tracking-tight text-3xl sm:text-5xl max-w-3xl mx-auto">
        Traffic isn't the issue. What happens after it is.
      </h2>
      <p className="text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
        Most businesses already have enquiries coming in. The reason they don't become customers is rarely the website — it's the disconnect between the enquiry and the follow-up.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-8 max-w-4xl mx-auto">
        {PAINS.map((p) => (
          <div key={p.title} className="card p-5 text-left">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3"><p.icon size={17} /></div>
            <h3 className="font-display font-extrabold text-content text-[15px]">{p.title}</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromiseScene() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 text-center">
      <div className="inline-flex items-center gap-2 chip mb-5"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> What we promise</div>
      <h2 className="font-display font-black text-content leading-[1.05] tracking-tight text-3xl sm:text-5xl max-w-3xl mx-auto">
        Not a website. A system that works.
      </h2>
      <p className="text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
        NorthForge exists to take the repetitive parts of running a business and make them automatic, visible and measurable.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 max-w-5xl mx-auto">
        {PROMISES.map((p, i) => (
          <div key={p.n} className="card p-5 text-left relative overflow-hidden">
            <span className="absolute -right-2 -top-4 font-display font-black text-[72px] leading-none text-brand/10 select-none">{i + 1}</span>
            <span className="inline-flex items-center gap-2 chip text-brand mb-3"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> {p.n}</span>
            <p className="text-sm text-content font-medium leading-relaxed relative">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CinematicStage() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useMobileDevice();
  const stacked = reduced || mobile;

  useEffect(() => {
    const shell = root.current;
    if (!shell || stacked) return;
    const scenes = Array.from(shell.querySelectorAll<HTMLElement>('[data-scene]'));
    const flash = shell.querySelector('[data-cine-flash]');
    const rail = shell.querySelector('[data-cine-rail]');
    if (scenes.length < 2) return;

    const ctx = gsap.context(() => {
      // Start: only the hero scene is visible; the others are waiting below.
      gsap.set(scenes, { autoAlpha: 0, y: 55, scale: 0.95 });
      gsap.set(scenes[0], { autoAlpha: 1, y: 0, scale: 1 });

      const st = {
        trigger: shell,
        start: 'top top',
        end: '+=230%',
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
      };

      const tl = gsap.timeline({ scrollTrigger: st, defaults: { ease: 'power1.inOut' } });
      tl.to(scenes[0], { autoAlpha: 0, y: -55, scale: 1.06, duration: 0.5 })
        .fromTo(flash, { opacity: 0, scale: 0.9 }, { opacity: 0.85, scale: 1, duration: 0.15 }, '<0.22')
        .to(flash, { opacity: 0, duration: 0.35 }, '<0.28')
        .fromTo(scenes[1], { autoAlpha: 0, y: 55, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 }, '<0.08')
        .to({}, { duration: 0.45 })
        .to(scenes[1], { autoAlpha: 0, y: -55, scale: 1.06, duration: 0.5 })
        .fromTo(flash, { opacity: 0, scale: 0.9 }, { opacity: 0.85, scale: 1, duration: 0.15 }, '<0.22')
        .to(flash, { opacity: 0, duration: 0.35 }, '<0.28')
        .fromTo(scenes[2], { autoAlpha: 0, y: 55, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 }, '<0.08');

      if (rail) {
        gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { ...st, end: '+=230%' } });
      }
    }, shell);

    return () => {
      ScrollTrigger.refresh();
      ctx.revert();
    };
  }, [stacked]);

  if (stacked) {
    return (
      <div className="relative z-10">
        <Hero />
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <ProblemScene />
        </section>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <PromiseScene />
        </section>
      </div>
    );
  }

  return (
    <div ref={root} className="relative h-[100svh] min-h-[680px] overflow-hidden">
      {/* Scenes */}
      <div data-scene className="absolute inset-0 flex items-center justify-center">
        <Hero />
      </div>
      <div data-scene className="absolute inset-0 flex items-center justify-center">
        <ProblemScene />
      </div>
      <div data-scene className="absolute inset-0 flex items-center justify-center">
        <PromiseScene />
      </div>

      {/* Scene flash — motion cue between worlds */}
      <div
        data-cine-flash
        className="pointer-events-none absolute inset-0 z-30"
        style={{ background: 'radial-gradient(circle at 50% 42%, rgba(139,92,246,0.32), rgba(244,246,251,0.16) 42%, transparent 72%)' }}
      />

      {/* Scroll rail */}
      <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-3">
        <span className="text-[10px] font-black text-faint tracking-widest">01 / 03</span>
        <div className="w-1 h-44 rounded-full bg-sunken overflow-hidden" style={{ boxShadow: 'var(--clay-inset)' }}>
          <div data-cine-rail className="w-full h-full origin-top bg-brand" style={{ borderRadius: 999 }} />
        </div>
        <span className="text-[10px] font-black text-faint tracking-widest">03 / 03</span>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 text-faint">
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scroll</span>
        <ChevronDown size={16} className="animate-bounce" />
      </div>
    </div>
  );
}

/* ============================ SYSTEM MONITOR ============================ */
function SystemMonitor() {
  const { ref, cls } = useReveal();
  const metrics = [
    { k: 'Enquiries', v: '—' },
    { k: 'Qualified leads', v: '—' },
    { k: 'Follow-ups', v: '—' },
    { k: 'Appointments', v: '—' },
  ];
  const stream = [
    { icon: MessageCircle, label: 'NEW ENQUIRY' },
    { icon: Bot, label: 'AI QUALIFIED' },
    { icon: BarChart3, label: 'CRM UPDATED' },
    { icon: Zap, label: 'TEAM NOTIFIED' },
    { icon: CalendarClock, label: 'APPOINTMENT BOOKED' },
    { icon: Check, label: 'FOLLOW-UP SCHEDULED' },
  ];
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-16', cls)}>
      <div className="card p-6 sm:p-10 relative overflow-hidden" style={{ background: 'var(--card-hi)' }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="chip text-[11px] mb-3">NORTHFORGE SYSTEM</div>
            <h2 className="font-display font-black text-content text-2xl sm:text-3xl tracking-tight">The system behind the website.</h2>
            <p className="text-sm text-muted mt-2 max-w-xl leading-relaxed">When a visitor submits an enquiry, the NorthForge layer captures it, qualifies it, notifies the team and keeps the follow-up moving.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="badge bg-clay-success/15 text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-current" /> Active</span>
            <span className="badge bg-sunken text-faint">DEMO DATA</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.k} className="card p-5 text-center">
              <p className="font-display font-black text-content text-2xl">{m.v}</p>
              <p className="text-xs text-muted font-bold mt-1">{m.k}</p>
            </div>
          ))}
        </div>
        <Marquee speed={26} decorative>
          {stream.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2 mx-3 chip">
              <s.icon size={15} className="text-brand" />
              <span className="font-display font-extrabold text-content text-xs">{s.label}</span>
              <span className="w-1 h-1 rounded-full bg-clay-success" />
            </span>
          ))}
        </Marquee>
        <p className="text-[11px] text-faint mt-6">Numbers fill in once your website starts capturing real enquiries. Nothing here is invented, and AI never presents sample data as your real performance.</p>
      </div>
    </section>
  );
}

/* ============================ VALUE STRIP ============================ */
function ValueStrip() {
  const { ref, cls } = useReveal();
  const items = [
    { icon: ShieldCheck, t: 'Hosting & SSL' },
    { icon: Zap, t: 'Fast delivery' },
    { icon: Users, t: 'Lead capture' },
    { icon: MessageCircle, t: 'WhatsApp' },
    { icon: Bot, t: 'AI' },
    { icon: Workflow, t: 'Automation' },
    { icon: BarChart3, t: 'Analytics' },
    { icon: Search, t: 'SEO' },
  ];
  return (
    <section ref={ref} className={cx('max-w-6xl mx-auto px-4 sm:px-6 py-6', cls)}>
      <div className="card px-3 py-4 overflow-hidden">
        <Marquee speed={30} decorative>
          {items.map((it) => (
            <span key={it.t} className="inline-flex items-center gap-2 mx-3 chip">
              <it.icon size={15} className="text-brand" />
              <span className="font-display font-extrabold text-content">{it.t}</span>
              <span className="text-faint">·</span>
            </span>
          ))}
        </Marquee>
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
const faqs = PUBLIC_FAQS;

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
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-content">Privacy</Link>
            <Link to="/terms" className="hover:text-content">Terms</Link>
            <Link to="/login" className="hover:text-content">Sign in</Link>
            <a href={waLink} target="_blank" rel="noreferrer" className="hover:text-content">Contact</a>
          </div>
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
