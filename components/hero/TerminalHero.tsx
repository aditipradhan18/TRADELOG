'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AsciiField } from './AsciiField'

// Approximate session hours in UTC; ignores daylight saving.
const SESSIONS: [string, number, number][] = [['SYD', 22, 7], ['ASIA', 0, 9], ['LDN', 8, 17], ['NY', 13, 22]]
const p2 = (n: number) => String(n).padStart(2, '0')

export default function TerminalHero({ count, daily, onAdd }: { count: number; daily: number[]; onAdd: () => void }) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id) }, [])
  const h = now ? now.getUTCHours() + now.getUTCMinutes() / 60 : -1
  const max = Math.max(...daily.map(Math.abs), 1)
  const btn = 'border border-white bg-transparent px-5 py-2.5 font-mono text-xs tracking-wide text-white transition hover:bg-white hover:text-black'

  return (
    <section aria-label="Journal summary" className="relative mb-4 flex min-h-[390px] flex-col overflow-hidden rounded border border-line bg-black font-mono">
      <AsciiField className="absolute inset-0 hidden h-full w-full lg:block" />
      <div className="stars absolute inset-0 opacity-30 lg:hidden" />
      {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c) => (
        <i key={c} className={`absolute z-20 h-9 w-9 border-white/30 ${c}`} />
      ))}

      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-white/15 px-5 py-2.5 text-[10px] tracking-widest text-white/55">
        <span className="flex items-center gap-3 text-white"><b className="-skew-x-12 text-[19px] italic tracking-[.2em]">TRADELOG</b><i className="h-3.5 w-px bg-white/40" />LEDGER.SYS</span>
        <span className="hidden gap-4 md:flex" title="Approximate session hours (UTC), ignoring daylight saving">
          {SESSIONS.map(([k, a, b]) => { const on = h >= 0 && (a < b ? h >= a && h < b : h >= a || h < b); return <span key={k} className={on ? 'text-accent' : ''}>{on ? '●' : '○'} {k}</span> })}
          {now && <span>UTC {p2(now.getUTCHours())}:{p2(now.getUTCMinutes())}:{p2(now.getUTCSeconds())}</span>}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-start px-5 py-7 lg:justify-end lg:pr-[6%]">
        <div className="w-full max-w-[470px]">
          <div className="flex items-center gap-2 text-[10px] text-white/55"><i className="h-px w-8 bg-white/60" />Σ<i className="h-px flex-1 bg-white/60" /></div>
          <div className="relative">
            <i className="dither absolute -right-3.5 bottom-0 top-0 hidden w-[3px] opacity-40 lg:block" />
            <h2 className="my-3.5 whitespace-nowrap text-[clamp(22px,3.3vw,42px)] font-bold leading-tight tracking-[.1em] text-white">LOG. REVIEW. IMPROVE.</h2>
          </div>
          <div className="mb-3 hidden gap-1 opacity-40 lg:flex">{Array.from({ length: 40 }).map((_, i) => <i key={i} className="h-0.5 w-0.5 bg-white" />)}</div>
          <p className="mb-5 text-[13.5px] leading-[1.7] text-gray-300/85">Edge isn’t found in one winning trade. It’s built in the review: every entry, every exit, every mistake, written down, measured and learned from.</p>
          <div className="flex flex-wrap gap-3">
            <button className={btn} onClick={onAdd}>LOG A TRADE</button>
            <Link href="/performance" className={btn}>REVIEW PERFORMANCE</Link>
          </div>
          <div className="mt-5 flex items-center gap-2 text-[9px] text-white/40"><span>Σ</span><i className="h-px flex-1 bg-white/60" /><span>LEDGER.PROTOCOL</span></div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-white/15 bg-black/45 px-5 py-2.5 text-[10px] tracking-widest text-white/55">
        <span className="flex items-center gap-3">LEDGER.SYNCED
          <span className="inline-flex h-4 items-end gap-[3px]">{(daily.length ? daily : Array(8).fill(0)).map((v, i) => <i key={i} className={`w-1 ${v >= 0 ? 'bg-profit' : 'bg-loss'}`} style={{ height: Math.max(3, Math.round((Math.abs(v) / max) * 14)) }} />)}</span>V1.0</span>
        <span className="flex items-center gap-3">{count} TRADES LOGGED<span className="inline-flex gap-1"><i className="h-1 w-1 animate-pulse bg-white" /><i className="h-1 w-1 animate-pulse bg-white/60 [animation-delay:.2s]" /><i className="h-1 w-1 animate-pulse bg-white/30 [animation-delay:.4s]" /></span></span>
      </div>
    </section>
  )
}
