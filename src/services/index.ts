// ---------------------------------------------------------------------------
// Service layer — the API boundary. UI code calls these, never localStorage.
// Each function is async so swapping to REST/GraphQL is a one-line change.
// ---------------------------------------------------------------------------

import { db, uid } from './db';
import type {
  Lead, Client, Project, Task, Website, Subscription, Invoice, Payment,
  Proposal, Appointment, Workflow, Notification, Activity, Ticket, LeadStatus,
  ClientRequest, RequestStatus, PaymentStatus, PlanId, SubStatus, AIAssistant,
} from '@/types';
import { planById } from '@/data/catalog';
import { sanitizeText, LIMITS, isEmail } from '@/utils/security';

function logActivity(actor: string, action: string, resource: string) {
  const list = db.readSync('activities');
  list.unshift({ id: uid('ac'), actor, action, resource, at: new Date().toISOString() });
  db.writeSync('activities', list.slice(0, 200));
}

function notify(n: Omit<Notification, 'id' | 'at' | 'read'>) {
  const list = db.readSync('notifications');
  list.unshift({ audience: 'admin', ...n, id: uid('no'), at: new Date().toISOString(), read: false });
  db.writeSync('notifications', list.slice(0, 200));
}
function notifyClient(clientId: string, n: Omit<Notification, 'id' | 'at' | 'read' | 'audience' | 'recipientId'>) {
  const list = db.readSync('notifications');
  list.unshift({ ...n, audience: 'client', recipientId: clientId, id: uid('no'), at: new Date().toISOString(), read: false });
  db.writeSync('notifications', list.slice(0, 200));
}

// ---- LEADS ----------------------------------------------------------------
export const leadService = {
  list: () => db.read('leads'),
  async create(input: Partial<Lead>): Promise<Lead> {
    const leads = db.readSync('leads');
    const n = leads.length + 1037;
    const lead: Lead = {
      id: uid('l'), code: `NF-${n}`, business: input.business || 'New Lead',
      contact: input.contact || '', category: input.category || 'General',
      phone: input.phone || '', whatsapp: input.whatsapp || input.phone || '',
      email: input.email || '', address: input.address, source: input.source || 'Manual',
      status: input.status || 'new', priority: input.priority || 'medium',
      assignee: input.assignee || 'North Forge', estValue: input.estValue ?? 999,
      lastContact: new Date().toISOString(), nextFollowUp: input.nextFollowUp,
      googleRating: input.googleRating, reviews: input.reviews,
      websiteStatus: input.websiteStatus || 'Needs Verification', pitch: input.pitch,
      score: input.score ?? scoreLead(input), intent: input.intent || 'medium',
      scoreFactors: input.scoreFactors, notes: [], createdAt: new Date().toISOString(),
    };
    db.writeSync('leads', [lead, ...leads]);
    logActivity('North Forge', 'created lead', lead.business);
    notify({ type: 'lead', title: 'New lead created', body: `${lead.business} added to the pipeline.` });
    return lead;
  },
  async update(id: string, patch: Partial<Lead>): Promise<void> {
    const leads = db.readSync('leads').map((l) => (l.id === id ? { ...l, ...patch } : l));
    db.writeSync('leads', leads);
  },
  async move(id: string, status: LeadStatus): Promise<void> {
    const leads = db.readSync('leads');
    const lead = leads.find((l) => l.id === id);
    db.writeSync('leads', leads.map((l) => (l.id === id ? { ...l, status } : l)));
    if (lead) logActivity('North Forge', `moved lead to ${status}`, lead.business);
  },
  async remove(id: string): Promise<void> {
    db.writeSync('leads', db.readSync('leads').filter((l) => l.id !== id));
  },
  async addNote(id: string, body: string): Promise<void> {
    const leads = db.readSync('leads').map((l) =>
      l.id === id ? { ...l, notes: [{ id: uid('n'), author: 'North Forge', body, at: new Date().toISOString() }, ...l.notes] } : l);
    db.writeSync('leads', leads);
  },
};

export function scoreLead(input: Partial<Lead>): number {
  let s = 40;
  if ((input.estValue ?? 0) >= 2999) s += 18; else if ((input.estValue ?? 0) >= 1999) s += 12; else s += 6;
  if (input.priority === 'high') s += 14; else if (input.priority === 'medium') s += 7;
  if (input.websiteStatus === 'None') s += 16; else if (input.websiteStatus === 'Outdated') s += 10;
  if (input.source === 'Referral' || input.source === 'Website') s += 8;
  return Math.min(100, s);
}

