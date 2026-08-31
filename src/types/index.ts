// ---------------------------------------------------------------------------
// NorthForge Agency OS — Domain Types
// ---------------------------------------------------------------------------

export type ID = string;

export type Role = 'admin' | 'client';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  clientId?: ID; // set for client-role users
  title?: string;
  password?: string; // dev-only credential (never surfaced in UI)
}

export type PlanId = 'starter' | 'growth' | 'pro' | 'custom';

export interface PlanFeature {
  label: string;
  detail?: string;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // INR, 0 for custom
  cycleDays: number;
  goal: string;
  tagline: string;
  features: PlanFeature[];
  includedServices: ID[]; // service ids
  popular?: boolean;
  active: boolean;
}

export type ServiceCategory =
  | 'Website'
  | 'Infrastructure'
  | 'Marketing'
  | 'CRM'
  | 'Automation'
  | 'AI'
  | 'Analytics'
  | 'Support';

export interface Service {
  id: ID;
  name: string;
  description: string;
  category: ServiceCategory;
  priceNote: string; // "Included in Starter+", "Add-on", etc
  includedIn: PlanId[];
  active: boolean;
}

// ---- CRM / Leads ----------------------------------------------------------

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export type LeadPriority = 'high' | 'medium' | 'low';
export type LeadIntent = 'high' | 'medium' | 'low';

export interface LeadNote {
  id: ID;
  author: string;
  body: string;
  at: string; // ISO
}

export interface FollowUp {
  id: ID;
  leadId: ID;
  channel: 'whatsapp' | 'email' | 'call';
  due: string; // ISO
  note: string;
  done: boolean;
}

export interface Lead {
  id: ID;
  code: string; // Lead #
  business: string;
  contact: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address?: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  assignee: string;
  estValue: number;
  lastContact: string; // ISO
  nextFollowUp?: string; // ISO
  googleRating?: number;
  reviews?: number;
  websiteStatus?: 'None' | 'Needs Verification' | 'Basic' | 'Outdated' | 'Good';
  pitch?: string;
  score: number; // 0-100
  intent: LeadIntent;
  scoreFactors?: { label: string; value: number }[];
  notes: LeadNote[];
  createdAt: string;
}

// ---- Clients --------------------------------------------------------------

export type ClientStatus =
  | 'prospect'
  | 'onboarding'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface Client {
  id: ID;
  business: string;
  contact: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string;
  industry: string;
  website?: string;
  domain?: string;
  social?: { label: string; url: string }[];
  hours?: string;
  plan: PlanId;
  status: ClientStatus;
  services: ID[];
  logoText: string; // initials
  notes?: string;
  createdAt: string;
  onboardingStep?: number; // 0-11, undefined = complete
}

// ---- Projects & Tasks -----------------------------------------------------

export type ProjectStatus =
  | 'planning'
  | 'content'
  | 'design'
  | 'development'
  | 'review'
  | 'revisions'
  | 'launch'
  | 'live'
  | 'maintenance';

export interface Milestone {
  id: ID;
  label: string;
  done: boolean;
  due?: string;
}

export interface Project {
  id: ID;
  name: string;
  clientId: ID;
  plan: PlanId;
  status: ProjectStatus;
  progress: number; // 0-100
  start: string;
  targetLaunch: string;
  lead: string; // assigned person
  milestones: Milestone[];
  stage: WebsiteStage; // production pipeline stage
  notes?: string;
}

export type WebsiteStage =
  | 'discovery'
  | 'content'
  | 'wireframe'
  | 'design'
  | 'development'
  | 'mobile-qa'
  | 'client-review'
  | 'revisions'
  | 'seo'
  | 'deployment'
  | 'live';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export interface Task {
  id: ID;
  title: string;
  projectId?: ID;
  clientId?: ID;
  priority: LeadPriority;
  assignee: string;
  due: string;
  status: TaskStatus;
  tags: string[];
}

// ---- Websites -------------------------------------------------------------

export type WebsiteStatus =
  | 'planning'
  | 'building'
  | 'review'
  | 'published'
  | 'maintenance'
  | 'paused';

export interface Website {
  id: ID;
  clientId: ID;
  domain: string;
  plan: PlanId;
  status: WebsiteStatus;
  ssl: boolean;
  hosting: string;
  lastDeploy: string;
  performance: number; // 0-100 lighthouse-ish
  seo: number;
  leads30d: number;
  whatsappNumber: string;
  seoTitle?: string;
  seoDescription?: string;
}

// ---- Billing --------------------------------------------------------------

export type SubStatus = 'active' | 'paused' | 'past-due' | 'cancelled';

export interface Subscription {
  id: ID;
  clientId: ID;
  plan: PlanId;
  price: number;
  start: string;
  renewal: string;
  status: SubStatus;
}

export type InvoiceStatus = 'paid' | 'due' | 'overdue' | 'draft';

