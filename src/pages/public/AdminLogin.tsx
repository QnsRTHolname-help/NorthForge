import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { AGENCY } from '@/data/catalog';
import { waLink, waMessages } from '@/utils/contact';
import { cx } from '@/utils/format';
import { validate, LIMITS, rateLimit, isBot, HONEYPOT_NAME, type FieldRule } from '@/utils/security';

// Unified client-facing portal entry. Admin accounts authenticate through the
// same form (role is resolved from the account) — no public "Admin Login".
export default function AdminLogin() {
  return <AuthScreen />;
}

export function AuthScreen() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'signin' | 'create'>('signin');
  const [f, setF] = useState({ email: '', password: '', name: '', business: '', phone: '', [HONEYPOT_NAME]: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    // Bot honeypot — silently ignore automated submissions.
    if (isBot(f[HONEYPOT_NAME])) { setErr('Something went wrong. Please try again.'); return; }
    // Input validation (mirrored server-side by Supabase policies in production).
    const rules: Record<string, { value: string; rule: FieldRule }> = mode === 'signin'
      ? { email: { value: f.email, rule: { required: true, kind: 'email', max: LIMITS.email } }, password: { value: f.password, rule: { required: true, max: LIMITS.password } } }
      : {
          name: { value: f.name, rule: { required: true, max: LIMITS.name } },
          business: { value: f.business, rule: { required: true, max: LIMITS.business } },
          email: { value: f.email, rule: { required: true, kind: 'email', max: LIMITS.email } },
          phone: { value: f.phone, rule: { kind: 'phone', max: LIMITS.phone } },
          password: { value: f.password, rule: { required: true, max: LIMITS.password } },
        };
    const errors = validate(rules);
    const first = Object.values(errors)[0];
    if (first) { setErr(first); return; }
    // Client-side rate limit (authoritative limiting belongs at the edge).
    const rl = rateLimit(`auth:${mode}`, 6, 60_000);
    if (!rl.ok) { setErr(`Too many attempts. Please wait ${Math.ceil(rl.retryInMs / 1000)}s and try again.`); return; }

    setLoading(true);
    const res = mode === 'signin'
      ? await login(f.email, f.password)
      : await register({ name: f.name, email: f.email, password: f.password, business: f.business, phone: f.phone });
    setLoading(false);
    if (!res.ok) { setErr(res.error || 'Something went wrong. Please try again.'); return; }
    nav(res.role === 'admin' ? '/app' : '/portal', { replace: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-surface">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg,#5b21b6,#7C3AED 55%,#6d28d9)' }}>
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(500px circle at 18% 15%, rgba(255,255,255,0.28), transparent 45%), radial-gradient(500px circle at 85% 85%, rgba(14,165,233,0.30), transparent 45%)' }} />
        <div className="absolute top-24 right-16 w-24 h-24 rounded-4xl bg-white/15 backdrop-blur-sm animate-clay-float" style={{ boxShadow: 'inset 3px 3px 8px rgba(255,255,255,0.3), 10px 12px 30px rgba(0,0,0,0.2)' }} />
        <div className="absolute bottom-40 right-40 w-16 h-16 rounded-3xl bg-white/10 animate-clay-float" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-display font-black text-white text-lg" style={{ boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.3)' }}>NF</div>
            <div className="leading-none"><div className="font-display font-black text-white text-lg">NorthForge</div><div className="text-[10px] font-bold text-white/60 tracking-[0.15em] uppercase mt-0.5">Client Portal</div></div>
          </Link>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-black text-white tracking-tight leading-[1.1]">Your business, beautifully managed.</h1>
          <p className="text-white/75 mt-4 max-w-md leading-relaxed">Track your website, leads, analytics, requests and subscription — all in one simple place.</p>
        </div>
        <div className="relative text-white/60 text-xs font-medium">{AGENCY.location} · {AGENCY.website}</div>
      </div>

      {/* Right form */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2"><span className="w-9 h-9 rounded-2xl flex items-center justify-center font-display font-black text-white" style={{ background: 'linear-gradient(135deg,#a78bfa,#7C3AED)' }}>NF</span><span className="font-display font-black text-content">NorthForge</span></Link>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5 pb-16">
          <div className="w-full max-w-sm animate-fade-up">
            <div className="inline-flex items-center gap-2 chip mb-5 text-brand"><Sparkles size={13} /> {mode === 'signin' ? 'Welcome back' : 'Create your account'}</div>
            <h2 className="font-display text-2xl font-black text-content tracking-tight">{mode === 'signin' ? 'Sign in to your portal' : 'Start with NorthForge'}</h2>
            <p className="text-sm text-muted mt-1.5">{mode === 'signin' ? 'Access your NorthForge dashboard.' : 'Create an account and tell us about your business.'}</p>

            <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
              {/* Honeypot: hidden from users, tempting to bots */}
              <input type="text" name={HONEYPOT_NAME} tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={f[HONEYPOT_NAME]} onChange={(e) => set(HONEYPOT_NAME, e.target.value)}
                className="absolute -left-[9999px] w-px h-px opacity-0" />
              {mode === 'create' && <>
                <div><label className="label">Your name</label><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Your full name" /></div>
                <div><label className="label">Business name</label><input className="input" value={f.business} onChange={(e) => set('business', e.target.value)} placeholder="Your business name" /></div>
                <div><label className="label">Phone / WhatsApp <span className="text-faint font-medium">(optional)</span></label><input className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" /></div>
              </>}
              <div><label className="label">Email address</label><input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="username" placeholder="you@business.in" /></div>
              <div><label className="label">Password</label><input className="input" type="password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></div>
              {err && <p className="text-xs text-rose-500 font-medium">{err}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin-slow" /> : <>{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-muted">
              {mode === 'signin'
                ? <>New to NorthForge? <button onClick={() => { setMode('create'); setErr(''); }} className="text-brand font-bold hover:underline">Create an account</button></>
                : <>Already have an account? <button onClick={() => { setMode('signin'); setErr(''); }} className="text-brand font-bold hover:underline">Sign in</button></>}
            </div>
            <div className="mt-6 pt-5 border-t border-line/60 text-center">
              <a href={waLink(waMessages.general)} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><MessageCircle size={14} /> Prefer WhatsApp? Message us</a>
            </div>
            <p className={cx('mt-5 text-center text-[11px] text-faint')}>Secure sign-in. Your password is never stored in plain text or shown in the app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