// ---- CLIENTS --------------------------------------------------------------
export const clientService = {
  list: () => db.read('clients'),
  get: (id: string) => db.readSync('clients').find((c) => c.id === id),
  async create(input: Partial<Client>): Promise<Client> {
    const clients = db.readSync('clients');
    const client: Client = {
      id: uid('c'), business: input.business || 'New Client', contact: input.contact || '',
      email: input.email || '', phone: input.phone || '', whatsapp: input.whatsapp || input.phone || '',
      location: input.location || 'Mangalore, Karnataka', industry: input.industry || 'General',
      website: input.website, domain: input.domain, hours: input.hours,
      plan: input.plan || 'starter', status: input.status || 'onboarding',
      services: input.services || [], logoText: (input.business || 'NC').slice(0, 2).toUpperCase(),
      notes: input.notes, createdAt: new Date().toISOString(),
      onboardingStep: input.onboardingStep ?? (input.status === 'active' ? undefined : 0),
    };
    db.writeSync('clients', [client, ...clients]);
    logActivity('North Forge', 'created client', client.business);
    notify({ type: 'client', title: 'New client added', body: `${client.business} is now onboarding.` });
    return client;
  },
  async update(id: string, patch: Partial<Client>): Promise<void> {
    db.writeSync('clients', db.readSync('clients').map((c) => (c.id === id ? { ...c, ...patch } : c)));
  },
  async remove(id: string): Promise<void> {
    db.writeSync('clients', db.readSync('clients').filter((c) => c.id !== id));
  },
  async convertLead(leadId: string): Promise<Client> {
    const lead = db.readSync('leads').find((l) => l.id === leadId);
    const client = await this.create({
      business: lead?.business, contact: lead?.contact, email: lead?.email,
      phone: lead?.phone, whatsapp: lead?.whatsapp, industry: lead?.category,
      status: 'onboarding', plan: 'growth',
    });
    if (lead) await leadService.move(leadId, 'won');
    return client;
  },
};

// ---- PROJECTS -------------------------------------------------------------
export const projectService = {
  list: () => db.read('projects'),
  async create(input: Partial<Project>): Promise<Project> {
    const p: Project = {
      id: uid('p'), name: input.name || 'New Project', clientId: input.clientId || '',
      plan: input.plan || 'starter', status: input.status || 'planning', progress: input.progress ?? 0,
      start: input.start || new Date().toISOString().slice(0, 10),
      targetLaunch: input.targetLaunch || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      lead: input.lead || 'North Forge', stage: input.stage || 'discovery',
      milestones: input.milestones || [], notes: input.notes,
    };
    db.writeSync('projects', [p, ...db.readSync('projects')]);
    logActivity('North Forge', 'created project', p.name);
    return p;
  },
  async update(id: string, patch: Partial<Project>): Promise<void> {
    db.writeSync('projects', db.readSync('projects').map((p) => (p.id === id ? { ...p, ...patch } : p)));
  },
  async remove(id: string) { db.writeSync('projects', db.readSync('projects').filter((p) => p.id !== id)); },
};

// ---- TASKS ----------------------------------------------------------------
export const taskService = {
  list: () => db.read('tasks'),
  async create(input: Partial<Task>): Promise<Task> {
    const t: Task = {
      id: uid('t'), title: input.title || 'New Task', projectId: input.projectId, clientId: input.clientId,
      priority: input.priority || 'medium', assignee: input.assignee || 'North Forge',
      due: input.due || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      status: input.status || 'todo', tags: input.tags || [],
    };
    db.writeSync('tasks', [t, ...db.readSync('tasks')]);
    return t;
  },
  async update(id: string, patch: Partial<Task>) {
    db.writeSync('tasks', db.readSync('tasks').map((t) => (t.id === id ? { ...t, ...patch } : t)));
  },
  async remove(id: string) { db.writeSync('tasks', db.readSync('tasks').filter((t) => t.id !== id)); },
};

