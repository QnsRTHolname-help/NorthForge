import { AGENCY } from '@/data/catalog';

const digits = (s: string) => s.replace(/[^0-9]/g, '');

// Build a wa.me deep link with a prefilled message.
export function waLink(message: string, phone: string = AGENCY.whatsapp): string {
  return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(message)}`;
}

// Preset messages used across the public site & portal.
export const waMessages = {
  general: "Hi NorthForge, I'm interested in getting a website for my business.",
  starter: "Hi NorthForge, I'm interested in the ₹999 Starter plan.",
  growth: "Hi NorthForge, I'm interested in the ₹1,999 Growth plan.",
  pro: "Hi NorthForge, I'm interested in the ₹2,999 Pro plan.",
  custom: "Hi NorthForge, I'd like to discuss a custom project.",
  support: "Hi NorthForge, I need help with my project.",
};

export function planWa(planId: string): string {
  const map: Record<string, string> = { starter: waMessages.starter, growth: waMessages.growth, pro: waMessages.pro, custom: waMessages.custom };
  return waLink(map[planId] || waMessages.general);
}

export const mailto = (subject?: string, body?: string) => {
  const q: string[] = [];
  if (subject) q.push(`subject=${encodeURIComponent(subject)}`);
  if (body) q.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${AGENCY.email}${q.length ? '?' + q.join('&') : ''}`;
};

export const tel = (phone: string = AGENCY.phone) => `tel:${phone.replace(/\s/g, '')}`;

// Open an external channel in a new tab reliably.
export function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
