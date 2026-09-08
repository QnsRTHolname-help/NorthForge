// ---------------------------------------------------------------------------
// POST /api/contact — automation audit lead capture.
// Server-side validation, honeypot, rate limiting, and (when Supabase envs are
// configured) durable persistence through the service-role client. If the
// backend is not configured the route accepts the submission in standalone mode
// so the local deployment still records it on the client side; a deployment
// with the real database will persist the same lead server-side.
// ---------------------------------------------------------------------------
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiError, fail, ok } from '../server/lib/http.js';
import { supabaseAdmin } from '../server/lib/supabaseAdmin.js';

const LIMITS = { name: 80, business: 120, email: 120, phone: 20, short: 200, message: 2000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HONEYPOT = 'company_website';

const hits = new Map<string, number[]>();
function rate(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    throw new ApiError(429, 'RATE_LIMITED', 'Too many submissions. Please try again shortly.');
  }
  list.push(now);
  hits.set(key, list);
}

function text(v: unknown, max: number): string {
  return String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, max)
    .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return fail(res, new ApiError(405, 'METHOD_NOT_ALLOWED', 'POST required.'));
  }
  try {
    const body = (req.body || {}) as Record<string, unknown>;
    if (body[HONEYPOT]) {
      // Hidden field filled → bot. Return a validation error; do not accept.
      throw new ApiError(400, 'VALIDATION', 'Please fill out the required fields.');
    }
    rate(`contact:${body.email || 'anon'}`, 5, 60_000);

    const name = text(body.name, LIMITS.name);
    const business = text(body.business, LIMITS.business);
    const email = text(body.email, LIMITS.email).toLowerCase();
    const phone = text(body.phone, LIMITS.phone);
    if (!name) throw new ApiError(400, 'VALIDATION', 'Name is required.');
    if (!business) throw new ApiError(400, 'VALIDATION', 'Business name is required.');
    if (!email || !EMAIL_RE.test(email)) throw new ApiError(400, 'VALIDATION', 'A valid email is required.');

    const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    const ref = `NF-CONTACT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

    if (configured) {
      const db = supabaseAdmin();
      const { error } = await db.from('leads').insert({
        code: ref,
        business,
        contact: name,
        email,
        phone,
        whatsapp: phone,
        category: text(body.businessType, LIMITS.short) || 'General',
        source: 'Website Contact',
        status: 'new',
        priority: 'medium',
        assignee: 'North Forge',
        est_value: 999,
        pitch: [
          body.currentTools ? `Current tools: ${text(body.currentTools, LIMITS.short)}` : null,
          body.biggestTimeSink ? `Most time consuming: ${text(body.biggestTimeSink, LIMITS.short)}` : null,
          body.monthlyEnquiries ? `Monthly enquiries: ${text(body.monthlyEnquiries, LIMITS.short)}` : null,
          body.message ? `Message: ${text(body.message, LIMITS.message)}` : null,
        ].filter(Boolean).join('\n'),
      });
      if (error) throw new ApiError(500, 'SAVE_FAILED', 'The enquiry could not be saved. Please try again.');
      return ok(res, { mode: 'persisted', ref });
    }

    return ok(res, { mode: 'standalone', ref });
  } catch (err) {
    return fail(res, err);
  }
}
