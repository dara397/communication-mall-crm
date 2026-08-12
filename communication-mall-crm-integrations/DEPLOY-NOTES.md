# Deploy notes — Integrations + clickable rows

## What changed

**Integrations (connect outside platforms with API keys).**
A new admin-only **Integrations** page (in the left nav under *Admin*) where you
connect outside platforms — QuickBooks, Stripe, HubSpot, Twilio, RingCentral,
Mailchimp, Slack, Google, Microsoft 365, a plain webhook, or any custom service
with an API. For each one you store its API key/credentials, and a **Test**
button makes a quick call to confirm the key can reach the platform.

- API keys are **encrypted at rest** (AES-256-GCM). The encryption key comes
  from your `AUTH_SECRET` environment variable (already set for sign-in), so no
  extra setup is needed. Keys are shown only masked (e.g. `••••••••ab12`) and
  the raw value never leaves the server.
- New database table: `Integration`.

**Clickable rows.**
On Customers, Quotes, Service orders, Invoices, Leads, and Purchase orders, the
**whole row** is now clickable to open its detail page — with a clear hover
highlight and keyboard focus. The existing buttons inside each row (Quote,
Remove, Edit, etc.) still work as before.

## One required step after deploying: create the new table

The Integrations feature adds a database table. Run this **once** against your
database (locally or via your host), from the project folder:

```bash
npm install
npm run db:push
```

`db:push` only adds the new `Integration` table; it does not touch existing
data. On Vercel, the build command (`prisma generate && next build`) does **not**
run `db:push`, so you must run it once yourself against the production database
(e.g. `DATABASE_URL="<prod url>" npm run db:push`).

## Vercel checklist

- **Root Directory:** the Next.js app now lives at the repository root, so set
  Vercel's *Root Directory* to the repo root (blank / `.`).
- **Environment variables:** `DATABASE_URL`, `DIRECT_URL` (if used), and
  `AUTH_SECRET` — same as before. `AUTH_SECRET` also powers key encryption.
- After the first deploy, run `npm run db:push` against the production database
  once (see above), then the Integrations page is ready.
