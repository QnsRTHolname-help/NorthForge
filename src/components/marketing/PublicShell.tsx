import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowUpRight, Mail, MapPin, MessageCircle, Menu, Phone, X,
} from 'lucide-react';
import { Logo } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ClayBlobs } from '@/components/ui/ClayBlobs';
import { ChatWidget } from '@/components/ChatWidget';
import { db } from '@/services/db';
import { defaultAssistant } from '@/data/assistant';
import { AGENCY } from '@/data/catalog';
import { waLink, waMessages } from '@/utils/contact';
import { cx } from '@/utils/format';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { ScrollProgress, ScrollReveal } from '@/components/motion/motion';

const NAV_LINKS = [
  { label: 'Services', to: '/services' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/faq' },
];

export function PublicShell({ children, seoTitle, seoDescription }: {
  children: ReactNode;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const assistant = db.readSync('assistants')[0] || defaultAssistant;
  const wa = waLink(waMessages.general);
  useSmoothScroll();

  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    if (seoTitle) document.title = seoTitle;
    if (seoDescription) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', seoDescription);
    }
  }, [seoTitle, seoDescription]);

  return (
    <div className="min-h-screen bg-surface relative overflow-x-hidden">
      <ScrollProgress />
      <ClayBlobs variant="marketing" />
      <header className="sticky top-0 z-50 px-3 sm:px-6 pt-3">
        <PublicNav menu={menu} setMenu={setMenu} wa={wa} />
      </header>
      <ChatWidget assistant={assistant} />
      <main className="relative z-10">{children}</main>
      <PublicFooter wa={wa} />
    </div>
  );
}

function PublicNav({ menu, setMenu, wa }: { menu: boolean; setMenu: (v: boolean) => void; wa: string }) {
  const [elevated, setElevated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      <div className={cx(
        'max-w-6xl mx-auto rounded-3xl px-4 sm:px-5 h-16 flex items-center justify-between transition-all duration-300',
        elevated ? 'bg-panel/90 backdrop-blur-xl shadow-clay' : 'bg-panel/70 backdrop-blur-xl card-sm'
      )}>
        <Link to="/" aria-label="NorthForge home"><Logo size={34} showWord /></Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Public navigation">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cx(
                'relative px-3.5 py-2 rounded-xl text-sm font-bold transition-all font-display',
                isActive(l.to) ? 'text-brand bg-brand/10' : 'text-muted hover:text-content hover:bg-sunken'
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className={cx(
              'relative px-3.5 py-2 rounded-xl text-sm font-bold transition-all font-display',
              isActive('/contact') ? 'text-brand bg-brand/10' : 'text-muted hover:text-content hover:bg-sunken'
            )}
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden lg:block"><ThemeToggle /></div>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-outline btn-sm hidden sm:inline-flex"><MessageCircle size={14} /> WhatsApp</a>
          <Link to="/login" className="btn-primary btn-sm">Get Started</Link>
          <button className="md:hidden btn-ghost !p-2" onClick={() => setMenu(!menu)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}>
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <div className={cx('md:hidden max-w-6xl mx-auto overflow-hidden transition-all duration-300', menu ? 'max-h-96 mt-2 opacity-100' : 'max-h-0 opacity-0')}>
        <div className="bg-panel rounded-3xl card p-3">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cx('block px-4 py-3 rounded-2xl text-sm font-bold font-display transition-colors', isActive(l.to) ? 'text-brand bg-brand/10' : 'text-content hover:bg-sunken')}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/contact" className={cx('block px-4 py-3 rounded-2xl text-sm font-bold font-display transition-colors', isActive('/contact') ? 'text-brand bg-brand/10' : 'text-content hover:bg-sunken')}>
            Contact
          </Link>
          <div className="flex gap-2 mt-2 px-1">
            <Link to="/login" className="btn-outline btn-sm flex-1">Sign In</Link>
            <a href={wa} target="_blank" rel="noreferrer" className="btn-primary btn-sm flex-1"><MessageCircle size={14} /> Chat</a>
          </div>
        </div>
      </div>
    </>
  );
}

function PublicFooter({ wa }: { wa: string }) {
  return (
    <footer className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-10">
      <div className="card p-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <Logo size={34} showWord />
            <p className="text-sm text-muted mt-4 max-w-xs leading-relaxed">Premium websites, lead systems, AI assistants and automation for growing businesses in Mangalore and beyond.</p>
            <div className="flex gap-2 mt-4">
              <a href={wa} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={14} /> WhatsApp</a>
              <Link to="/login" className="btn-primary btn-sm">Get Started <ArrowUpRight size={14} /></Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-content text-sm mb-3">Explore</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li><Link to="/services" className="hover:text-content">Services</Link></li>
              <li><Link to="/how-it-works" className="hover:text-content">How It Works</Link></li>
              <li><Link to="/pricing" className="hover:text-content">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-content">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-content">Contact</Link></li>
              <li><Link to="/login" className="hover:text-content">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-content text-sm mb-3">Contact</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="flex items-center gap-2"><Phone size={14} className="text-brand" /> {AGENCY.phone}</li>
              <li className="flex items-center gap-2"><Mail size={14} className="text-brand" /> <span className="truncate">{AGENCY.email}</span></li>
              <li className="flex items-center gap-2"><MapPin size={14} className="text-brand" /> {AGENCY.location}</li>
              <li className="flex items-center gap-2"><MessageCircle size={14} className="text-brand" /> WhatsApp</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-faint">
          <span>© {new Date().getFullYear()} NorthForge · {AGENCY.website}</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-content">Privacy</Link>
            <Link to="/terms" className="hover:text-content">Terms</Link>
            <Link to="/login" className="hover:text-content">Sign in</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---- Shared marketing blocks ---- */

export function SectionHead({ eyebrow, title, sub, align = 'center' }: { eyebrow: string; title: string; sub?: string; align?: 'center' | 'left' }) {
  return (
    <div className={cx(align === 'center' ? 'text-center max-w-2xl mx-auto' : 'max-w-xl')}>
      <div className="inline-flex items-center gap-2 chip mb-4"><span className="w-1.5 h-1.5 rounded-full bg-brand" /> {eyebrow}</div>
      <h2 className="font-display font-black text-content tracking-tight text-3xl sm:text-[38px] leading-[1.08]">{title}</h2>
      {sub && <p className="text-muted mt-4 text-lg leading-relaxed">{sub}</p>}
    </div>
  );
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return <ScrollReveal className={className}>{children}</ScrollReveal>;
}
