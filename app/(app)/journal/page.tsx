'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useData } from '@/components/DataProvider'
import TradeForm from '@/components/TradeForm'
import TradeCard from '@/components/TradeCard'
import { Empty, PageHead } from '@/components/ui'
import type { Trade } from '@/lib/finance'

export default function Journal() {
  const { trades } = useData()
  const [q, setQ] = useState('')
  const [form, setForm] = useState<Trade | 'new' | null>(null)
  const list = trades.filter((t) => !q || `${t.instrument} ${t.reason ?? ''} ${t.mistake}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHead title="Journal" sub="Every trade with the reasoning and charts behind it">
        <input className="input w-60" placeholder="Search symbol, reason, mistake…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search trades" />
        <button className="btn btn-primary" onClick={() => setForm('new')}><Plus size={16} />Add trade</button>
      </PageHead>
      {list.length ? list.map((t) => <TradeCard key={t.id} t={t} onEdit={setForm} />) : (
        <div className="card"><Empty title={trades.length ? 'No trades match your search' : 'Your journal is empty'} text="Log your first trade with its reason, mistake and chart screenshots." action={!trades.length && <button className="btn btn-primary" onClick={() => setForm('new')}>Add your first trade</button>} /></div>
      )}
      {form && <TradeForm trade={form === 'new' ? undefined : form} onClose={() => setForm(null)} />}
    </>
  )
}
