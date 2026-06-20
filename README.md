# Cartly

**Save it. Track it. Buy it when it’s right.**

Cartly is a universal wishlist and price tracker built with Next.js 14,
TypeScript, Tailwind CSS, Prisma, NextAuth, Stripe, Cheerio, Puppeteer, and
Recharts.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

When `DATABASE_URL` is omitted, Cartly uses browser storage for personal picks
and collections. Each email receives an independent empty workspace, so the
full product experience can be tested without sample data appearing inside a
new account.

## Connect PostgreSQL

1. Add a PostgreSQL `DATABASE_URL` to `.env.local`.
2. Run `pnpm db:push`.
3. Optionally run `pnpm db:seed` to create the explicit demo account.

For production schema changes, use migrations:

```bash
pnpm db:migrate
```

The optional seeded demo login is:

```text
demo@cartly.app
cartly-demo
```

## External services

- Google OAuth: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Stripe: create monthly and yearly recurring prices, then set the Stripe
  variables from `.env.example`.
- Stripe webhooks: forward events to `/api/stripe/webhook`.
- Email: set `RESEND_API_KEY`. Without it, email events are logged as previews.
- Browser scraping: set `CHROME_EXECUTABLE_PATH` when a local Chromium
  executable is required.
- Automated tracking: call `/api/cron/track?cadence=all` from any scheduler and
  send `Authorization: Bearer CRON_SECRET`.

## Important routes

- `/` — landing page
- `/app/dashboard` — personal wishlist
- `/app/dashboard/add-product` — scrape and save a product
- `/app/dashboard/collections` — collection management
- `/app/dashboard/discover` — Cartly Pro feed
- `/app/dashboard/settings` — profile, notifications, billing, and data
- `/pricing` — Free and Cartly Pro comparison
- `/share/[slug]` — public product or collection
- `/admin` — protected Discover curation

## Verification

```bash
pnpm typecheck
pnpm build
```

The scraper is server-only, rate-limited to one request per second per user and
IP, validates redirects, and rejects private-network targets. Product and
collection limits are enforced by the API when a database is connected and by
the client workspace during database-free development.