// ---- WEBSITES -------------------------------------------------------------
export const websiteService = {
  list: () => db.read('websites'),
  async update(id: string, patch: Partial<Website>) {
    db.writeSync('websites', db.readSync('websites').map((w) => (w.id === id ? { ...w, ...patch } : w)));
  },
};

// ---- BILLING --------------------------------------------------------------
const clientBusiness = (clientId?: string) =>
  db.readSync('clients').find((c) => c.id === clientId)?.business || 'a client';

// ---- PAYMENTS (admin-verified source of truth) ----------------------------
// Architected so a real gateway (createPayment/verifyPayment/handleWebhook)
// can replace admin verification later. Integration mode: ADMIN VERIFIED.
export const paymentService = {
  INTEGRATION_MODE: 'admin-verified' as const,
  list: () => db.read('payments'),
  async create(input: Partial<Payment>): Promise<Payment> {
    const plan = input.planId ? planById(input.planId) : undefined;
    const p: Payment = {
      id: uid('pay'), clientId: input.clientId || '', invoiceId: input.invoiceId,
      subscriptionId: input.subscriptionId, planId: input.planId,
      amount: input.amount ?? plan?.price ?? 0, currency: input.currency || 'INR',
      method: input.method || '', reference: input.reference,
      date: input.status === 'paid' ? new Date().toISOString().slice(0, 10) : '',
      status: input.status || 'pending', notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    db.writeSync('payments', [p, ...db.readSync('payments')]);
    notify({ type: 'payment', title: 'Payment record created', body: `${clientBusiness(p.clientId)} · ₹${p.amount.toLocaleString('en-IN')}`, resourceType: 'payment', resourceId: p.id });
    return p;
  },
  // Client submits a payment reference → status SUBMITTED, admin notified.
  async submitReference(id: string, reference: string, method: Payment['method']): Promise<void> {
    db.writeSync('payments', db.readSync('payments').map((p) => (p.id === id ? { ...p, reference, method, status: 'submitted' } : p)));
    const p = db.readSync('payments').find((x) => x.id === id);
    if (p) notify({ type: 'payment', title: 'Payment reference submitted', body: `${clientBusiness(p.clientId)} submitted reference ${reference}.`, resourceType: 'payment', resourceId: p.id });
  },
  // Admin sets the verified status. Drives subscription state + client notification.
  async setStatus(id: string, status: PaymentStatus, extra?: { reference?: string; notes?: string; method?: Payment['method'] }): Promise<void> {
    const now = new Date();
    db.writeSync('payments', db.readSync('payments').map((p) => p.id === id ? {
      ...p, status,
      reference: extra?.reference ?? p.reference,
      method: extra?.method ?? p.method,
      notes: extra?.notes ?? p.notes,
      date: status === 'paid' || status === 'partial' ? (p.date || now.toISOString().slice(0, 10)) : p.date,
      verifiedBy: 'North Forge', verifiedAt: now.toISOString(),
    } : p));
    const p = db.readSync('payments').find((x) => x.id === id);
    if (!p) return;

    // Sync invoice + subscription + notify the client.
    const invStatus = status === 'paid' ? 'paid' : status === 'failed' ? 'overdue' : 'due';
    if (p.invoiceId) db.writeSync('invoices', db.readSync('invoices').map((i) => (i.id === p.invoiceId ? { ...i, status: invStatus as any } : i)));

    if (p.subscriptionId) {
      const subStatus: SubStatus = status === 'paid' ? 'active' : status === 'failed' ? 'past-due' : status === 'refunded' ? 'cancelled' : 'past-due';
      db.writeSync('subscriptions', db.readSync('subscriptions').map((s) => (s.id === p.subscriptionId ? { ...s, status: subStatus } : s)));
    }

    const label: Record<PaymentStatus, string> = {
      pending: 'Payment pending', submitted: 'Payment under review', paid: 'Payment verified',
      partial: 'Partially paid', failed: 'Payment failed', refunded: 'Payment refunded',
    };
    const body: Record<PaymentStatus, string> = {
      pending: 'Your payment is pending. Complete it and submit your reference.',
      submitted: 'We received your payment reference and are verifying it.',
      paid: `Your ${p.planId ? planById(p.planId).name + ' ' : ''}subscription is now active. 🎉`,
      partial: 'We received a partial payment. Please complete the balance.',
      failed: 'Your payment could not be verified. Please try again or contact us.',
      refunded: `A refund of ₹${p.amount.toLocaleString('en-IN')} has been processed.`,
    };
    notifyClient(p.clientId, { type: 'payment', title: label[status], body: body[status], resourceType: 'payment', resourceId: p.id });
    logActivity('North Forge', `marked payment ${status} for`, clientBusiness(p.clientId));
  },
};

export const billingService = {
  subscriptions: () => db.read('subscriptions'),
  invoices: () => db.read('invoices'),
  payments: () => db.read('payments'),
  async updateSub(id: string, patch: Partial<Subscription>) {
    db.writeSync('subscriptions', db.readSync('subscriptions').map((s) => (s.id === id ? { ...s, ...patch } : s)));
  },
  // Convenience: record a completed payment straight to PAID (admin quick-action).
  async recordPayment(input: Partial<Payment>): Promise<Payment> {
    const p = await paymentService.create({ ...input, method: input.method || 'UPI', status: 'paid' });
    if (input.invoiceId) db.writeSync('invoices', db.readSync('invoices').map((i) => (i.id === input.invoiceId ? { ...i, status: 'paid' } : i)));
    if (input.clientId) notifyClient(input.clientId, { type: 'payment', title: 'Payment verified', body: `Payment of ₹${(p.amount).toLocaleString('en-IN')} confirmed.`, resourceType: 'payment', resourceId: p.id });
    logActivity('North Forge', 'recorded payment for', clientBusiness(input.clientId));
    return p;
  },
  async createInvoice(input: Partial<Invoice>): Promise<Invoice> {
    const invs = db.readSync('invoices');
    const num = `NF-INV-${(95 + invs.length).toString().padStart(4, '0')}`;
    const inv: Invoice = { id: uid('i'), number: num, clientId: input.clientId || '', amount: input.amount || 0,
      date: new Date().toISOString().slice(0, 10),
      due: input.due || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: input.status || 'due', plan: input.plan };
    db.writeSync('invoices', [inv, ...invs]);
    logActivity('North Forge', 'created invoice', inv.number);
    return inv;
  },
};

// ---- CLIENT REQUESTS (shared client ↔ admin source of truth) --------------
export const requestService = {
  list: () => db.read('requests'),
  listForClient: (clientId: string) => db.read('requests').then((r) => r.filter((x) => x.clientId === clientId)),
  async create(input: Partial<ClientRequest>): Promise<ClientRequest> {
    const r: ClientRequest = {
      id: uid('rq'), clientId: input.clientId || '', clientName: sanitizeText(input.clientName || clientBusiness(input.clientId), LIMITS.business),
      type: input.type || 'General Support',
      title: sanitizeText(input.title || 'New request', LIMITS.title),
      description: sanitizeText(input.description || '', LIMITS.message),
      priority: input.priority || 'medium', status: 'new', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    db.writeSync('requests', [r, ...db.readSync('requests')]);
    // Admin is notified of the new request (shared source of truth).
    notify({ type: 'message', audience: 'admin', title: `New ${r.type.toLowerCase()} request`, body: `${r.clientName}: ${r.title}`, resourceType: 'request', resourceId: r.id });
    logActivity(r.clientName, 'submitted a request', r.title);
    return r;
  },
  // Admin updates → client is notified of status changes.
  async update(id: string, patch: Partial<ClientRequest>): Promise<void> {
    const before = db.readSync('requests').find((r) => r.id === id);
    db.writeSync('requests', db.readSync('requests').map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)));
    const r = db.readSync('requests').find((x) => x.id === id);
    if (r && patch.status && before && patch.status !== before.status) {
      const label: Record<RequestStatus, string> = {
        new: 'received', 'in-progress': 'now in progress', waiting: 'waiting for your input', completed: 'completed', cancelled: 'cancelled',
      };
      notifyClient(r.clientId, { type: 'message', title: 'Request update', body: `Your request “${r.title}” is ${label[patch.status]}.`, resourceType: 'request', resourceId: r.id });
      logActivity('North Forge', `set request ${patch.status}`, r.title);
    }
  },
};

