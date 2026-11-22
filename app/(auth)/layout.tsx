import { Suspense } from 'react'
import { Logo } from '@/components/ui'
import { MarketChart } from '@/components/hero/MarketChart'

const POINTS = ['Every trade with its reasoning, mistake and screenshots', 'Automatic P&L, R multiples and risk-reward', 'Performance, calendar and history, synced on every device']

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,520px)]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-black p-12 lg:flex">
        <MarketChart className="absolute inset-0 h-full w-full opacity-35" />
        <div className="relative flex items-center gap-2.5 text-lg font-bold"><Logo />TradeLog</div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight">Track every trade.<br />Understand every decision.</h2>
          <ul className="mt-8 space-y-3 text-[15px] text-mute">
            {POINTS.map((p) => (<li key={p} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 flex-none bg-accent" />{p}</li>))}
          </ul>
        </div>
        <p className="relative text-xs text-mute">A private journal. Your data is visible only to you.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-10 flex items-center gap-2.5 text-lg font-bold lg:hidden"><Logo />TradeLog</div>
          <Suspense>{children}</Suspense>
        </div>
      </section>
    </main>
  )
}
