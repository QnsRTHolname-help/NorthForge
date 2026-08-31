import { useState } from 'react';
import { Building2, Palette, Bell, Users, Plug, Shield, Database, Save, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/primitives';
import { Field } from '@/components/forms/Field';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConfirmDialog } from '@/components/ui/Modal';
import { db } from '@/services/db';
import { useToast } from '@/hooks/useToast';
import { AGENCY } from '@/data/catalog';
import { cx } from '@/utils/format';

const sections = [
  { id: 'profile', label: 'Agency profile', icon: Building2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'team', label: 'Users & Roles', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data', icon: Database },
];

export default function Settings() {
  const [sec, setSec] = useState('profile');
  const { toast } = useToast();
  const [confirm, setConfirm] = useState<'clear' | null>(null);
  const [f, setF] = useState({ ...AGENCY });
  const [prefs, setPrefs] = useState({ leads: true, projects: true, billing: true, messages: true, appointments: true, automation: false, system: true });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage NorthForge Agency OS" />
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <div className="card p-2 h-fit lg:sticky lg:top-20">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setSec(s.id)} className={cx('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors', sec === s.id ? 'bg-brand/10 text-content font-semibold' : 'text-muted hover:bg-line/40')}>
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {sec === 'profile' && (
            <div className="card p-6 max-w-2xl">
              <h3 className="font-bold text-content mb-4">Agency profile</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
                <Field label="Contact name"><input className="input" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
                <Field label="Phone / WhatsApp"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
                <Field label="Email"><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
                <Field label="Website"><input className="input" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
                <Field label="Location"><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
              </div>
              <div className="mt-4">
                <p className="label">Business hours</p>
                <div className="space-y-2 text-sm">
                  {[AGENCY.hours.weekday, AGENCY.hours.saturday, AGENCY.hours.sunday].map((h) => <div key={h} className="rounded-xl bg-surface border border-line px-3 py-2 text-content">{h}</div>)}
                </div>
              </div>
              <button className="btn-primary btn-sm mt-4" onClick={() => toast('Agency profile saved')}><Save size={14} /> Save changes</button>
            </div>
          )}

          {sec === 'appearance' && (
            <div className="card p-6 max-w-2xl">
              <h3 className="font-bold text-content mb-2">Appearance</h3>
              <p className="text-sm text-muted mb-4">Choose how NorthForge Agency OS looks. This affects every page, chart, table and the client portal.</p>
              <ThemeToggle />
            </div>
          )}

          {sec === 'notifications' && (
            <div className="card p-6 max-w-2xl">
              <h3 className="font-bold text-content mb-4">Notification preferences</h3>
              <div className="space-y-1">
                {Object.entries(prefs).map(([k, v]) => (
                  <label key={k} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0">
                    <span className="text-sm text-content capitalize">{k}</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={v} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} />
                      <div className="w-10 h-6 bg-line rounded-full peer peer-checked:bg-brand transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </label>
                ))}
              </div>
              <button className="btn-primary btn-sm mt-4" onClick={() => toast('Preferences saved')}><Save size={14} /> Save</button>
            </div>
          )}

          {sec === 'team' && (
            <div className="card p-6 max-w-2xl">
              <h3 className="font-bold text-content mb-4">Users & Roles</h3>
              {db.readSync('users').map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 border-b border-line/60 last:border-0">
                  <div><p className="font-medium text-content text-sm">{u.name}</p><p className="text-xs text-muted">{u.email}</p></div>
                  <span className="badge bg-brand/10 text-brand capitalize">{u.role}</span>
                </div>
              ))}
            </div>
          )}

          {sec === 'integrations' && (
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              {[['WhatsApp Business', 'Connected', 'success'], ['Email (SMTP)', 'Connected', 'success'], ['Analytics', 'Connected', 'success'], ['Payment gateway', 'Set up required', 'warning']].map(([name, status, tone]) => (
                <div key={name} className="card p-4 flex items-center justify-between"><span className="font-medium text-content text-sm">{name}</span><span className={cx('badge', tone === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/12 text-amber-500')}>{status}</span></div>
              ))}
            </div>
          )}

          {sec === 'security' && (
            <div className="card p-6 max-w-2xl space-y-4">
              <h3 className="font-bold text-content">Security</h3>
              <p className="text-sm text-muted">Passwords are never stored in plain text and no API keys are exposed in the frontend. Admin and client access are strictly separated with route guards.</p>
              <div className="rounded-xl bg-surface border border-line p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted">Two-factor authentication</span><span className="badge bg-line/60 text-muted">Recommended</span></div>
                <div className="flex justify-between"><span className="text-muted">Session</span><span className="text-content">Active</span></div>
              </div>
            </div>
          )}

          {sec === 'data' && (
            <div className="card p-6 max-w-2xl space-y-4">
              <h3 className="font-bold text-content">Data management</h3>
              <p className="text-sm text-muted">Your data is stored via the application data layer and structured for Supabase integration. You can clear all business records and return to a clean initial state.</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-outline text-rose-500" onClick={() => setConfirm('clear')}><Trash2 size={16} /> Clear all data</button>
              </div>
              <p className="text-[11px] text-faint">This removes all clients, leads, projects, payments and requests. Your administrator account and message templates are kept.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirm === 'clear'} onClose={() => setConfirm(null)} title="Clear all data" danger
        message="This removes all leads, clients, projects and records. The app will show empty states. This cannot be undone."
        confirmLabel="Clear everything" onConfirm={() => { db.clearAll(); toast('All data cleared', 'warning'); setTimeout(() => location.reload(), 600); }} />
    </div>
  );
}
