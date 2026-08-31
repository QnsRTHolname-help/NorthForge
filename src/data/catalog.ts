import type { Plan, Service, PlanId } from '@/types';

// ---------------------------------------------------------------------------
// CENTRALIZED SERVICE CATALOG — single source of truth for services.
// Every page (pricing, CRM, onboarding, proposals, config) reads from here.
// ---------------------------------------------------------------------------

export const SERVICES: Service[] = [
  {
    id: 'svc-website',
    name: 'Premium Business Websites',
    description:
      'Professionally designed website presenting your business, services, portfolio, testimonials, contact and clear calls to action.',
    category: 'Website',
    priceNote: 'Included from Starter',
    includedIn: ['starter', 'growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-hosting',
    name: 'Hosting & SSL',
    description: 'Reliable website hosting with HTTPS/SSL secured by default.',
    category: 'Infrastructure',
    priceNote: 'Included from Starter',
    includedIn: ['starter', 'growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-domain',
    name: 'Custom Domains',
    description: 'Use an existing domain or let NorthForge assist with a new custom domain.',
    category: 'Infrastructure',
    priceNote: 'Setup assistance',
    includedIn: ['starter', 'growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-whatsapp',
    name: 'WhatsApp Integration',
    description: 'Website buttons and forms connected directly to WhatsApp.',
    category: 'Marketing',
    priceNote: 'Included from Starter',
    includedIn: ['starter', 'growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-lead-capture',
    name: 'Lead Capture',
    description: 'Website enquiry forms and CTA-based lead capture that feed the CRM.',
    category: 'Marketing',
    priceNote: 'Included from Starter',
    includedIn: ['starter', 'growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-crm',
    name: 'Lead Management CRM',
    description: 'Full pipeline from New Lead through to Converted, with notes and follow-ups.',
    category: 'CRM',
    priceNote: 'Included from Growth',
    includedIn: ['growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-ai-assistant',
    name: 'AI Assistants',
    description: 'AI customer assistant that answers common questions using your business information.',
    category: 'AI',
    priceNote: 'Included from Growth',
    includedIn: ['growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-followups',
    name: 'Automated Follow-ups',
    description: 'Workflow-based lead follow-ups and reminders so no enquiry goes cold.',
    category: 'Automation',
    priceNote: 'Included from Growth',
    includedIn: ['growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-wa-automation',
    name: 'WhatsApp Automation',
    description:
      'Automated WhatsApp workflows for confirmations, reminders, follow-ups and FAQ responses.',
    category: 'Automation',
    priceNote: 'Included from Pro',
    includedIn: ['pro'],
    active: true,
  },
  {
    id: 'svc-analytics',
    name: 'Business Analytics',
    description:
      'Track visitors, leads, conversion rate, popular pages, CTA and WhatsApp clicks, sources and devices.',
    category: 'Analytics',
    priceNote: 'Included from Growth',
    includedIn: ['growth', 'pro'],
    active: true,
  },
  {
    id: 'svc-ai-qual',
    name: 'AI Lead Qualification',
    description: 'AI reads each enquiry, extracts intent, scores the lead and recommends next actions.',
    category: 'AI',
    priceNote: 'Included from Pro',
    includedIn: ['pro'],
    active: true,
  },
  {
    id: 'svc-bookings',
    name: 'Appointment & Booking Systems',
    description: 'Let customers request appointments with confirmations and reminders.',
    category: 'Automation',
    priceNote: 'Included from Pro',
    includedIn: ['pro'],
    active: true,
  },
  {
    id: 'svc-workflows',
    name: 'Custom Business Workflows',
    description: 'Tailored workflows — qualify, collect budget & location, notify owner, schedule.',
    category: 'Automation',
    priceNote: 'Included from Pro',
    includedIn: ['pro'],
    active: true,
  },
  {
    id: 'svc-seo',
    name: 'SEO & Optimization',
    description: 'On-page SEO, performance optimization and search visibility improvements.',
    category: 'Marketing',
    priceNote: 'Add-on / Custom',
    includedIn: ['pro'],
    active: true,
  },
  {
    id: 'svc-maintenance',
    name: 'Maintenance & Support',
    description: 'Ongoing updates, fixes, content changes and technical maintenance.',
    category: 'Support',
    priceNote: 'Included from Starter',
    includedIn: ['starter', 'growth', 'pro'],
    active: true,
  },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// CENTRALIZED PLANS
// ---------------------------------------------------------------------------

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    cycleDays: 28,
    goal: 'Get the business online.',
    tagline: 'Everything you need to have a professional presence.',
    popular: false,
    active: true,
    includedServices: ['svc-website', 'svc-hosting', 'svc-whatsapp', 'svc-lead-capture', 'svc-maintenance'],
    features: [
      { label: 'Premium Business Website', detail: 'Business, services, portfolio, testimonials, contact & CTAs' },
      { label: 'Hosting & SSL', detail: 'Secure HTTPS hosting included' },
      { label: 'WhatsApp Integration', detail: 'Buttons & forms connected to WhatsApp' },
      { label: 'Lead Capture System', detail: 'Enquiry forms & CTA-based capture' },
      { label: 'Website Maintenance', detail: 'Updates, fixes & content changes' },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1999,
    cycleDays: 28,
    goal: 'Get more customers.',
    tagline: 'Everything in Starter, plus tools to convert visitors.',
    popular: true,
    active: true,
    includedServices: [
      'svc-website', 'svc-hosting', 'svc-whatsapp', 'svc-lead-capture', 'svc-maintenance',
      'svc-ai-assistant', 'svc-crm', 'svc-followups', 'svc-analytics',
    ],
    features: [
      { label: 'Everything in Starter' },
      { label: 'AI Customer Assistant', detail: 'Answers common questions from your business info' },
      { label: 'Lead Management CRM', detail: 'New → Contacted → Interested → Follow-up → Converted' },
      { label: 'Automated Follow-ups', detail: 'Workflow-based reminders' },
      { label: 'Advanced Analytics', detail: 'Visitors, leads, conversion, sources & more' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 2999,
    cycleDays: 28,
    goal: 'Automate the business.',
    tagline: 'Everything in Growth, plus full automation.',
    popular: false,
    active: true,
    includedServices: [
      'svc-website', 'svc-hosting', 'svc-whatsapp', 'svc-lead-capture', 'svc-maintenance',
      'svc-ai-assistant', 'svc-crm', 'svc-followups', 'svc-analytics',
      'svc-wa-automation', 'svc-ai-qual', 'svc-bookings', 'svc-workflows', 'svc-seo',
    ],
    features: [
      { label: 'Everything in Growth' },
      { label: 'Advanced AI Automation', detail: 'Analyse → categorise → record → notify → follow-up' },
      { label: 'WhatsApp Business Automation', detail: 'Confirmations, reminders, follow-ups, FAQs' },
      { label: 'Custom Business Workflows', detail: 'Qualify, collect budget & location, schedule' },
      { label: 'Priority Support & Optimization', detail: 'Adjustments, performance & troubleshooting' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Quote',
    price: 0,
    cycleDays: 28,
    goal: 'For larger or specialized projects.',
    tagline: 'Custom combinations built around your business.',
    popular: false,
    active: true,
    includedServices: SERVICES.map((s) => s.id),
    features: [
      { label: 'Websites, CRM, AI & automation' },
      { label: 'WhatsApp, booking systems & integrations' },
      { label: 'Custom workflows & advanced analytics' },
      { label: 'SEO & ongoing maintenance' },
    ],
  },
];

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)!;

export const formatINR = (n: number) =>
  n === 0 ? 'Custom' : '₹' + n.toLocaleString('en-IN');

export const AGENCY = {
  name: 'NorthForge',
  contact: 'North Forge',
  logo: 'NF',
  location: 'Mangalore, Karnataka, India',
  phone: '+91 9187006703',
  whatsapp: '+91 9187006703',
  email: 'north.forge.studio.in@gmail.com',
  website: 'northforgestudio.vercel.app',
  hours: {
    weekday: 'Mon–Fri · 4:00 PM – 9:00 PM',
    saturday: 'Sat · 2:00 PM – 8:00 PM',
    sunday: 'Sun · 2:00 PM – 8:00 PM',
  },
  tagline: 'Premium websites that actually bring leads.',
};
