'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, BookOpen, History, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { useData } from './DataProvider'
import { Logo } from './ui'
import { closedTrades, summarize } from '@/lib/finance'
import { fm, tone } from '@/lib/format'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', Icon: BookOpen },
  { href: '/performance', label: 'Performance', Icon: BarChart3 },
  { href: '/history', label: 'History', Icon: History },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { trades, profile, sb, loading, error } = useData()
  const [signingOut, setSigningOut] = useState(false)
  const closed = closedTrades(trades)
  const s = summarize(closed, profile?.starting_balance ?? 0)
  const today = new Date().toLocaleDateString('en-CA')
  const todayNet = closed.filter((x) => x.day === today).reduce((a, x) => a + x.net, 0)
  const initials = (profile?.display_name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await sb.auth.signOut({ scope: 'local' })
    } finally {
      router.replace('/login')
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-8 border-b border-line bg-bg px-4 md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 text-lg font-bold"><Logo />TradeLog</Link>
        <nav className="hidden h-full md:flex" aria-label="Primary">
          {NAV.map(({ href, label, Icon }) => {
            const on = path.startsWith(href)
            return (
              <Link key={href} href={href} aria-current={on ? 'page' : undefined}
                className={`relative flex h-full items-center gap-2 px-4 text-[15px] font-medium transition hover:text-ink ${on ? 'text-ink' : 'text-mute'}`}>
                <Icon size={16} className={on ? 'text-accent2' : 'opacity-70'} />{label}
                {on && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-5 text-[13px] text-mute">
          <span className="hidden sm:block">Today <b className={`font-mono font-medium ${tone(todayNet) || 'text-ink'}`}>{fm(todayNet)}</b></span>
          <span className="hidden sm:block">Balance <b className="font-mono font-medium text-ink">{fm(s.balance)}</b></span>
          <Link href="/settings" title="Settings" className="grid h-8 w-8 place-items-center rounded border border-line bg-el text-xs font-semibold text-ink">{initials}</Link>
          <button onClick={signOut} disabled={signingOut} title="Sign out" aria-label="Sign out" className="hidden text-mute transition hover:text-ink disabled:opacity-50 sm:block"><LogOut size={17} /></button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-6">
        {error && <p role="alert" className="mb-4 rounded-lg border border-loss/40 bg-loss/10 px-4 py-3 text-sm text-loss">Could not load your data: {error}</p>}
        {loading ? <div className="grid h-64 place-items-center text-sm text-mute">Loading your journal…</div> : children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Primary">
        {[...NAV, { href: '/settings', label: 'Settings', Icon: Settings }].map(({ href, label, Icon }) => {
          const on = path.startsWith(href)
          return (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined} className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${on ? 'text-accent2' : 'text-mute'}`}>
              <Icon size={20} />{label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}