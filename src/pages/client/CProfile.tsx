import { useState } from 'react';
import { Save } from 'lucide-react';
import { PageHeader, Avatar, Badge } from '@/components/ui/primitives';
import { Field } from '@/components/forms/Field';
import { useClientData } from './useClient';
import { clientService } from '@/services';
import { useToast } from '@/hooks/useToast';
import { planById, serviceById } from '@/data/catalog';
import { Check } from 'lucide-react';

export default function CProfile() {
  const { client } = useClientData();
  const { toast } = useToast();
  const [f, setF] = useState({ business: client.business, contact: client.contact, email: client.email, phone: client.phone, whatsapp: client.whatsapp, hours: client.hours || '', website: client.website || '' });
  const save = async () => { await clientService.update(client.id, f); toast('Business profile updated'); };

  return (
    <div>
      <PageHeader title="Business Profile" subtitle="Your business details on file with NorthForge" />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center gap-4 mb-5"><Avatar text={client.logoText} size={52} tone="violet" /><div><h3 className="font-bold text-content text-lg">{client.business}</h3><p className="text-sm text-muted">{client.industry} · {client.location}</p></div></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Business name"><input className="input" value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} /></Field>
            <Field label="Contact person"><input className="input" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
            <Field label="Email"><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="WhatsApp"><input className="input" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></Field>
            <Field label="Website"><input className="input" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Business hours"><input className="input" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field></div>
          </div>
          <button className="btn bg-brand text-white hover:bg-brand-600 btn-sm mt-4" onClick={save}><Save size={14} /> Save changes</button>
        </div>
        <div className="card p-6 h-fit">
          <h3 className="font-bold text-content mb-1">Your plan</h3>
          <Badge tone={client.plan === 'pro' ? 'violet' : client.plan === 'growth' ? 'brand' : 'neutral'}>{planById(client.plan).name}</Badge>
          <h4 className="text-xs font-bold uppercase tracking-wider text-faint mt-5 mb-2">Included services</h4>
          <div className="space-y-2">
            {client.services.slice(0, 8).map((sid) => { const s = serviceById(sid); return s ? <div key={sid} className="flex items-center gap-2 text-sm"><Check size={14} className="text-emerald-500 shrink-0" /><span className="text-content">{s.name}</span></div> : null; })}
          </div>
        </div>
      </div>
    </div>
  );
}
