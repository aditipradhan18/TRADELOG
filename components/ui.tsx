import type { ReactNode } from 'react'
import { tone } from '@/lib/format'

export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
    <rect x="1" y="1" width="26" height="26" rx="3" fill="rgb(var(--accent))" />
    <path d="M7 18.5l4.5-5.5 3.5 3.5 6-8" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start gap-3">
      <div className="flex-1">
        <h1 className="text-[26px] font-semibold tracking-tight md:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] text-mute">{sub}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Stat({ label, value, sub, n, bar }: { label: string; value: ReactNode; sub?: ReactNode; n?: number; bar?: number }) {
  return (
    <div className="card min-h-[104px] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-mute">{label}</div>
      <div className={`mt-2 font-mono text-[22px] font-bold tracking-tight ${n != null ? tone(n) : ''}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-mute">{sub}</div>}
      {bar != null && <div className="mt-3 h-[5px] rounded bg-line"><div className="h-full rounded bg-profit" style={{ width: `${Math.min(100, bar)}%` }} /></div>}
    </div>
  )
}

export function Panel({ title, right, children, pad = true }: { title?: string; right?: ReactNode; children: ReactNode; pad?: boolean }) {
  return (
    <section className="card mb-4 overflow-hidden">
      {title && (
        <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <div className="ml-auto text-[13px] text-mute">{right}</div>
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export const Side = ({ dir }: { dir: 'long' | 'short' }) => (
  <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${dir === 'long' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'}`}>{dir === 'long' ? 'BUY' : 'SELL'}</span>
)

export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="text-base font-semibold">{title}</div>
      <p className="max-w-sm text-sm text-mute">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
