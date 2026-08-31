import { useAuth } from '@/hooks/useAuth';
import { db } from '@/services/db';
import type { Client } from '@/types';

// Resolves the currently logged-in client's full record + related data.
// Scoped strictly to the authenticated user's clientId — never a fallback tenant.
// The portal layout (ClientDataGuard) guarantees a client record exists before
// any portal page renders, so `client` is safe to treat as present here.
export function useClientData() {
  const { user } = useAuth();
  const clientId = user?.clientId || '';
  const client = db.readSync('clients').find((c) => c.id === clientId) as Client;
  return {
    clientId,
    client,
    website: db.readSync('websites').find((w) => w.clientId === clientId),
    project: db.readSync('projects').find((p) => p.clientId === clientId),
    subscription: db.readSync('subscriptions').find((s) => s.clientId === clientId),
    invoices: db.readSync('invoices').filter((i) => i.clientId === clientId),
    analytics: db.readSync('analytics').find((a) => a.clientId === clientId),
    assistant: db.readSync('assistants').find((a) => a.clientId === clientId),
    tickets: db.readSync('tickets').filter((t) => t.clientId === clientId),
    messages: db.readSync('messages').filter((m) => m.clientId === clientId),
    appointments: db.readSync('appointments').filter((a) => a.clientId === clientId),
    payments: db.readSync('payments').filter((p) => p.clientId === clientId),
    requests: db.readSync('requests').filter((r) => r.clientId === clientId),
  };
}

// True when the authenticated client's record exists in the data layer.
export function useHasClientRecord(): boolean {
  const { user } = useAuth();
  if (!user?.clientId) return false;
  return !!db.readSync('clients').find((c) => c.id === user.clientId);
}

