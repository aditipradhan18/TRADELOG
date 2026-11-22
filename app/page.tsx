import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui'
import MarketPanel from '@/components/hero/MarketChart'

const STEPS = [
  ['01 / LOG', 'Record it in seconds', 'Instrument, entry and exit, stop and target, session, your reason and your screenshots, all in one form.'],
  ['02 / REVIEW', 'See what the numbers say', 'P&L, win rate, R multiples, drawdown, calendar and symbol breakdowns, calculated from your own trades.'],
  ['03 / IMPROVE', 'Fix what costs you', 'Spot the mistakes and sessions that cost you money, then change them with data instead of memory.'],
]

export default async function Landing() {
  const { data: { user } } = await createClient().auth.getUser()
  return (
    <div className="min-h-screen">
      <header className="flex h-16 items-center justify-between border-b border-line px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold"><Logo />TradeLog</Link>
        <nav className="flex items-center gap-2">
          {user ? <Link href="/dashboard" className="btn btn-primary">Open dashboard</Link> : <><Link href="/login" className="btn">Sign in</Link><Link href="/signup" className="btn btn-primary">Create account</Link></>}
        </nav>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <section className="grid border border-line bg-card lg:grid-cols-[1.2fr_1fr]" aria-label="Welcome to TradeLog">
          <div className="order-2 border-t border-line lg:order-1 lg:border-r lg:border-t-0"><MarketPanel /></div>
          <div className="order-1 flex flex-col justify-center px-5 py-9 lg:order-2 lg:px-[52px] lg:py-14">
            <div className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-[.16em] text-accent2">Private trading journal</div>
            <h1 className="mb-5 text-[clamp(42px,5.4vw,72px)] font-bold uppercase leading-none tracking-tight"><span className="block">Log.</span><span className="block">Review.</span><span className="block text-accent2">Improve.</span></h1>
            <p className="mb-7 max-w-[440px] text-[15px] leading-[1.65] text-ink/75">Edge isn’t found in one winning trade. It’s built in the review: every entry, every exit, every mistake, written down, measured and learned from.</p>
            <div className="flex flex-wrap gap-2.5">
              {user ? <Link href="/dashboard" className="btn btn-primary px-[22px] py-3">Open dashboard</Link> : <><Link href="/signup" className="btn btn-primary px-[22px] py-3">Create account</Link><Link href="/login" className="btn px-[22px] py-3">Sign in</Link></>}
            </div>
            <p className="mt-7 font-mono text-[10px] font-medium uppercase leading-[1.8] tracking-[.1em] text-mute">Manual entry · Synced to your account<br />Screenshots on every trade</p>
          </div>
        </section>
        <section className="grid border border-t-0 border-line bg-card md:grid-cols-3">
          {STEPS.map(([k, t, d]) => (
            <div key={k} className="border-b border-line p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
              <b className="mb-3 block font-mono text-[11px] font-semibold tracking-[.16em] text-accent2">{k}</b>
              <h2 className="mb-2 text-[22px] font-bold tracking-wide">{t}</h2>
              <p className="text-sm leading-relaxed text-mute">{d}</p>
            </div>
          ))}
        </section>
        <footer className="flex flex-wrap justify-between gap-2 px-0.5 py-4 text-xs text-mute"><span>TradeLog · A private journal</span><span>The chart above is simulated and not market data.</span></footer>
      </main>
    </div>
  )
}
