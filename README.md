# TradeLog

A private trading journal with real accounts. Next.js 14, TypeScript, Tailwind, Supabase (auth, Postgres, private screenshot storage). Pages: **Dashboard, Journal, Performance, History, Settings**, plus sign-up, login, forgot-password and reset-password.

## 1. Create the backend (free)

1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor**, paste the whole of `supabase/migrations/001_init.sql`, and run it. This creates the tables, row-level security (each user can only see their own data), the private `trade-images` bucket and the trigger that creates a profile at sign-up.
3. **Authentication > Providers**: email is on by default. Keep **Confirm email** on for real users, or turn it off while testing.
4. **Settings > API**: copy the **Project URL** and the **anon public key**.

## 2. Run it locally

```bash
npm install
cp .env.local.example .env.local      # then paste your URL and anon key
npm run dev                           # http://localhost:3000
npm test                              # finance unit tests
```

Open `/signup`, create an account (you enter your starting balance there), and you land on the dashboard.

## 3. Deploy (free) on Vercel

1. Push this folder to a GitHub repository.
2. Import it at <https://vercel.com/new>. Add the same two environment variables. Deploy.
3. In Supabase go to **Authentication > URL Configuration**. Set **Site URL** to your Vercel address and add `https://YOUR-APP.vercel.app/auth/callback` under **Redirect URLs** (also `http://localhost:3000/auth/callback` for local work). Without this, confirmation and password-reset links will not work.

## Things to know

- Supabase's built-in email sender is for testing and is rate limited. For real users add your own SMTP provider under **Authentication > SMTP**.
- Free Supabase projects pause after a quiet week and have no automatic backups. Export CSVs from History regularly.
- Vercel's free Hobby plan is for personal, non-commercial use.
- **Profit is typed in by you** (your broker's net figure), so every statistic matches your statement. The form shows an estimate from prices for instruments where that is reliable (gold, silver, USD-quoted and USD-base forex pairs, crypto) and says so when it cannot (GBPJPY, indices). R multiples use the price distance to your stop, so they never depend on lot or contract size. All the maths is in `lib/finance.ts` with tests in `lib/finance.test.ts`.
- The form warns before saving if the sign of your profit disagrees with the prices, or if it is far too large for your account.
- The service-role key is never used. Everything runs as the signed-in user under row-level security.

## Push to GitHub

Create an empty repository on github.com (no README), then in this folder:

```bash
git init -b main
git add .
git commit -m "TradeLog"
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

`.gitignore` already keeps `node_modules` and `.env.local` (your Supabase keys) out of the repository. Never commit `.env.local`.

## Design notes

`/` is a public landing page (log, review, improve) with an animated simulated candlestick chart (`lib/market.ts`, original canvas code, no external scripts; the data is random and labelled as simulated). The same chart sits behind the sign-in pages. Signed-in visitors see an "Open dashboard" button instead of sign-in links.

## Not built yet

Outcome-distribution and holding-time charts, a Journal tab inside History, account deletion (needs a server function with the service-role key), JSON backup/restore and import from the old prototype, edit/delete inside History, server-side pagination for very large journals.
