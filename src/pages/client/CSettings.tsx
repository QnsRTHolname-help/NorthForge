import { useState } from 'react';
import { User, Palette, Bell, Shield, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/primitives';
import { Field } from '@/components/forms/Field';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useClientData } from './useClient';
import { clientService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { cx } from '@/utils/format';

const sections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function CSettings() {
  const { client } = useClientData();
  const { toast } = useToast();
  const [sec, setSec] = useState('account');
  const [f, setF] = useState({ contact: client.contact, email: client.email, phone: client.phone });
  const [prefs, setPrefs] = useState({ leads: true, analytics: true, billing: true, support: true });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account" />
      <div className="grid lg:grid-cols-[200px_1fr] gap-6">
        <div className="card p-2 h-fit">
          {sections.map((s) => <button key={s.id} onClick={() => setSec(s.id)} className={cx('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors', sec === s.id ? 'bg-brand/10 text-content font-semibold' : 'text-muted hover:bg-line/40')}><s.icon size={16} /> {s.label}</button>)}
        </div>
        <div>
          {sec === 'account' && (
            <div className="card p-6 max-w-xl">
              <h3 className="font-bold text-content mb-4">Account</h3>
              <div className="space-y-4">
                <Field label="Contact person"><input className="input" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
                <Field label="Email"><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
                <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
              </div>
              <button className="btn bg-brand text-white hover:bg-brand-600 btn-sm mt-4" onClick={async () => { await clientService.update(client.id, f); toast('Account updated'); }}><Save size={14} /> Save</button>
            </div>
          )}
          {sec === 'appearance' && <div className="card p-6 max-w-xl"><h3 className="font-bold text-content mb-2">Appearance</h3><p className="text-sm text-muted mb-4">Choose how your portal looks.</p><ThemeToggle /></div>}
          {sec === 'notifications' && (
            <div className="card p-6 max-w-xl">
              <h3 className="font-bold text-content mb-4">Notifications</h3>
              {Object.entries(prefs).map(([k, v]) => (
                <label key={k} className="flex items-center justify-between py-2.5 border-b border-line/60 last:border-0">
                  <span className="text-sm text-content capitalize">{k}</span>
                  <label className="inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={v} onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })} /><div className="w-10 h-6 bg-line rounded-full peer peer-checked:bg-brand transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" /></label>
                </label>
              ))}
              <button className="btn bg-brand text-white hover:bg-brand-600 btn-sm mt-4" onClick={() => toast('Preferences saved')}><Save size={14} /> Save</button>
            </div>
          )}
          {sec === 'security' && <div className="card p-6 max-w-xl"><h3 className="font-bold text-content mb-2">Security</h3><p className="text-sm text-muted">Your account is secure. Passwords are never stored in plain text. Contact NorthForge if you need to reset your credentials.</p></div>}
        </div>
      </div>
    </div>
  );
}
