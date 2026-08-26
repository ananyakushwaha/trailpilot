# TrailOS

B2B SaaS operations platform for travel agencies, tour operators and their vendors —
lead capture, itinerary creation, booking, payments and customer communication in one
dashboard. Built for Artbyte Innovations per the TrailOS Developer PRD.

## Scope built so far (Month 1 – 3, full MVP roadmap)

**Month 1 — Foundation**
- Login and signup (agency + owner account creation)
- Agency profile setup
- Role-based access control (7 roles, enforced both in the UI and on every API route)
- Lead dashboard (pipeline, search/filter, follow-up tracking, assignment)
- Customer profiles (reusable across trips, lead → customer conversion)
- Basic follow-up reminders (dashboard cards + filtered lead views)

**Month 2 — Operations and Itinerary**
- Manual itinerary builder with day-wise plans
- AI-assisted itinerary draft (Anthropic if `ANTHROPIC_API_KEY` is set, otherwise a
  template-based draft — always editable before sending)
- PDF itinerary export, duplication, and a public shareable link
- Booking management with a status pipeline and operational checklist
- Vendor assignment per booking (hotels, drivers, guides, activity providers)
- Customer + vendor payment tracking (manual entry always works) with PDF invoices
  and receipts
- Optional Razorpay order creation (gated on `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`)

**Month 3 — Automation and Analytics**
- Vendor directory (hotels, homestays, drivers, guides, activity/transport/local
  coordinator partners)
- WhatsApp (Meta Cloud API) + email (Resend) notification engine with per-agency
  configurable templates; falls back to logging the message if not configured
- Public, unauthenticated post-trip feedback form; a good score (≥4/5) automatically
  triggers a Google review request, a low score surfaces internally instead
- Analytics dashboard: average rating, vendor-wise ratings, revenue trend, common
  complaint keywords, recent feedback/complaints

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM (multi-tenant: every business table is scoped by `agencyId`)
- JWT session auth (httpOnly cookie), bcrypt password hashing
- Route protection via `src/proxy.ts` + per-route role/ownership checks in `src/lib/auth.ts`
- PDF generation via `@react-pdf/renderer` (no headless browser needed)
- Integrations are plain `fetch` calls against each provider's REST API (no extra SDKs):
  Anthropic Messages API, Meta WhatsApp Cloud API, Resend, Razorpay

## Getting started

1. Create a Postgres database and copy `.env.example` to `.env`, filling in
   `DATABASE_URL` and a random `JWT_SECRET`. The integration keys are optional —
   every feature works without them (see "Optional integrations" below).
2. Install dependencies and run migrations:

   ```bash
   npm install
   npx prisma migrate dev
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

4. Visit `http://localhost:3000/signup` to create the first agency account.

## Optional integrations

Every one of these degrades gracefully when unset, so the full pipeline (lead → 
itinerary → booking → payment → notification → feedback → review) works end-to-end
with zero external accounts:

| Env var | Feature | Fallback when unset |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | AI itinerary draft | Deterministic template draft |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp sending | Message is logged (`NotificationLog`, status `LOGGED_ONLY`), not sent |
| `RESEND_API_KEY` | Email sending | Message is logged, not sent |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Online payment order | Endpoint returns 501; manual entry (cash/UPI/bank transfer) always works |

## Project structure

- `src/app/(app)` — authenticated screens: dashboard, leads, customers, itineraries,
  bookings, vendors, analytics, agency settings
- `src/app/feedback/[bookingId]` — public, unauthenticated post-trip feedback form
- `src/app/api` — REST API routes; authenticated ones enforce session + role + agency
  ownership, the handful under `api/public/*` are intentionally unauthenticated
  (share links, feedback submission) and scoped by unguessable cuid IDs
- `src/lib` — auth/session helpers, RBAC role tables, Prisma client, validation
  schemas, AI/WhatsApp/email/Razorpay clients, PDF renderers, notification templates
- `prisma/schema.prisma` — multi-tenant data model

## Deployment

- **Frontend + API**: Vercel (Next.js native) or any Node host (Railway, Render)
- **Database**: Supabase, Neon, or AWS RDS (PostgreSQL)
- **File storage**: not required yet — PDFs are generated on demand, not persisted
- Run `npx prisma migrate deploy` against the production database as part of your
  deploy step (not `migrate dev`, which is for local development)
- Set `JWT_SECRET` to a strong random value in production; set the optional
  integration env vars per agency's needs

## Verifying a change

```bash
npx tsc --noEmit   # type check
npx eslint .       # lint
npm run build      # production build
```
