'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import TradeForm from '@/components/TradeForm'
import { EquityChart } from '@/components/Charts'
import { Empty, PageHead, Panel, Side, Stat } from '@/components/ui'
import { closedTrades, netPnl, plannedRR, summarize } from '@/lib/finance'
import { fm, tone } from '@/lib/format'

export default function Dashboard() {
  const { trades, profile } = useData()
  const [add, setAdd] = useState(false)
  const s = summarize(closedTrades(trades), profile?.starting_balance ?? 0)
  const open = trades.filter((t) => t.status === 'open').length
  const recent = trades.slice(0, 6)
  const day = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <>
      <PageHead title="Dashboard" sub={day}><button className="btn btn-primary" onClick={() => setAdd(true)}><Plus size={16} />Add trade</button></PageHead>
      <div className="mb-4 grid grid-cols-2 gap-3.5 lg:grid-cols-6">
        <Stat label="Balance" value={fm(s.balance)} sub={`Start ${fm(profile?.starting_balance ?? 0)}`} />
        <Stat label="Net P&L" value={fm(s.net)} n={s.net} sub={`${s.count} closed trades`} />
        <Stat label="Win rate" value={`${s.winRate.toFixed(1)}%`} sub={`${s.wins}W · ${s.losses}L${s.breakEven ? ` · ${s.breakEven}BE` : ''}`} bar={s.winRate} />
        <Stat label="Profit factor" value={s.profitFactor === Infinity ? '∞' : s.profitFactor.toFixed(2)} sub="Gross wins / losses" />
        <Stat label="Avg R" value={s.avgR == null ? '—' : `${s.avgR.toFixed(2)}R`} n={s.avgR ?? 0} sub={`${s.rCount} trades with SL`} />
        <Stat label="Open trades" value={open} sub="Not in realized P&L" />
      </div>
      <Panel title="Equity curve" right="Cumulative P&L · closed trades">{s.count ? <EquityChart curve={s.curve} /> : <Empty title="Nothing to chart yet" text="Close a trade and your equity curve appears here." />}</Panel>
      <Panel title="Recent trades" pad={false}>
        {recent.length ? (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Date</th><th className="th">Symbol</th><th className="th">Side</th><th className="th">Session</th><th className="th">Lots</th><th className="th">R:R</th><th className="th">P&L</th></tr></thead>
            <tbody>{recent.map((t) => { const n = netPnl(t), rr = plannedRR(t); return (
              <tr key={t.id}><td className="td">{new Date(t.entry_at).toLocaleDateString('en-CA')}</td><td className="td">{t.instrument}</td><td className="td"><Side dir={t.direction} /></td><td className="td font-sans">{t.session ?? '—'}</td><td className="td">{t.quantity}</td><td className="td">{rr ? `1:${rr.toFixed(2)}` : '—'}</td><td className={`td ${n == null ? 'text-mute' : tone(n)}`}>{n == null ? 'Open' : fm(n)}</td></tr>) })}</tbody></table></div>
        ) : <Empty title="No trades yet" text="Add a trade and your stats will appear here." action={<button className="btn btn-primary" onClick={() => setAdd(true)}>Add trade</button>} />}
      </Panel>
      {add && <TradeForm onClose={() => setAdd(false)} />}
    </>
  )
}
