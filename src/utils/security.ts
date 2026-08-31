// ---------------------------------------------------------------------------
// Client-side input validation + safe-rendering helpers.
// NOTE: These are UX/defense-in-depth guards. Real authorization & validation
// must ALSO be enforced server-side (Supabase RLS + edge functions). See
// /supabase/policies.sql and vercel.json shipped with this project.
// ---------------------------------------------------------------------------

export const LIMITS = {
  name: 80, email: 120, phone: 20, business: 120, title: 120,
  short: 200, message: 2000, reference: 60, password: 128,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export type FieldRule = { required?: boolean; max?: number; kind?: 'email' | 'phone' | 'text' };

export function validateField(value: string, rule: FieldRule): string | null {
  const v = (value ?? '').trim();
  if (rule.required && !v) return 'This field is required.';
  if (!v) return null;
  if (rule.max && v.length > rule.max) return `Please keep this under ${rule.max} characters.`;
  if (rule.kind === 'email' && !EMAIL_RE.test(v)) return 'Enter a valid email address.';
  if (rule.kind === 'phone' && !PHONE_RE.test(v)) return 'Enter a valid phone number.';
  return null;
}

export function validate(fields: Record<string, { value: string; rule: FieldRule }>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [k, { value, rule }] of Object.entries(fields)) {
    const err = validateField(value, rule);
    if (err) errors[k] = err;
  }
  return errors;
}

// Strip control chars + trim + cap length. Text is always rendered via React
// (auto-escaped) — we never use dangerouslySetInnerHTML — so this is a
// belt-and-braces normaliser for stored values.
export function sanitizeText(input: string, max = LIMITS.message): string {
  return (input ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, max)
    .trim();
}

export const isEmail = (v: string) => EMAIL_RE.test((v ?? '').trim());

// ---------------------------------------------------------------------------
// Lightweight client-side rate limiter (per-action, sliding window).
// A convenience guard only — authoritative rate limiting belongs at the
// Supabase/Vercel edge. Keyed in localStorage so it survives reloads.
// ---------------------------------------------------------------------------
export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryInMs: number } {
  const now = Date.now();
  const storeKey = `northforge.rl.${key}`;
  let hits: number[] = [];
  try { hits = JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch {}
  hits = hits.filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    return { ok: false, retryInMs: windowMs - (now - hits[0]) };
  }
  hits.push(now);
  try { localStorage.setItem(storeKey, JSON.stringify(hits)); } catch {}
  return { ok: true, retryInMs: 0 };
}

// Honeypot: if a hidden field is filled, it's almost certainly a bot.
export const HONEYPOT_NAME = 'company_website'; // innocuous-looking name
export const isBot = (honeypotValue: string) => honeypotValue.trim().length > 0;
