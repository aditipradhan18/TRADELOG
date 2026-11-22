'use client'
import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import { Empty, PageHead, Side } from '@/components/ui'
import { closedTrades, exitHit, type Closed } from '@/lib/finance'
import { fm, pad, tone } from '@/lib/format'

const TABS = [['closed', 'Closed positions'], ['deals', 'Deals'], ['balance', 'Balance']] as const
const RANGES = [['today', 'Today'], ['3', 'Last 3 days'], ['7', 'Last 7 days'], ['30', 'Last 30 days'], ['365', 'Last 365 days'], ['custom', 'Custom']]
const PAGE = 15
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const daysAgo = (n: number) => ymd(new Date(Date.now() - n * 864e5))
const dt = (iso: string) => { const d = new Date(iso); return <>{ymd(d)}<br />{pad(d.getHours())}:{pad(d.getMinutes())}</> }

export default function HistoryPage() {
  const { trades, profile } = useData()
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('closed')
  const [q, setQ] = useState('')
  const [range, setRange] = useState('30')
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(ymd(new Date()))
  const [page, setPage] = useState(1)
  const start = profile?.starting_balance ?? 0
  const all = useMemo(() => closedTrades(trades), [trades])
  const rows = useMemo(() => all.filter((x) => x.day >= from && x.day <= to && x.t.instrument.toLowerCase().includes(q.toLowerCase())).reverse(), [all, from, to, q])
  const total = rows.reduce((a, x) => a + x.net, 0)

  function pick(r: string) {
    setRange(r); setPage(1)
    if (r === 'today') { setFrom(ymd(new Date())); setTo(ymd(new Date())) } else if (r !== 'custom') { setFrom(daysAgo(Number(r))); setTo(ymd(new Date())) }
  }
  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const head = ['Open Time', 'Close Time', 'Symbol', 'Side', 'Volume', 'Open Price', 'SL', 'TP', 'Close Price', 'Session', 'Mistake', 'Reason', 'Profit']
    const body = rows.map((x) => [x.t.entry_at, x.t.exit_at, x.t.instrument, x.t.direction === 'long' ? 'BUY' : 'SELL', x.t.quantity, x.t.entry_price, x.t.stop_loss, x.t.target_price, x.t.exit_price, x.t.session, x.t.mistake, x.t.reason, x.net])
    const url = URL.createObjectURL(new Blob([[head, ...body].map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `tradelog-${ymd(new Date())}.csv` })
    a.click(); URL.revokeObjectURL(url)
  }

  type Row = (string | number | JSX.Element)[]
  let head: string[] = [], data: { key: string; cells: Row; cls?: string[] }[] = []
  if (tab === 'closed') {
    head = ['Open time', 'Close time', 'Symbol', 'Side', 'Volume', 'Open price', 'SL', 'TP', 'Close price', 'Profit']
    data = rows.map((x: Closed) => { const h = exitHit(x.t); return { key: x.t.id, cells: [dt(x.t.entry_at), dt(x.t.exit_at ?? x.t.entry_at), x.t.instrument, <Side key="s" dir={x.t.direction} />, x.t.quantity, x.t.entry_price, x.t.stop_loss ?? '—', x.t.target_price ?? '—',
      <span key="c">{h && <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${h === 'SL' ? 'bg-loss/20 text-loss' : 'bg-profit/20 text-profit'}`}>{h}</span>}{x.t.exit_price}</span>, <b key="p" className={`font-semibold ${tone(x.net)}`}>{x.net.toFixed(2)}</b>],
      cls: ['', '', '', '', '', '', h === 'SL' ? 'bg-loss/10 text-loss' : '', h === 'TP' ? 'bg-profit/10 text-profit' : '', '', ''] } })
  } else if (tab === 'deals') {
    head = ['Time', 'Symbol', 'Direction', 'Type', 'Volume', 'Price', 'Profit']
    const d = rows.flatMap((x) => { const L = x.t.direction === 'long'; return [{ at: x.t.exit_at ?? x.t.entry_at, x, dir: 'out', long: !L, price: x.t.exit_price, p: x.net }, { at: x.t.entry_at, x, dir: 'in', long: L, price: x.t.entry_price, p: null as number | null }] }).sort((a, b) => (b.at < a.at ? -1 : 1))
    data = d.map((e, i) => ({ key: `${e.x.t.id}${i}`, cells: [dt(e.at), e.x.t.instrument, e.dir, <Side key="s" dir={e.long ? 'long' : 'short'} />, e.x.t.quantity, e.price ?? '—', e.p == null ? '—' : <b key="p" className={`font-semibold ${tone(e.p)}`}>{e.p.toFixed(2)}</b>] }))
  } else {
    head = ['Time', 'Description', 'Amount', 'Balance']
    let b = start
    const led = all.map((x) => { b += x.net; return { key: x.t.id, cells: [dt(x.t.exit_at ?? x.t.entry_at), `P&L · ${x.t.instrument}`, <span key="a" className={tone(x.net)}>{fm(x.net)}</span>, fm(b)] as Row } }).reverse()
    data = [...led, { key: 'start', cells: ['—', 'Initial balance', fm(start), fm(start)] }]
  }
  const pages = Math.max(1, Math.ceil(data.length / PAGE)), p = Math.min(page, pages)
  const view = data.slice((p - 1) * PAGE, p * PAGE)

  return (
    <>
      <PageHead title="Trading history" sub="Times are shown in your local time zone">
        <input className="input w-40" placeholder="Symbol…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} aria-label="Filter by symbol" />
        <div className="flex flex-wrap rounded-lg border border-line bg-card p-0.5">{RANGES.map(([k, l]) => <button key={k} onClick={() => pick(k)} className={`rounded-md px-3 py-1.5 text-[13px] transition ${range === k ? 'bg-white/15 text-ink' : 'text-mute hover:text-ink'}`}>{l}</button>)}</div>
        <input type="date" className="input w-auto" value={from} onChange={(e) => { setFrom(e.target.value); setRange('custom'); setPage(1) }} aria-label="From date" />
        <span className="text-mute">to</span>
        <input type="date" className="input w-auto" value={to} onChange={(e) => { setTo(e.target.value); setRange('custom'); setPage(1) }} aria-label="To date" />
      </PageHead>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-line bg-card p-0.5">{TABS.map(([k, l]) => <button key={k} onClick={() => { setTab(k); setPage(1) }} className={`rounded-md px-4 py-1.5 text-sm transition ${tab === k ? 'bg-white/15 text-ink' : 'text-mute hover:text-ink'}`}>{l}</button>)}</div>
        <button className="btn ml-auto" onClick={exportCsv} disabled={!rows.length}><Download size={15} />Export CSV</button>
      </div>
      <div className="card mb-4 px-5 py-4 text-mute">Period P&L: <b className={`mx-2 font-mono ${tone(total)}`}>{total.toFixed(2)}</b>({rows.length} trades)</div>
      <div className="card overflow-hidden">
        {view.length ? <div className="overflow-x-auto"><table className="w-full"><thead><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{view.map((r) => <tr key={r.key} className="hover:bg-white/[.03]">{r.cells.map((c, i) => <td key={i} className={`td ${r.cls?.[i] ?? ''}`}>{c}</td>)}</tr>)}</tbody></table></div>
          : <Empty title="Nothing here yet" text="No closed trades match these filters." />}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-mute">
        <span>Showing {data.length ? (p - 1) * PAGE + 1 : 0}–{Math.min(data.length, p * PAGE)} of {data.length}</span>
        <span className="flex items-center gap-3"><button className="btn" disabled={p <= 1} onClick={() => setPage(p - 1)}>Previous</button>{p} / {pages}<button className="btn" disabled={p >= pages} onClick={() => setPage(p + 1)}>Next</button></span>
      </div>
    </>
  )
}
