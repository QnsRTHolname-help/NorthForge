import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { PublicShell } from '@/components/marketing/PublicShell';
import { AGENCY } from '@/data/catalog';
import { mailto } from '@/utils/contact';

const SECTIONS = [
  { title: 'Information we collect', body: 'When you contact NorthForge or create an account, we collect the information you provide — for example your name, business name, email address, phone/WhatsApp number, business type and the details you share about your current tools and processes. We also collect operational records generated inside the NorthForge platform (leads, projects, website status, analytics where available, invoices, support requests and activity) so we can provide and operate the service.' },
  { title: 'How we use your information', body: 'We use your information to respond to enquiries, set up and maintain your website and digital system, send service-related notifications, generate invoices, provide support, improve our services and comply with legal obligations. We do not sell your personal information.' },
  { title: 'Data ownership and access', body: 'Your business data belongs to you. The NorthForge client portal exposes data associated with your own business only. Admin users can access operational information needed to deliver your service. Access to other clients\u2019 business data is not exposed.' },
  { title: 'Security', body: 'NorthForge uses authentication, authorization and access controls designed to keep your data private. Production deployments are intended to run on Supabase with Row Level Security and server-side checks. You should still choose a strong password and keep your login credentials confidential.' },
  { title: 'Third-party services', body: 'NorthForge may connect to third-party services such as hosting providers, Web hosting/CDN providers, WhatsApp/API services, AI providers and payment providers. These services have their own terms and privacy policies; we only provide them on your behalf as part of the system.' },
  { title: 'Cookies and local storage', body: 'The NordhForge app uses browser local storage to persist your theme preference and authentication state. Where analytics are enabled, we may collect standard traffic data. We do not use invasive cross-site trackers.' },
  { title: 'Retention and deletion', body: 'We keep records only as long as needed to provide the service, meet accounting/legal requirements and operate support. If you request deletion, we will remove your personal information unless we are required to keep certain records for legal or billing purposes.' },
  { title: 'Contact us', body: `For privacy questions, email ${AGENCY.email} or use the contact page.` },
];

export default function PrivacyPage() {
  return (
    <PublicShell
      seoTitle="Privacy Policy — NorthForge"
      seoDescription="How NorthForge collects, uses and protects your business information."
    >
      <div className="relative z-10">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-8 sm:pt-20 sm:pb-10">
          <div className="inline-flex items-center gap-2 chip mb-5"><ShieldCheck size={13} className="text-brand" /> Privacy</div>
          <h1 className="font-display font-black text-content leading-[1.05] tracking-tight text-[40px] sm:text-5xl">Privacy Policy</h1>
          <p className="text-sm text-muted mt-3">Last updated: {new Date().getFullYear()} · {AGENCY.name} · {AGENCY.location}</p>
        </section>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="space-y-5">
            {SECTIONS.map((s) => (
              <div key={s.title} className="card p-6">
                <h2 className="font-display font-extrabold text-content text-lg">{s.title}</h2>
                <p className="text-sm text-muted mt-2 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/contact" className="btn-primary">Questions? Contact us <ArrowRight size={16} /></Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
