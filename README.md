# Communication Mall CRM

An internal CRM for Communication Mall: manage customers, build **quotes**, convert them
into **service orders**, and turn those into **invoices** — with a scheduling calendar,
a job status board, an equipment inventory, and a Tele Express–style products & services
price list. Quotes and invoices can be downloaded as PDFs or emailed to customers.

Built with **Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
NextAuth · Resend**.

---

## What's inside

| Area | What it does |
|------|--------------|
| **Dashboard** | This week's schedule front and center, plus open quotes / active jobs / outstanding invoices / customers. |
| **Customers** | Full contact records with a per-customer history of quotes, orders, and invoices. |
| **Quotes** | Line items from the product catalog, equipment inventory, or custom lines. Tracks MRC (monthly) vs NRC (one-time). One click converts an accepted quote into a service order. |
| **Service orders** | A Kanban job board (Scheduled → In progress → On hold → Completed → Invoiced). Schedule a date/time; convert a completed order into an invoice. |
| **Invoices** | Draft → Sent → Paid / Overdue / Void, with due dates. |
| **Schedule** | Weekly calendar of scheduled jobs, with prev/next navigation. |
| **Equipment** | Physical parts inventory with cost, price, and quantity on hand. |
| **Products & services** | The MRC/NRC price list. Import the full Tele Express list with one command (see below). |
| **Settings** | Manage users (admin only) and view company details. |
| **Diagnostics** | Verify your environment and send a Resend test email. |

Documents share human-friendly numbers: `Q-1001`, `SO-1001`, `INV-1001`.

---

## 1. Prerequisites

- **Node.js 18.18+** (Node 20 recommended)
- A **PostgreSQL database**. The easiest free option that works with Vercel is
  [Neon](https://neon.tech) or **Vercel Postgres**. Supabase also works.

---

## 2. Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env from the template and fill it in
cp .env.example .env
#    …then edit .env (see the variable list below)

# 3. Create the database tables
npm run db:push

# 4. Seed the admin user + sample products/equipment
npm run db:seed

# 5. Run the app
npm run dev
```

Open http://localhost:3000 and sign in with the `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` from your `.env`.

### Environment variables

All keys live in `.env.example`. The important ones:

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Postgres connection string (pooled). |
| `DIRECT_URL` | ✅ | Direct (non-pooled) connection for migrations. If your provider gives one URL, set both to the same value. |
| `NEXTAUTH_SECRET` | ✅ | Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | ✅ (prod) | Your deployed URL, e.g. `https://crm.communicationmall.com`. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | for seeding | The first admin login. |
| `RESEND_API_KEY` | optional | Enables emailing quotes/invoices. |
| `EMAIL_FROM` | optional | Must be on a domain verified in Resend. |
| `COMPANY_NAME` / `COMPANY_ADDRESS` / `COMPANY_PHONE` / `COMPANY_EMAIL` | optional | Shown on documents and PDFs. |
| `COMPANY_LOGO_URL` | optional | Logo for the app header, login screen, and PDFs (see below). |
| `DEFAULT_TAX_RATE` | optional | Decimal, e.g. `0.0775` for 7.75%. |

### Adding your logo

Two easy options:

1. **Drop it in the repo.** Put `logo.png` in the `public/` folder, commit, and set
   `COMPANY_LOGO_URL` to `https://<your-app>.vercel.app/logo.png` (your deployed URL +
   `/logo.png`).
2. **Point at any hosted image.** Set `COMPANY_LOGO_URL` to any public image URL, or a
   `data:` URI.

The logo appears in the sidebar, on the login page, and on every quote/invoice PDF. If
it's left blank — or the image can't be loaded — the app falls back to a simple "CM"
monogram, so a bad URL never breaks your PDFs.

---

## 3. Import the Tele Express price list

Put your price list somewhere on disk (`.csv` or `.xlsx`) and run:

```bash
npm run import:pricelist -- ./pricelist.xlsx
```

The importer auto-detects columns by common header names (Item/SKU, Product/Service,
Category, Monthly/MRC, One-Time/NRC). If your file uses different headers, map them
explicitly:

```bash
npm run import:pricelist -- ./list.xlsx --code="Item #" --name="Description" \
  --mrc="Monthly Recurring" --nrc="One Time" --category="Type"
```

Re-running the import updates existing products (matched by code) and adds new ones —
it's safe to run again whenever the price list changes.

---

## 4. Deploy to Vercel from GitHub

1. **Push this folder to a new GitHub repository.**

   ```bash
   git init
   git add .
   git commit -m "Initial commit: Communication Mall CRM"
   git branch -M main
   git remote add origin https://github.com/<you>/communication-mall-crm.git
   git push -u origin main
   ```

2. **Create the database.** In the Vercel dashboard, go to **Storage → Create →
   Postgres** (or create a Neon database and copy its connection string).

3. **Import the repo into Vercel** (New Project → import your GitHub repo). Vercel
   auto-detects Next.js — no build settings to change. The build command is already
   `prisma generate && next build` and `prisma generate` also runs on install.

4. **Add environment variables** in Vercel → Project → **Settings → Environment
   Variables**. Paste in everything from your `.env` (at minimum `DATABASE_URL`,
   `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and — if using email —
   `RESEND_API_KEY` and `EMAIL_FROM`). If you added Vercel Postgres, its
   `DATABASE_URL`/`DIRECT_URL` are injected automatically.

5. **Deploy.** After the first deploy, create the tables and seed the admin user by
   running these once against your **production** database (locally, with your prod
   `DATABASE_URL` / `DIRECT_URL` in `.env`):

   ```bash
   npm run db:migrate   # applies the committed migration(s) — prisma migrate deploy
   npm run db:seed      # creates the admin user + sample data
   ```

   > This project ships versioned migrations in `prisma/migrations/`, so
   > `db:migrate` is the recommended way to set up and later evolve the schema.
   > (`npm run db:push` also works for a quick one-off if you don't care about
   > migration history.) When you change `schema.prisma` later, run
   > `npx prisma migrate dev --name <change>` locally to create the next migration,
   > commit it, and `db:migrate` applies it in production.

6. **Sign in** at your Vercel URL with the seeded admin account and **change the
   password** (Settings → add a new admin, or reset via the seed variables).

That's it — the app is live. Add your users under **Settings**, import the price list,
and start creating quotes.

---

## Everyday commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Local dev server. |
| `npm run build` | Production build (runs `prisma generate`). |
| `npm run start` | Run the production build locally. |
| `npm run db:migrate` | Apply committed migrations (`prisma migrate deploy`). |
| `npm run db:push` | Sync the schema without migration files (quick one-off). |
| `npm run db:seed` | Create/refresh the admin user + sample data. |
| `npm run import:pricelist -- ./file.xlsx` | Import products from a price list. |

---

## Notes

- **Email:** sending uses Resend. The `EMAIL_FROM` domain must be verified in your
  Resend account or messages are rejected. Use the **Diagnostics** page to test.
- **PDFs** are generated on the server with `@react-pdf/renderer` — no headless browser
  required, so they work on Vercel's serverless runtime.
- **Access:** every page is behind login. The first admin is created by the seed;
  admins add more users under Settings.
