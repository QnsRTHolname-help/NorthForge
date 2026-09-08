import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { PublicShell } from '@/components/marketing/PublicShell';
import { AGENCY } from '@/data/catalog';

const SECTIONS = [
  { title: 'Agreement', body: 'By using the NorthForge website, client portal or services (collectively, "NorthForge"), you agree to these terms. If you enter a service agreement with NorthForge, your specific proposal/agreement and any invoicing terms govern that engagement alongside these general terms.' },
  { title: 'Services', body: 'NorthForge provides premium websites, lead capture systems, CRM, AI assistants, WhatsApp integrations, automation, analytics, hosting/SSL management and related support. Specific deliverables, plans, pricing and timelines are described in the plan you select or a custom proposal.' },
  { title: 'Subscriptions and recurring billing', body: 'Plans are recurring subscriptions billed on a 28-day cycle (or custom cycle where agreed). Payment is due before each cycle. You may upgrade, downgrade or cancel as described in the plan terms. Recurring charges are always communicated clearly; third-party costs such as domains, AI usage or external APIs are separate.' },
  { title: 'Your responsibilities', body: 'You are responsible for providing accurate business information and content for your website and system, keeping your login credentials secure, and ensuring you have the rights to content you provide. We will not fabricate or publish claims, testimonials or results without your approval.' },
  { title: 'Website availability and maintenance', body: 'We maintain the website and infrastructure as part of your plan, but no system can guarantee 100% uptime or zero maintenance. We will communicate planned outages and resolve issues in priority order.' },
  { title: 'No false guarantees', body: 'NorthForge does not guarantee specific revenue, lead counts, conversion rates or rankings. We build systems designed to give your business the best opportunity to attract, capture and convert enquiries, and we report on real available data only.' },
  { title: 'AI and automation', body: 'AI and automation features perform defined actions based on your data and configuration. You are responsible for reviewing and approving workflows, messaging and actions. Write or destructive actions require explicit confirmation.' },
  { title: 'Intellectual property', body: 'We retain ownership of NorthForge platform code, design system and reusable components. Upon full payment, you typically own or license the custom content and site configuration we deliver, subject to the terms of your proposal.' },
  { title: 'Limitation of liability', body: 'To the maximum extent permitted by law, NorthForge is not liable for indirect, incidental or consequential damages, lost profits or business interruption arising from use of the service, and our total liability is limited to the amounts you paid in the three months before the claim.' },
  { title: 'Changes to these terms', body: 'We may update these terms from time to time. Material changes will be communicated through the platform or by email. Continued use after a change means you accept the updated terms.' },
  { title: 'Governing law', body: `These terms are governed by the laws of India. The courts at ${AGENCY.location.split(',')[0]}, Karnataka shall have jurisdiction, unless otherwise agreed in writing.` },
];

export default function TermsPage() {
  return (
    <PublicShell
      seoTitle="Terms of Service — NorthForge"
      seoDescription="Terms of service for using NorthForge websites, client portal and digital services."
    >
      <div className="relative z-10">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-8 sm:pt-20 sm:pb-10">
          <div className="inline-flex items-center gap-2 chip mb-5"><FileCheck2 size={13} className="text-brand" /> Terms</div>
          <h1 className="font-display font-black text-content leading-[1.05] tracking-tight text-[40px] sm:text-5xl">Terms of Service</h1>
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
            <Link to="/contact" className="btn-primary">Questions about your terms? <ArrowRight size={16} /></Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
