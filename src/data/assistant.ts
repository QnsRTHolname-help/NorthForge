// ---------------------------------------------------------------------------
// Default NorthForge AI assistant — built from the real business catalog so
// the chat bubble is always available, even before a client-specific
// assistant is configured. Used as a fallback by the ChatWidget mounts.
// ---------------------------------------------------------------------------
import type { AIAssistant } from '@/types';
import { AGENCY, PLANS, SERVICES, formatINR } from './catalog';

const pricingAnswer = PLANS
  .filter((p) => p.active)
  .map((p) => `• ${p.name} — ${formatINR(p.price)}/mo: ${p.tagline}`)
  .join('\n');

const serviceAnswer = `We offer: ${SERVICES.map((s) => s.name).join(', ')}. ` +
  `Plans start from ${formatINR(Math.min(...PLANS.filter((p) => p.price > 0).map((p) => p.price)))}/mo.`;

export const defaultAssistant: AIAssistant = {
  clientId: 'northforge-default',
  name: AGENCY.name,
  greeting: `Hi! 👋 I'm the ${AGENCY.name} assistant. Ask me about our services, plans, or how to get started.`,
  tone: 'Friendly',
  hours: `${AGENCY.hours.weekday} · ${AGENCY.hours.saturday} · ${AGENCY.hours.sunday}`,
  faqs: [
    { q: 'What are your prices?', a: `Our plans:\n${pricingAnswer}` },
    { q: 'What services do you offer?', a: serviceAnswer },
    { q: 'How can I contact you?', a: `You can reach us on WhatsApp or call ${AGENCY.phone}, or email ${AGENCY.email}. We usually reply the same day.` },
    { q: 'What are your working hours?', a: `We're available: ${AGENCY.hours.weekday}, ${AGENCY.hours.saturday} and ${AGENCY.hours.sunday}.` },
    { q: 'Where are you located?', a: `We're based in ${AGENCY.location}, and we work with businesses across India remotely. Visit ${AGENCY.website}.` },
    { q: 'How do I get started?', a: `Simple! Pick a plan (Starter, Growth or Pro) and we'll set everything up — usually within a few days. Ask me for a recommendation based on your business goals.` },
  ],
  stats: { questions: 0, leads: 0, resolved: 0, escalations: 0 },
};
