'use client'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { DailyBars, EquityChart } from '@/components/Charts'
import { Empty, PageHead, Panel, Side, Stat } from '@/components/ui'
import { Gallery, MiniThumbs } from '@/components/Thumbs'
import { closedTrades, summarize, type Closed } from '@/lib/finance'
import { fm, pad, tone } from '@/lib/format'

const RANGES = [['7', '7D'], ['30', '30D'], ['90', '90D'], ['YTD', 'YTD'], ['ALL', 'All']]
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
type Day = { n: number; c: number }

const winDays = (days: Day[]) => (days.length ? Math.round((days.filter((d) => d.n > 0).length / days.length) * 100) : 0)
const sum = (days: Day[]) => ({ n: days.reduce((a, d) => a + d.n, 0), c: days.reduce((a, d) => a + d.c, 0) })

export default function Performance() {
  const { trades, profile } = useData()
  const all = useMemo(() => closedTrades(trades), [trades])
  const [range, setRange] = useState('30')
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const list = useMemo(() => {
    if (range === 'ALL') return all
    const from = range === 'YTD' ? `${new Date().getFullYear()}-01-01` : new Date(Date.now() - Number(range) * 864e5).toLocaleDateString('en-CA')
    return all.filter((x) => x.day >= from)
  }, [all, range])
  const s = summarize(list, profile?.starting_balance ?? 0)

  const dm = useMemo(() => {
    const m: Record<string, Day> = {}
    all.forEach((x) => { (m[x.day] ??= { n: 0, c: 0 }).n += x.net; m[x.day].c++ })
    return m
  }, [all])
  const y = month.getFullYear(), mo = month.getMonth()
  const key = (d: number) => `${y}-${pad(mo + 1)}-${pad(d)}`
  const first = (new Date(y, mo, 1).getDay() + 6) % 7
  const dim = new Date(y, mo + 1, 0).getDate()
  const today = new Date().toLocaleDateString('en-CA')
  const monthName = month.toLocaleString('en', { month: 'long' })
  const monthDays = Array.from({ length: dim }, (_, i) => dm[key(i + 1)]).filter(Boolean)

  const weeks: { a: number; b: number; days: Day[] }[] = []
  for (let st = 1; st <= dim;) {
    const e = Math.min(dim, st + 6 - ((new Date(y, mo, st).getDay() + 6) % 7))
    weeks.push({ a: st, b: e, days: Array.from({ length: e - st + 1 }, (_, i) => dm[key(st + i)]).filter(Boolean) })
    st = e + 1
  }
  const months = Array.from({ length: 12 }, (_, m) => Object.entries(dm).filter(([k]) => k.startsWith(`${y}-${pad(m + 1)}`)).map(([, v]) => v))
  const yearTotal = sum(months.flat())

  const bySymbol = Object.entries(list.reduce<Record<string, Closed[]>>((a, x) => { (a[x.t.instrument] ??= []).push(x); return a }, {}))
    .map(([k, v]) => ({ k, n: v.reduce((a, x) => a + x.net, 0), c: v.length })).sort((a, b) => Math.abs(b.n) - Math.abs(a.n))
  const maxSym = Math.max(...bySymbol.map((x) => Math.abs(x.n)), 0.01)
  const dow = DOW.map((_, i) => {
    const days = Object.entries(summarize(list, 0).daily).filter(([d]) => new Date(`${d}T00:00`).getDay() === i)
    return { n: days.length ? days.reduce((a, [, v]) => a + v, 0) / days.length : 0, c: list.filter((x) => new Date(`${x.day}T00:00`).getDay() === i).length }
  })
  const side = (d: 'long' | 'short') => { const v = list.filter((x) => x.t.direction === d); return { v, n: v.reduce((a, x) => a + x.net, 0), w: v.filter((x) => x.net > 0).length } }
  const shots = [...list].reverse().flatMap((x) => (x.t.trade_images ?? []).map((img) => ({ img, label: `${x.t.instrument} · ${fm(x.net)}` }))).slice(0, 12)
  const top = (rows: Closed[], title: string) => (
    <Panel title={title} pad={false}>
      {rows.length ? <table className="w-full"><thead><tr><th className="th">Symbol</th><th className="th">Side</th><th className="th">Vol</th><th className="th">P&L</th><th className="th">Closed</th><th className="th">Charts</th></tr></thead>
        <tbody>{rows.map((x) => <tr key={x.t.id}><td className="td">{x.t.instrument}</td><td className="td"><Side dir={x.t.direction} /></td><td className="td">{x.t.quantity}</td><td className={`td ${tone(x.net)}`}>{fm(x.net)}</td><td className="td font-sans">{x.day}</td><td className="td"><MiniThumbs images={x.t.trade_images ?? []} /></td></tr>)}</tbody></table>
        : <Empty title="No trades" text="Nothing closed in this period." />}
    </Panel>
  )

  return (
    <>
      <PageHead title="Performance" sub="Edge, risk and consistency across your closed trades">
        <div className="flex rounded-lg border border-line bg-card p-0.5">
          {RANGES.map(([k, l]) => <button key={k} onClick={() => setRange(k)} className={`rounded-md px-3.5 py-1.5 text-[13px] transition ${range === k ? 'bg-accent font-semibold text-white' : 'text-mute hover:text-ink'}`}>{l}</button>)}
        </div>
      </PageHead>
      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-6">
        <Stat label="Net P&L" value={fm(s.net)} n={s.net} sub={`gross ${fm(s.gross)}`} />
        <Stat label="Win rate" value={`${s.winRate.toFixed(1)}%`} bar={s.winRate} />
        <Stat label="Profit factor" value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} />
        <Stat label="Expectancy" value={`${fm(s.expectancy)}/trade`} n={s.expectancy} />
        <Stat label="Max drawdown" value={fm(-s.maxDrawdown)} n={-s.maxDrawdown} sub={`-${s.drawdownPct.toFixed(1)}%`} />
        <Stat label="Avg R" value={s.avgR == null ? '—' : `${s.avgR.toFixed(2)}R`} n={s.avgR ?? 0} sub={`${s.rCount} trades w/ SL`} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-6">
        <Stat label="Sharpe (ann)" value={s.sharpe == null ? '—' : s.sharpe.toFixed(2)} sub="$-based daily" />
        <Stat label="Sortino (ann)" value={s.sortino == null ? '—' : s.sortino.toFixed(2)} sub="downside-only" />
        <Stat label="Recovery factor" value={s.recovery.toFixed(2)} sub="net P&L / max DD" />
        <Stat label="Best trade" value={fm(s.best)} n={s.best} />
        <Stat label="Worst trade" value={fm(s.worst)} n={s.worst} />
        <Stat label="Trades" value={s.count} sub={`${s.wins}W · ${s.losses}L${s.breakEven ? ` · ${s.breakEven}BE` : ''}`} />
      </div>
      <Panel title="Equity curve" right="Cumulative P&L">{s.count ? <EquityChart curve={s.curve} /> : <Empty title="No closed trades" text="Nothing closed in this period." />}</Panel>

      <div className="mb-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section className="card overflow-hidden">
          <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <button aria-label="Previous month" onClick={() => setMonth(new Date(y, mo - 1, 1))} className="text-mute hover:text-ink"><ChevronLeft size={18} /></button>
            <h2 className="font-mono text-[15px] font-semibold">{monthName} {y}</h2>
            <button aria-label="Next month" onClick={() => setMonth(new Date(y, mo + 1, 1))} className="text-mute hover:text-ink"><ChevronRight size={18} /></button>
            <span className="ml-auto text-[13px] text-mute">{monthDays.length} active day{monthDays.length === 1 ? '' : 's'}</span>
          </header>
          <div className="grid grid-cols-7 gap-1 p-2 text-[13px] sm:gap-1.5 sm:p-4">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => <div key={d} className="py-1 text-center text-mute">{d}</div>)}
            {Array.from({ length: first }, (_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: dim }, (_, i) => {
              const d = dm[key(i + 1)]
              return (
                <div key={i} className={`relative min-h-[56px] rounded-md p-1 sm:min-h-[76px] sm:p-2 ${d ? (d.n > 0 ? 'bg-profit/30 text-ink' : d.n < 0 ? 'bg-[#8f3f3a] text-ink' : 'bg-el') : 'bg-el text-mute'} ${key(i + 1) === today ? 'ring-1 ring-accent' : ''}`}>
                  {i + 1}{d && <><span className="absolute right-1 top-1 text-[9px] sm:right-2 sm:top-2 sm:text-xs">{d.c}t</span><b className="absolute bottom-1 left-1 font-mono text-[9px] sm:bottom-2 sm:left-2 sm:text-[13px]">{fm(Math.round(d.n * 100) / 100)}</b></>}
                </div>
              )
            })}
          </div>
        </section>
        <Panel title="Weekly recap" right={`${monthName} ${y}`}>
          <div className="space-y-2.5">
            {weeks.map((w, i) => { const t = sum(w.days); return (
              <div key={i} className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-[13px] text-mute ${t.c ? 'border-mute/40 bg-el' : 'border-transparent bg-el/60'}`}>
                <div><div className="text-[15px] text-ink">Week {i + 1}</div>{monthName.slice(0, 3)} {w.a} – {monthName.slice(0, 3)} {w.b}</div>
                <div className="text-right">{t.c ? <><div className={`font-mono text-[15px] font-semibold ${tone(t.n)}`}>{fm(Math.round(t.n * 100) / 100)}</div>{t.c}t · {winDays(w.days)}% win days</> : 'no trades'}</div>
              </div>) })}
          </div>
        </Panel>
      </div>

      <Panel title="Monthly recap" right={<span className="flex items-center gap-3"><button aria-label="Previous year" onClick={() => setMonth(new Date(y - 1, mo, 1))}><ChevronLeft size={16} /></button><span className="font-mono text-ink">{y}</span><button aria-label="Next year" onClick={() => setMonth(new Date(y + 1, mo, 1))}><ChevronRight size={16} /></button>{fm(Math.round(yearTotal.n * 100) / 100)} · {yearTotal.c}t</span>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {months.map((ds, m) => { const t = sum(ds); return (
            <button key={m} onClick={() => setMonth(new Date(y, m, 1))} className={`rounded-lg border bg-el p-3.5 text-left text-[13px] text-mute transition hover:border-mute/50 ${m === mo ? 'border-ink/60' : 'border-transparent'}`}>
              <div className="flex justify-between text-[15px] text-ink"><span>{new Date(y, m, 1).toLocaleString('en', { month: 'long' })}</span><span className={`font-mono ${tone(t.n)}`}>{t.c ? fm(Math.round(t.n * 100) / 100) : '–'}</span></div>
              <div className="mt-1 text-right">{t.c ? `${t.c}t · ${winDays(ds)}% win days` : 'no trades'}</div>
            </button>) })}
        </div>
      </Panel>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <section className="card overflow-hidden"><header className="border-b border-line px-5 py-3.5 text-[15px] font-semibold">Daily P&L</header><div className="p-4">{s.count ? <DailyBars data={Object.entries(s.daily).sort().map(([day, v]) => ({ day, v: Math.round(v * 100) / 100 }))} /> : <Empty title="No data" text="Nothing closed in this period." />}</div></section>
        <section className="card overflow-hidden"><header className="flex border-b border-line px-5 py-3.5"><h2 className="text-[15px] font-semibold">By symbol</h2><span className="ml-auto text-[13px] text-mute">{bySymbol.length} symbols</span></header>
          <div className="space-y-2.5 p-5">{bySymbol.length ? bySymbol.map((x) => (
            <div key={x.k} className="grid grid-cols-[96px_1fr_84px_28px] items-center gap-2.5 text-[13px]"><span className="font-mono">{x.k}</span><div className="h-7 rounded bg-el"><div className={`h-full rounded ${x.n >= 0 ? 'bg-profit' : 'bg-loss'}`} style={{ width: `${(Math.abs(x.n) / maxSym) * 100}%` }} /></div><span className={`text-right font-mono ${tone(x.n)}`}>{fm(Math.round(x.n * 100) / 100)}</span><span className="text-mute">{x.c}t</span></div>)) : <Empty title="No data" text="Nothing closed in this period." />}</div></section>
        <section className="card overflow-hidden"><header className="flex border-b border-line px-5 py-3.5"><h2 className="text-[15px] font-semibold">Day of week</h2><span className="ml-auto text-[13px] text-mute">avg P&L per close-day</span></header>
          <div className="grid grid-cols-7 gap-1 p-2 sm:gap-2 sm:p-4">{dow.map((d, i) => (
            <div key={i} className={`rounded-md py-3 text-center text-xs ${d.c ? (d.n > 0 ? 'bg-profit text-bg' : d.n < 0 ? 'bg-loss text-ink' : 'bg-el') : 'bg-el text-mute'}`}><div>{DOW[i]}</div><b className="my-1 block font-mono text-[9px] sm:text-xs">{d.c ? fm(Math.round(d.n * 100) / 100) : '–'}</b>{d.c}t</div>))}</div></section>
      </div>

      <Panel title="Long vs short">
        <div className="grid gap-6 md:grid-cols-2">{(['long', 'short'] as const).map((d) => { const x = side(d); return (
          <div key={d}><div className="flex justify-between font-semibold"><span>{d === 'long' ? 'LONG' : 'SHORT'}</span><span className={`font-mono ${tone(x.n)}`}>{fm(Math.round(x.n * 100) / 100)}</span></div>
            <div className="my-2 h-[7px] rounded bg-line"><div className={`h-full rounded ${x.n >= 0 ? 'bg-profit' : 'bg-loss'}`} style={{ width: `${list.length ? (x.v.length / list.length) * 100 : 0}%` }} /></div>
            <div className="flex justify-between text-[13px] text-mute"><span>{x.v.length} trades · {list.length ? Math.round((x.v.length / list.length) * 100) : 0}%</span><span>Win rate {x.v.length ? ((x.w / x.v.length) * 100).toFixed(1) : '0.0'}%</span></div></div>) })}</div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">{top([...list].sort((a, b) => b.net - a.net).slice(0, 5), 'Top 5 winners')}{top([...list].sort((a, b) => a.net - b.net).slice(0, 5), 'Top 5 losers')}</div>
      <Panel title="Trade screenshots" right="Latest from this period">{shots.length ? <Gallery items={shots} /> : <Empty title="No screenshots" text="Attach images to your trades and they appear here." />}</Panel>
    </>
  )
}
