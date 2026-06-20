# Cartly

**Save it. Track it. Buy it when it’s right.**

Cartly is a universal wishlist and price tracker built with Next.js 14, TypeScript, Tailwind CSS, Prisma, NextAuth, Stripe, Cheerio, Puppeteer, and Vercel Cron.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs in demo mode when `DATABASE_URL` is omitted. In demo mode, any valid email and password of six or more characters can sign in, and the interface uses the included sample picks.

## Connect PostgreSQL

1. Add a PostgreSQL `DATABASE_URL` to `.env.local`.
2. Run `pnpm db:push`.
3. Run `pnpm db:seed`.
4. Sign in with `demo@cartly.app` / `cartly-demo`.

For production, use migrations instead of `db:push`:

```bash
pnpm db:migrate
```

## External services

- Google OAuth: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
- Stripe: create monthly and yearly recurring prices, then set the Stripe variables from `.env.example`.
- Stripe webhooks: forward events to `/api/stripe/webhook`.
- Email: set `RESEND_API_KEY`. Without it, email events are logged as previews.
- Browser scraping: Vercel uses `@sparticuz/chromium`; local deployments can set `CHROME_EXECUTABLE_PATH`.
- Cron: set `CRON_SECRET` in both Vercel and the app environment.

## Important routes

- `/` — landing page
- `/app/dashboard` — wishlist
- `/app/dashboard/add-product` — scrape and save a product
- `/app/dashboard/collections` — collection management
- `/app/dashboard/discover` — Cartly Pro feed
- `/app/dashboard/settings` — profile, notifications, billing, and data
- `/pricing` — Free/Cartly Pro comparison and checkout
- `/share/[slug]` — public product or collection
- `/admin` — basic-auth protected Discover curation

## Verification

```bash
pnpm typecheck
pnpm build
```

The scraper is server-only, rate-limited to one request per second per user/IP, validates redirects, and rejects private-network targets. Product and collection limits are enforced in API routes as well as the UI.
