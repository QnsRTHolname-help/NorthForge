import type {
  Client, Lead, Project, Task, Website, Subscription, Invoice, Payment,
  Proposal, Appointment, Workflow, Notification, Activity, Ticket,
  WATemplate, WAMessage, AIAssistant, WebsiteAnalytics, User, ClientRequest,
} from '@/types';

// ===========================================================================
// PRODUCTION INITIAL STATE
// ---------------------------------------------------------------------------
// A fresh NorthForge deployment starts EMPTY. No demo clients, leads, projects,
// payments, requests, notifications, analytics or workflows. Real records are
// created only by actual application actions (client registration, admin
// creation, lead capture, etc.).
//
// The only pre-provisioned rows are:
//   • the NorthForge administrator account (real business identity), and
//   • a neutral, reusable WhatsApp template library (a product feature with no
//     fabricated business data — just message scaffolding with placeholders).
//
// Services, pricing and the agency profile live in `catalog.ts` (real business
// configuration), not here.
// ===========================================================================

// The bootstrap admin. In a Supabase-backed deployment this account is created
// through Supabase Auth and its password is never stored in code; this seed
// exists only so the local adapter has an administrator to sign in with.
// The credential can be overridden via VITE_ADMIN_BOOTSTRAP_PASSWORD.
const ADMIN_BOOTSTRAP_PASSWORD =
  (import.meta as any)?.env?.VITE_ADMIN_BOOTSTRAP_PASSWORD || 'northforge';

export const seedUsers: User[] = [
  {
    id: 'u-admin',
    name: 'North Forge',
    email: 'north.forge.studio.in@gmail.com',
    role: 'admin',
    title: 'Founder',
    avatar: 'NF',
    password: ADMIN_BOOTSTRAP_PASSWORD,
  },
];

// Business collections — empty in production.
export const seedClients: Client[] = [];
export const seedLeads: Lead[] = [];
export const seedProjects: Project[] = [];
export const seedTasks: Task[] = [];
export const seedWebsites: Website[] = [];
export const seedSubscriptions: Subscription[] = [];
export const seedInvoices: Invoice[] = [];
export const seedPayments: Payment[] = [];
export const seedProposals: Proposal[] = [];
export const seedAppointments: Appointment[] = [];
export const seedWorkflows: Workflow[] = [];
export const seedMessages: WAMessage[] = [];
export const seedAssistants: AIAssistant[] = [];
export const seedNotifications: Notification[] = [];
export const seedActivities: Activity[] = [];
export const seedTickets: Ticket[] = [];
export const seedAnalytics: WebsiteAnalytics[] = [];
export const seedRequests: ClientRequest[] = [];

// Reusable WhatsApp message templates (product feature — not business data).
// Placeholders like {name} are filled at send time from real records.
export const seedTemplates: WATemplate[] = [
  { id: 'wt-1', name: 'Enquiry received', category: 'Lead enquiry', body: 'Hi {name}, thanks for reaching out to {business}! We received your enquiry and will get back to you shortly. — Team NorthForge' },
  { id: 'wt-2', name: 'Appointment confirmed', category: 'Appointment confirmation', body: 'Hi {name}, your appointment on {date} at {time} is confirmed. See you soon!' },
  { id: 'wt-3', name: 'Appointment reminder', category: 'Appointment reminder', body: 'Reminder: your appointment is tomorrow at {time}. Reply RESCHEDULE if needed.' },
  { id: 'wt-4', name: 'Gentle follow-up', category: 'Follow-up', body: 'Hi {name}, just following up on your enquiry. Would you like to know more about our services?' },
  { id: 'wt-5', name: 'Order update', category: 'Customer update', body: 'Hi {name}, an update on your order: {status}. Thank you for choosing {business}.' },
  { id: 'wt-6', name: 'Hours & location', category: 'FAQ response', body: 'We are open {hours}. Find us at {location}. Reply to book!' },
];
