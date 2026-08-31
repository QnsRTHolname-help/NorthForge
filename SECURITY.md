# NorthForge Agency OS — Security

## Current deployment reality
This build runs **frontend-only** with a persistent local data adapter (`src/services/db.ts`)
behind a clean service boundary (`src/services/index.ts`). It is architected so the adapter
can be swapped for **Supabase** without changing UI code.

Because no live Supabase/Vercel backend is connected in this environment, infrastructure
controls (RLS, headers, CORS, rate limiting) are shipped as **ready-to-apply config**, and the
in-app Security report marks them **WARN — provided, not yet connected** rather than falsely PASS.

## What is enforced in this build (verified by the in-app audit)
- **Payment authorization**: clients can only reach `pending`/`submitted`. Only admin
  `paymentService.setStatus(...,'paid')` activates a subscription. The browser can never mark PAID.
- **Role integrity**: `authService.register()` hard-codes `role: 'client'`; role is never taken
  from client input. `useAuth` never trusts a URL/localStorage role for authorization decisions
  beyond session identity.
- **Client isolation (UI + data layer)**: portal reads are scoped by the authenticated
  `clientId`; notifications are audience-partitioned (`listFor`) and the preflight verifies no leak.
- **Input validation & sanitization**: `src/utils/security.ts` validates type/length/format and
  strips control chars server-side-style in `authService.register` and `requestService.create`.
- **XSS**: all user content is rendered through React (auto-escaped). No `dangerouslySetInnerHTML`
  anywhere in the codebase.
- **Anti-abuse**: honeypot field + client-side sliding-window rate limit on auth.
- **No secrets in the bundle**: no service-role keys, passwords, or tokens in client code.

## What to apply when connecting the backend
- `supabase/policies.sql` — RLS for every sensitive table (no `USING (true)`), tenant scoping,
  admin-only tables, storage policies, immutable roles, audit log, `SECURITY DEFINER` helpers
  with locked `search_path`.
- `vercel.json` — CSP, HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors,
  Referrer-Policy, Permissions-Policy, COOP, SPA rewrites, immutable asset caching.
- `.env.example` — only `VITE_*` (anon key, guarded by RLS) is browser-exposed; the
  service-role key stays server-only.
- Supabase Auth handles password hashing, email verification, session expiry & reset — do not
  build custom password storage.