export interface Invoice {
  id: ID;
  number: string;
  clientId: ID;
  amount: number;
  date: string;
  due: string;
  status: InvoiceStatus;
  plan?: PlanId;
}

export type PaymentStatus = 'pending' | 'submitted' | 'paid' | 'partial' | 'failed' | 'refunded';

export interface Payment {
  id: ID;
  clientId: ID;
  invoiceId?: ID;
  subscriptionId?: ID;
  planId?: PlanId;
  amount: number;
  currency: string;
  method: 'UPI' | 'Card' | 'Bank Transfer' | '';
  reference?: string;   // payment reference submitted by client
  date: string;         // payment date (set when paid)
  status: PaymentStatus;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

// ---- Client Requests (shared source of truth: client ↔ admin) -------------
export type RequestType =
  | 'Website Change' | 'Content Update' | 'Bug Fix' | 'New Feature' | 'Domain'
  | 'Hosting' | 'WhatsApp' | 'AI Assistant' | 'Automation' | 'SEO' | 'Booking' | 'General Support';

export type RequestStatus = 'new' | 'in-progress' | 'waiting' | 'completed' | 'cancelled';

export interface ClientRequest {
  id: ID;
  clientId: ID;
  clientName: string;
  type: RequestType;
  title: string;
  description: string;
  priority: LeadPriority;
  status: RequestStatus;
  assignedTo?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Proposals ------------------------------------------------------------

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface ProposalItem {
  label: string;
  amount: number;
}

export interface Proposal {
  id: ID;
  number: string;
  clientName: string;
  clientId?: ID;
  leadId?: ID;
  plan?: PlanId;
  items: ProposalItem[];
  discount: number;
  total: number;
  validUntil: string;
  status: ProposalStatus;
  createdAt: string;
}

// ---- Appointments ---------------------------------------------------------

export type ApptStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id: ID;
  title: string;
  clientId?: ID;
  leadId?: ID;
  who: string;
  service: string;
  date: string; // ISO date
  time: string; // HH:mm
  status: ApptStatus;
  notes?: string;
}

// ---- Workflows ------------------------------------------------------------

export type NodeType = 'trigger' | 'ai' | 'crm' | 'whatsapp' | 'notify' | 'delay' | 'condition';

export interface WorkflowNode {
  id: ID;
  type: NodeType;
  label: string;
  detail: string;
}

export interface Workflow {
  id: ID;
  name: string;
  description: string;
  active: boolean;
  nodes: WorkflowNode[];
  runs: number;
}

// ---- WhatsApp -------------------------------------------------------------

export type TemplateCategory =
  | 'Lead enquiry'
  | 'Appointment confirmation'
  | 'Appointment reminder'
  | 'Follow-up'
  | 'Customer update'
  | 'FAQ response';

export interface WATemplate {
  id: ID;
  name: string;
  category: TemplateCategory;
  body: string;
}

export interface WAMessage {
  id: ID;
  clientId?: ID;
  direction: 'in' | 'out';
  from: string;
  body: string;
  at: string;
}

// ---- AI Assistant ---------------------------------------------------------

export interface AIAssistant {
  clientId: ID;
  name: string;
  greeting: string;
  tone: 'Friendly' | 'Professional' | 'Concise';
  hours: string;
  faqs: { q: string; a: string }[];
  stats: { questions: number; leads: number; resolved: number; escalations: number };
}

// ---- Notifications & Activity ---------------------------------------------

export type NotifType =
  | 'lead'
  | 'follow-up'
  | 'client'
  | 'payment'
  | 'overdue'
  | 'deadline'
  | 'message'
  | 'website'
  | 'automation'
  | 'support';

export interface Notification {
  id: ID;
  type: NotifType;
  title: string;
  body: string;
  at: string;
  read: boolean;
  recipientId?: ID;   // target user/client; undefined = admin/global (agency-wide)
  audience?: 'admin' | 'client';
  resourceType?: string;
  resourceId?: ID;
}

export interface Activity {
  id: ID;
  actor: string;
  action: string;
  resource: string;
  at: string;
}

// ---- Support --------------------------------------------------------------

export type TicketStatus = 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';

export interface Ticket {
  id: ID;
  number: string;
  clientId: ID;
  subject: string;
  priority: LeadPriority;
  status: TicketStatus;
  created: string;
  updated: string;
  assignee: string;
}

// ---- Analytics ------------------------------------------------------------

export interface AnalyticsPoint {
  label: string;
  visitors: number;
  leads: number;
  conversions: number;
}

export interface WebsiteAnalytics {
  clientId: ID;
  visitors: number;
  pageViews: number;
  sessions: number;
  leads: number;
  ctaClicks: number;
  whatsappClicks: number;
  conversion: number;
  trend: AnalyticsPoint[];
  topPages: { page: string; views: number }[];
  sources: { source: string; value: number }[];
  devices: { device: string; value: number }[];
  leadSources: { source: string; value: number }[];
}
