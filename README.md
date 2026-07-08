# NoBound Portal

Admin + client portal for NoBound.Design.

- **Admin** (you): onboard clients, manage tickets, see subscriptions and invoices.
- **Client portal**: clients log in, raise change requests, pay for one-off tickets, manage their subscription.

## Stack

- Next.js 16 (App Router, TypeScript) on Vercel
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Stripe (subscriptions for hosting/SEO, one-off Checkout for tickets)
- Resend (transactional email)

## First-time setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (region: London — `eu-west-2`).
2. Open the SQL editor and paste the contents of `supabase/migrations/0001_init.sql`. Run it.
3. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this server-only)

### 2. Stripe

1. Create a UK Stripe account; stay in **test mode**.
2. Create 2 Products with monthly GBP recurring Prices:
   - **NoBound Hosting** — £15.00/mo → copy `price_xxx` → `STRIPE_PRICE_HOSTING`
   - **NoBound SEO** — £100.00/mo → copy `price_xxx` → `STRIPE_PRICE_SEO`
3. **Developers → API keys**: copy `pk_test_...` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `sk_test_...` → `STRIPE_SECRET_KEY`.
4. **Settings → Billing → Customer Portal**: enable, allow card updates + cancellations.
5. **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR-DEPLOYED-DOMAIN/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copy the signing secret (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### 3. Resend

1. Sign up at [resend.com](https://resend.com).
2. Verify a sending domain (e.g. `mail.nobound.design`) — Resend gives DNS records to add at GoDaddy.
3. Create an API key → `RESEND_API_KEY`.
4. Set `RESEND_FROM_EMAIL`, e.g. `"NoBound <hello@nobound.design>"`.

### 4. Run it locally

```bash
cp .env.local.example .env.local   # fill in the values
npm install
npm run dev
```

Open http://localhost:3000.

### 5. Make yourself admin

After your first sign-in at `/login`, run this one line in the Supabase SQL editor (replace email):

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'YOU@EXAMPLE.COM');
```

Sign out and back in. You'll land on `/admin`.

## Project layout

```
app/
├── login/                 magic-link sign-in (shared)
├── auth/                  OAuth callback + sign-out
├── admin/                 admin shell + clients + tickets
├── portal/                client shell + dashboard + tickets + pay
└── api/stripe/            checkout + webhook
lib/
├── supabase/              browser, server, admin, proxy clients
├── stripe.ts              Stripe SDK + price IDs
├── email.ts               Resend wrapper
├── auth.ts                getSessionAndRole / requireAdmin / requireClient
└── format.ts              currency, date, status labels
emails/                    React Email templates
supabase/migrations/       SQL schema (paste into Supabase SQL editor)
proxy.ts                   Route protection (was middleware.ts in Next 15)
```

## Verifying end-to-end (test mode)

1. Sign in at `/login` with your admin email.
2. `/admin/clients/new` — onboard a test client with both plans.
3. Check the email — click "Set up payment" → pay with `4242 4242 4242 4242` / any future date / any CVC.
4. As that client, raise a ticket from `/portal/tickets/new`.
5. As admin, open the ticket, set a price, "Send for payment".
6. As the client, pay with the test card. Check `/admin/tickets/<id>` flips to `paid` (webhook).
7. Mark "In progress" → "Complete" → client receives the completion email.
8. In `/portal`, click "Manage billing" — Stripe Customer Portal opens.

When all of that works in test mode: swap the keys for live mode in Vercel env vars.

## Going live

- Recreate the Hosting + SEO Products and Prices in Stripe **live mode** → update `STRIPE_PRICE_*` env vars.
- Add a **live** webhook endpoint pointing at production → update `STRIPE_WEBHOOK_SECRET`.
- Replace test keys with live keys (`sk_live_...`, `pk_live_...`).
- Done.
