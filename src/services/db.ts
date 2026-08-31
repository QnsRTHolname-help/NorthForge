// ---------------------------------------------------------------------------
// Local persistence layer. Acts as the single low-level store behind every
// service. Swap this file's read/write for REST/GraphQL calls later without
// touching UI code — the service modules already form the API boundary.
// ---------------------------------------------------------------------------

import * as seed from '@/data/seed';

const NS = 'northforge.db.v3';

export interface DBShape {
  users: typeof seed.seedUsers;
  clients: typeof seed.seedClients;
  leads: typeof seed.seedLeads;
  projects: typeof seed.seedProjects;
  tasks: typeof seed.seedTasks;
  websites: typeof seed.seedWebsites;
  subscriptions: typeof seed.seedSubscriptions;
  invoices: typeof seed.seedInvoices;
  payments: typeof seed.seedPayments;
  proposals: typeof seed.seedProposals;
  appointments: typeof seed.seedAppointments;
  workflows: typeof seed.seedWorkflows;
  templates: typeof seed.seedTemplates;
  messages: typeof seed.seedMessages;
  assistants: typeof seed.seedAssistants;
  notifications: typeof seed.seedNotifications;
  activities: typeof seed.seedActivities;
  tickets: typeof seed.seedTickets;
  analytics: typeof seed.seedAnalytics;
  requests: typeof seed.seedRequests;
}

function freshDB(): DBShape {
  return {
    users: seed.seedUsers,
    clients: seed.seedClients,
    leads: seed.seedLeads,
    projects: seed.seedProjects,
    tasks: seed.seedTasks,
    websites: seed.seedWebsites,
    subscriptions: seed.seedSubscriptions,
    invoices: seed.seedInvoices,
    payments: seed.seedPayments,
    proposals: seed.seedProposals,
    appointments: seed.seedAppointments,
    workflows: seed.seedWorkflows,
    templates: seed.seedTemplates,
    messages: seed.seedMessages,
    assistants: seed.seedAssistants,
    notifications: seed.seedNotifications,
    activities: seed.seedActivities,
    tickets: seed.seedTickets,
    analytics: seed.seedAnalytics,
    requests: seed.seedRequests,
  };
}

let cache: DBShape | null = null;

function load(): DBShape {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(NS);
    if (raw) {
      cache = JSON.parse(raw);
      return cache!;
    }
  } catch {}
  cache = structuredClone(freshDB());
  persist();
  return cache;
}

function persist() {
  try {
    localStorage.setItem(NS, JSON.stringify(cache));
  } catch {}
}

// Simulate async network latency so loading states are real.
const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export const db = {
  async read<K extends keyof DBShape>(key: K): Promise<DBShape[K]> {
    await delay();
    return structuredClone(load()[key]);
  },
  readSync<K extends keyof DBShape>(key: K): DBShape[K] {
    return structuredClone(load()[key]);
  },
  async write<K extends keyof DBShape>(key: K, value: DBShape[K]): Promise<void> {
    await delay(40);
    load();
    (cache as any)[key] = value;
    persist();
  },
  writeSync<K extends keyof DBShape>(key: K, value: DBShape[K]): void {
    load();
    (cache as any)[key] = value;
    persist();
  },
  reset() {
    cache = structuredClone(freshDB());
    persist();
  },
  // Snapshot/restore used by the System Health preflight so test writes
  // never pollute real records.
  snapshot(): string {
    return JSON.stringify(load());
  },
  restore(snap: string) {
    try { cache = JSON.parse(snap); persist(); } catch {}
  },
  clearAll() {
    // Empty every collection except users/plans/services (catalog is code-based)
    const empty = structuredClone(freshDB());
    (Object.keys(empty) as (keyof DBShape)[]).forEach((k) => {
      if (k !== 'users' && k !== 'assistants' && k !== 'templates') {
        (empty as any)[k] = [];
      }
    });
    cache = empty;
    persist();
  },
};

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
