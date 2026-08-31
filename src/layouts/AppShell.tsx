import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu, X, Search, ChevronDown, LogOut, PanelLeftClose, PanelLeft, ChevronRight, User as UserIcon,
} from 'lucide-react';
import type { NavGroup } from '@/routes/nav';
import { Logo, Avatar } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationsBell } from '@/components/NotificationsBell';
import { GlobalSearch } from '@/components/GlobalSearch';
import { QuickCreate } from '@/components/forms/QuickCreate';
import { useAuth } from '@/hooks/useAuth';
import { cx } from '@/utils/format';
import { AGENCY } from '@/data/catalog';
import { ClayBlobs } from '@/components/ui/ClayBlobs';
import { ChatWidget } from '@/components/ChatWidget';
import { db } from '@/services/db';
import { defaultAssistant } from '@/data/assistant';

export function AppShell({ nav, variant, children }: { nav: NavGroup[]; variant: 'admin' | 'client'; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const loc = useLocation();
  const { user } = useAuth();

  // Client portal: the logged-in client's assistant. Admin: first configured
  // assistant. Falls back to the default NorthForge assistant so the chat
  // bubble is always available.
  const chatAssistant = variant === 'client'
    ? db.readSync('assistants').find((a) => a.clientId === user?.clientId) || defaultAssistant
    : db.readSync('assistants')[0] || defaultAssistant;

  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const flat = nav.flatMap((g) => g.items);
  const current = [...flat].sort((a, b) => b.to.length - a.to.length).find((i) => loc.pathname === i.to || loc.pathname.startsWith(i.to + '/'));

  return (
    <div className="h-screen flex overflow-hidden bg-surface relative">
      <ClayBlobs variant="app" />
      {/* Desktop sidebar */}
      <aside className={cx('hidden lg:flex flex-col bg-surface/60 backdrop-blur-sm transition-all duration-300 shrink-0 relative z-10',
        collapsed ? 'w-[76px]' : 'w-64')}>
        <SidebarContent nav={nav} variant={variant} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Mobile off-canvas */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-clay-ink/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-panel shadow-clay-xl animate-slide-in-left flex flex-col rounded-r-3xl">
            <button className="absolute top-4 right-3 btn-ghost !p-1.5 z-10" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
            <SidebarContent nav={nav} variant={variant} collapsed={false} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar */}
        <header className="h-16 shrink-0 bg-surface/70 backdrop-blur-xl sticky top-0 z-40 flex items-center gap-3 px-3 sm:px-5">
          <button className="lg:hidden btn-ghost !p-2" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>

          <div className="hidden md:flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-faint">{variant === 'admin' ? 'NorthForge' : 'My Business'}</span>
            <ChevronRight size={14} className="text-faint shrink-0" />
            <span className="font-semibold text-content truncate">{current?.label || 'Dashboard'}</span>
          </div>

          <button onClick={() => setSearchOpen(true)}
            className="ml-auto md:ml-4 flex items-center gap-2 text-sm text-faint bg-sunken rounded-xl px-3.5 py-2.5 shadow-clay-inset hover:text-muted transition-all md:min-w-[220px]">
            <Search size={16} /> <span className="hidden md:inline">Search…</span>
            <span className="hidden md:flex ml-auto kbd">⌘K</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto md:ml-0">
            {variant === 'admin' && <QuickCreate />}
            <div className="hidden sm:block"><ThemeToggle /></div>
            <NotificationsBell />
            <UserMenu variant={variant} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div key={loc.pathname} className="page-enter max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        {variant === 'client' && <ClientBottomNav nav={nav} />}
      </div>

      {/* Floating AI assistant chat (bottom-right) */}
      <ChatWidget assistant={chatAssistant} />

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function SidebarContent({ nav, variant, collapsed, onToggle }: { nav: NavGroup[]; variant: 'admin' | 'client'; collapsed: boolean; onToggle?: () => void }) {
  return (
    <>
      <div className={cx('h-16 flex items-center shrink-0', collapsed ? 'justify-center px-2' : 'px-4 justify-between')}>
        <Link to={variant === 'admin' ? '/app' : '/portal'}>
          <Logo size={34} showWord={!collapsed} />
        </Link>
        {onToggle && !collapsed && (
          <button className="btn-ghost !p-1.5 hidden lg:flex" onClick={onToggle} aria-label="Collapse sidebar"><PanelLeftClose size={16} /></button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {collapsed && onToggle && (
          <button className="nav-link w-full justify-center mb-2" onClick={onToggle} aria-label="Expand sidebar"><PanelLeft size={18} /></button>
        )}
        {nav.map((group) => (
          <div key={group.title}>
            {!collapsed && <div className="section-title">{group.title}</div>}
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/app' || item.to === '/portal'}
                className={({ isActive }) => cx('nav-link', isActive && 'active', collapsed && 'justify-center px-2')}
                title={collapsed ? item.label : undefined}>
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {!collapsed && (
        <div className="p-3 shrink-0">
          <div className="rounded-2xl bg-panel card-sm p-3.5">
            <p className="text-xs font-display font-extrabold text-content">{variant === 'admin' ? 'NorthForge Agency OS' : 'Powered by NorthForge'}</p>
            <p className="text-[11px] text-muted mt-0.5">{AGENCY.hours.weekday}</p>
          </div>
        </div>
      )}
    </>
  );
}

function UserMenu({ variant }: { variant: 'admin' | 'client' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!user) return null;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl hover:bg-line/50 p-1 pr-2 transition-colors" aria-label="Account menu">
        <Avatar text={user.avatar || user.name} size={30} tone={variant === 'admin' ? 'ink' : 'violet'} />
        <ChevronDown size={14} className="text-faint hidden sm:block" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-elevated rounded-3xl shadow-clay-xl animate-scale-in origin-top-right z-50 p-1.5">
          <div className="px-3 py-2.5 border-b border-line mb-1">
            <p className="text-sm font-semibold text-content truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <Link to={variant === 'admin' ? '/app/settings' : '/portal/settings'} onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-content hover:bg-line/50 transition-colors">
            <UserIcon size={15} className="text-muted" /> Settings
          </Link>
          <div className="sm:hidden px-3 py-2"><ThemeToggle /></div>
          <button onClick={() => { logout(); nav('/'); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-rose-500 hover:bg-rose-500/10 transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function ClientBottomNav({ nav }: { nav: NavGroup[] }) {
  const items = nav.flatMap((g) => g.items).slice(0, 5);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel/95 backdrop-blur-xl border-t border-line flex items-stretch pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.to === '/portal'}
          className={({ isActive }) => cx('flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
            isActive ? 'text-brand' : 'text-faint')}>
          <item.icon size={18} /> <span className="truncate max-w-full px-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
