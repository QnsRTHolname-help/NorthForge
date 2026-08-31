import { Badge } from './primitives';
import type {
  LeadStatus, ClientStatus, ProjectStatus, WebsiteStatus, SubStatus, TaskStatus,
  ProposalStatus, ApptStatus, TicketStatus, InvoiceStatus, LeadPriority, LeadIntent,
} from '@/types';

type Tone = 'brand' | 'violet' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const lead: Record<LeadStatus, [string, Tone]> = {
  new: ['New', 'info'], contacted: ['Contacted', 'brand'], qualified: ['Qualified', 'violet'],
  proposal: ['Proposal', 'warning'], negotiation: ['Negotiation', 'warning'], won: ['Won', 'success'], lost: ['Lost', 'danger'],
};
const client: Record<ClientStatus, [string, Tone]> = {
  prospect: ['Prospect', 'info'], onboarding: ['Onboarding', 'warning'], active: ['Active', 'success'],
  paused: ['Paused', 'neutral'], completed: ['Completed', 'brand'], cancelled: ['Cancelled', 'danger'],
};
const project: Record<ProjectStatus, [string, Tone]> = {
  planning: ['Planning', 'neutral'], content: ['Content', 'info'], design: ['Design', 'violet'],
  development: ['Development', 'brand'], review: ['Review', 'warning'], revisions: ['Revisions', 'warning'],
  launch: ['Launch', 'info'], live: ['Live', 'success'], maintenance: ['Maintenance', 'neutral'],
};
const website: Record<WebsiteStatus, [string, Tone]> = {
  planning: ['Planning', 'neutral'], building: ['Building', 'brand'], review: ['Review', 'warning'],
  published: ['Published', 'success'], maintenance: ['Maintenance', 'info'], paused: ['Paused', 'neutral'],
};
const sub: Record<SubStatus, [string, Tone]> = {
  active: ['Active', 'success'], paused: ['Paused', 'neutral'], 'past-due': ['Past Due', 'danger'], cancelled: ['Cancelled', 'danger'],
};
const task: Record<TaskStatus, [string, Tone]> = {
  todo: ['To do', 'neutral'], 'in-progress': ['In progress', 'brand'], review: ['Review', 'warning'], done: ['Done', 'success'],
};
const proposal: Record<string, [string, Tone]> = {
  draft: ['Draft', 'neutral'], sent: ['Sent', 'brand'], viewed: ['Viewed', 'info'],
  accepted: ['Accepted', 'success'], rejected: ['Rejected', 'danger'], expired: ['Expired', 'neutral'], negotiation: ['Negotiation', 'warning'],
};
const appt: Record<ApptStatus, [string, Tone]> = {
  requested: ['Requested', 'warning'], confirmed: ['Confirmed', 'success'], completed: ['Completed', 'brand'],
  cancelled: ['Cancelled', 'danger'], 'no-show': ['No show', 'neutral'],
};
const ticket: Record<TicketStatus, [string, Tone]> = {
  open: ['Open', 'info'], 'in-progress': ['In progress', 'brand'], waiting: ['Waiting', 'warning'],
  resolved: ['Resolved', 'success'], closed: ['Closed', 'neutral'],
};
const invoice: Record<InvoiceStatus, [string, Tone]> = {
  paid: ['Paid', 'success'], due: ['Due', 'warning'], overdue: ['Overdue', 'danger'], draft: ['Draft', 'neutral'],
};
const priority: Record<LeadPriority, [string, Tone]> = {
  high: ['High', 'danger'], medium: ['Medium', 'warning'], low: ['Low', 'neutral'],
};
const intent: Record<LeadIntent, [string, Tone]> = {
  high: ['High Intent', 'success'], medium: ['Medium Intent', 'warning'], low: ['Low Intent', 'neutral'],
};

const request: Record<string, [string, Tone]> = {
  new: ['New', 'info'], 'in-progress': ['In progress', 'brand'], waiting: ['Waiting on you', 'warning'],
  completed: ['Completed', 'success'], cancelled: ['Cancelled', 'neutral'],
};
const payment: Record<string, [string, Tone]> = {
  pending: ['Payment pending', 'warning'], submitted: ['Under review', 'info'], paid: ['Paid', 'success'],
  partial: ['Partially paid', 'warning'], failed: ['Payment failed', 'danger'], refunded: ['Refunded', 'neutral'],
};
const maps: any = { lead, client, project, website, sub, task, proposal, appt, ticket, invoice, priority, intent, request, payment };

export function StatusBadge({ kind, value, dot }: { kind: keyof typeof maps; value: string; dot?: boolean }) {
  const entry = maps[kind]?.[value] || [value, 'neutral'];
  return <Badge tone={entry[1]} dot={dot}>{entry[0]}</Badge>;
}

export const statusLabel = (kind: keyof typeof maps, value: string) => maps[kind]?.[value]?.[0] || value;