// ---- PROPOSALS ------------------------------------------------------------
export const proposalService = {
  list: () => db.read('proposals'),
  async create(input: Partial<Proposal>): Promise<Proposal> {
    const list = db.readSync('proposals');
    const num = `NF-PRO-${(22 + list.length).toString().padStart(3, '0')}`;
    const items = input.items || [];
    const sub = items.reduce((a, b) => a + b.amount, 0);
    const p: Proposal = { id: uid('pr'), number: num, clientName: input.clientName || 'New Client',
      clientId: input.clientId, leadId: input.leadId, plan: input.plan, items,
      discount: input.discount || 0, total: sub - (input.discount || 0),
      validUntil: input.validUntil || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: input.status || 'draft', createdAt: new Date().toISOString() };
    db.writeSync('proposals', [p, ...list]);
    logActivity('North Forge', 'created proposal for', p.clientName);
    return p;
  },
  async update(id: string, patch: Partial<Proposal>) {
    db.writeSync('proposals', db.readSync('proposals').map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (patch.status === 'sent') {
      const p = db.readSync('proposals').find(x=>x.id===id);
      if (p) { logActivity('North Forge', 'sent a proposal to', p.clientName);
        notify({ type: 'lead', title: 'Proposal sent', body: `Proposal ${p.number} sent to ${p.clientName}.` }); }
    }
  },
};

// ---- APPOINTMENTS ---------------------------------------------------------
export const appointmentService = {
  list: () => db.read('appointments'),
  async create(input: Partial<Appointment>): Promise<Appointment> {
    const a: Appointment = { id: uid('a'), title: input.title || 'New Appointment',
      clientId: input.clientId, leadId: input.leadId, who: input.who || '',
      service: input.service || 'Consultation', date: input.date || new Date().toISOString().slice(0, 10),
      time: input.time || '17:00', status: input.status || 'requested', notes: input.notes };
    db.writeSync('appointments', [a, ...db.readSync('appointments')]);
    return a;
  },
  async update(id: string, patch: Partial<Appointment>) {
    db.writeSync('appointments', db.readSync('appointments').map((a) => (a.id === id ? { ...a, ...patch } : a)));
  },
};

// ---- WORKFLOWS ------------------------------------------------------------
export const workflowService = {
  list: () => db.read('workflows'),
  async create(input: Partial<Workflow>): Promise<Workflow> {
    const w: Workflow = { id: uid('wf'), name: input.name || 'New Workflow',
      description: input.description || '', active: input.active ?? false,
      nodes: input.nodes || [{ id: uid('wn'), type: 'trigger', label: 'Trigger', detail: 'Select a trigger' }], runs: 0 };
    db.writeSync('workflows', [w, ...db.readSync('workflows')]);
    return w;
  },
  async update(id: string, patch: Partial<Workflow>) {
    db.writeSync('workflows', db.readSync('workflows').map((w) => (w.id === id ? { ...w, ...patch } : w)));
    if (patch.active === true) {
      const w = db.readSync('workflows').find(x=>x.id===id);
      if (w) logActivity('North Forge', 'activated workflow', w.name);
    }
  },
};

// ---- NOTIFICATIONS (audience-aware) ---------------------------------------
export const notificationService = {
  list: () => db.read('notifications'),
  // Admin sees admin-audience notifications; client sees only their own.
  async listFor(role: 'admin' | 'client', clientId?: string): Promise<Notification[]> {
    const all = await db.read('notifications');
    if (role === 'admin') return all.filter((n) => (n.audience ?? 'admin') === 'admin');
    return all.filter((n) => n.audience === 'client' && n.recipientId === clientId);
  },
  async create(n: Omit<Notification, 'id' | 'at' | 'read'>): Promise<void> {
    const list = db.readSync('notifications');
    list.unshift({ ...n, id: uid('no'), at: new Date().toISOString(), read: false });
    db.writeSync('notifications', list.slice(0, 200));
  },
  async markRead(id: string) {
    db.writeSync('notifications', db.readSync('notifications').map((n) => (n.id === id ? { ...n, read: true } : n)));
  },
  async markAllRead(role?: 'admin' | 'client', clientId?: string) {
    db.writeSync('notifications', db.readSync('notifications').map((n) => {
      if (!role) return { ...n, read: true };
      const mine = role === 'admin' ? (n.audience ?? 'admin') === 'admin' : (n.audience === 'client' && n.recipientId === clientId);
      return mine ? { ...n, read: true } : n;
    }));
  },
};

// ---- AUTH (role-aware, credential-based; API-ready) -----------------------
export const authService = {
  async login(email: string, password: string): Promise<{ user: import('@/types').User } | { error: string }> {
    await new Promise((r) => setTimeout(r, 400));
    const users = db.readSync('users');
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return { error: 'No account found with that email.' };
    if (u.password && u.password !== password) return { error: 'Incorrect password. Please try again.' };
    const { password: _pw, ...safe } = u; // never surface password
    return { user: safe };
  },
  async register(input: { name: string; email: string; password: string; business: string; phone?: string }): Promise<{ user: import('@/types').User } | { error: string }> {
    await new Promise((r) => setTimeout(r, 500));
    // Server-side style validation & sanitization (never trust the client form).
    const name = sanitizeText(input.name, LIMITS.name);
    const business = sanitizeText(input.business, LIMITS.business);
    const email = sanitizeText(input.email, LIMITS.email).toLowerCase();
    const phone = input.phone ? sanitizeText(input.phone, LIMITS.phone) : undefined;
    if (!name || !business) return { error: 'Please provide your name and business name.' };
    if (!isEmail(email)) return { error: 'Enter a valid email address.' };
    if (!input.password || input.password.length < 6) return { error: 'Password must be at least 6 characters.' };
    const users = db.readSync('users');
    if (users.some((x) => x.email.toLowerCase() === email)) return { error: 'An account with that email already exists.' };
    // New self-serve signups create a prospect client + a client-role user.
    // Role is fixed server-side to 'client' — it can never be set from the request.
    const client = await clientService.create({ business, contact: name, email, phone, status: 'prospect', plan: 'starter' });
    const u = { id: uid('u'), name, email, role: 'client' as const, clientId: client.id, title: 'Owner', avatar: name.slice(0, 2).toUpperCase(), password: input.password };
    db.writeSync('users', [...users, u]);
    const { password: _pw, ...safe } = u;
    return { user: safe };
  },
};

// ---- ACTIVITY / SUPPORT / MISC -------------------------------------------
export const activityService = { list: () => db.read('activities') };
export const supportService = {
  list: () => db.read('tickets'),
  async update(id: string, patch: Partial<Ticket>) {
    db.writeSync('tickets', db.readSync('tickets').map((t) => (t.id === id ? { ...t, ...patch, updated: new Date().toISOString() } : t)));
  },
  async create(input: Partial<Ticket>): Promise<Ticket> {
    const list = db.readSync('tickets');
    const t: Ticket = { id: uid('tk'), number: `NF-TK-${35 + list.length}`, clientId: input.clientId || '',
      subject: input.subject || 'New request', priority: input.priority || 'medium',
      status: input.status || 'open', created: new Date().toISOString(), updated: new Date().toISOString(),
      assignee: 'North Forge' };
    db.writeSync('tickets', [t, ...list]);
    return t;
  },
};
export const analyticsService = { list: () => db.read('analytics') };
export const messageService = { list: () => db.read('messages'), templates: () => db.read('templates') };
export const assistantService = {
  list: () => db.read('assistants'),
  async create(input: Partial<AIAssistant>): Promise<AIAssistant> {
    const list = db.readSync('assistants');
    if (!input.clientId) throw new Error('A client is required.');
    if (list.some((a) => a.clientId === input.clientId)) throw new Error('This client already has an AI assistant.');
    const a: AIAssistant = {
      clientId: input.clientId,
      name: input.name?.trim() || 'Customer Assistant',
      greeting: input.greeting?.trim() || 'Hi! 👋 How can I help you today?',
      tone: input.tone || 'Friendly',
      hours: input.hours?.trim() || 'Mon–Sat, 9am–7pm',
      faqs: input.faqs?.length ? input.faqs : [{ q: 'What are your prices?', a: 'Our plans start from the Starter tier — ask us for a quote!' }],
      stats: { questions: 0, leads: 0, resolved: 0, escalations: 0 },
    };
    db.writeSync('assistants', [...list, a]);
    return a;
  },
  async update(clientId: string, patch: Partial<AIAssistant>) {
    db.writeSync('assistants', db.readSync('assistants').map((a) => (a.clientId === clientId ? { ...a, ...patch } : a)));
  },
  async remove(clientId: string) {
    db.writeSync('assistants', db.readSync('assistants').filter((a) => a.clientId !== clientId));
  },
};
