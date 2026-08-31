# NorthForge Agency OS

The internal operating system for **NorthForge** — a premium web-design, automation and digital-growth agency in Mangalore, Karnataka.

Built with **React + Vite + TypeScript + Tailwind CSS + React Router + Lucide**. A localStorage-backed service layer stands in for a backend and is structured so it can be swapped for a REST/GraphQL API without touching the UI.

---

## Running it

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # type-check + production build
npm run preview    # preview the production build
```

## Production initial state

A fresh deployment starts **empty** — no demo clients, leads, projects, payments,
requests, notifications, analytics or workflows. Every page has a polished empty
state; real records are created only by actual actions (client registration,
admin creation, lead capture, admin payment verification, etc.).

The only pre-provisioned data is the NorthForge **administrator account** and a
neutral, reusable **WhatsApp template library** (a product feature, not business
data). Services, pricing and the agency profile live in `src/data/catalog.ts`.

## Signing in

The public site (`/`) exposes a single, client-facing sign-in at **`/login`**
(**Get Started** → sign in / create account). There is no public "Admin Login" —
the admin authenticates through the same form and is routed by role.

- **Clients**: create an account → client portal at `/portal`.
- **Admin**: signs in with the administrator account → command center at `/app`.

**Local development admin**: email `north.forge.studio.in@gmail.com`, password from
`VITE_ADMIN_BOOTSTRAP_PASSWORD` (defaults to `northforge` for local only). In a
Supabase-backed deployment the admin is created via Supabase Auth and no password
is stored in code. Passwords are never shown in the UI and are stripped from the
session object.

See **`SECURITY.md`**, **`supabase/policies.sql`** and **`vercel.json`** for the
production security posture.

---

## What's inside

### Public
- Marketing landing page — hero, services, four-tier pricing, process, why, FAQ, contact/WhatsApp
- Polished admin + client login screens

### Admin — the command center (`/app`)
- **Dashboard** — 8 KPI cards with trends & sparklines, traffic chart, hot leads, projects, upcoming, activity
- **Sales** — Leads table (with CSV/XLSX import), drag-and-drop Pipeline (kanban), Lead detail with AI qualification scoring, Proposals with printable preview, Follow-ups, Outreach sequences
- **Clients** — grid/table list, full client profiles, 11-step Onboarding wizard (saveable)
- **Delivery** — Projects with website production pipeline, Websites + detail, Tasks (kanban), Calendar/Bookings
- **Growth** — Analytics, SEO, Conversions funnel
- **Automation** — AI Assistants, WhatsApp Center, visual Workflow builder (add/remove nodes, activate), Bookings
- **Billing** — Subscriptions, Payments, Invoices, Plans editor, Service catalog
- **System** — Notifications, Activity log, Support tickets, Settings (incl. data reset / clear)
- **Global** — ⌘K / Ctrl+K command search, Quick-Create ("+"), theme switch, notifications

### Client portal (`/portal`)
A completely separate, friendlier experience: Overview, Business Profile, My Website, My Project, My Leads, My Analytics (plain-language insights), WhatsApp, AI Assistant, Bookings, Subscription, Invoices, Support, Settings. Mobile bottom-nav included.

---

## Design system
- Strict four-color brand palette: `#0B0D12` · `#3B82FF` · `#8B5CF6` · `#F6F7FB`
- Genuine light / dark / system themes (persisted, applied everywhere)
- Motion: boot loader, page transitions, animated charts & progress bars, modal/drawer/toast animation — all respecting `prefers-reduced-motion`
- Fully responsive with off-canvas mobile sidebar and touch-friendly controls

## Architecture
```
src/
  components/  ui/, charts/, forms/   — reusable primitives
  layouts/     AppShell (admin + client)
  pages/       admin pages + pages/client/ portal
  routes/      nav config
  data/        catalog (plans + services, single source of truth), seed data
  services/    API-boundary services over a swappable db layer
  hooks/       useAuth, useToast, useAsync
  theme/       ThemeProvider
  types/       full domain model
```

Everything is internally consistent — a Growth client shows Growth features, projects belong to clients, websites map to analytics, invoices to subscriptions. Reset or clear the dataset any time from **Settings → Data**.
