'use client'
import { useState } from 'react'
import { useData } from './DataProvider'
import { Side } from './ui'
import { Thumbs } from './Thumbs'
import { fdate, fm, tone } from '@/lib/format'
import { netPnl, plannedRR, realizedR, type Trade } from '@/lib/finance'

export default function TradeCard({ t, onEdit }: { t: Trade; onEdit?: (t: Trade) => void }) {
  const { sb, reload } = useData()
  const [confirm, setConfirm] = useState(false)
  const net = netPnl(t), r = realizedR(t), rr = plannedRR(t)

  async function remove() {
    const paths = (t.trade_images ?? []).map((i) => i.storage_path)
    if (paths.length) await sb.storage.from('trade-images').remove(paths)
    await sb.from('trades').delete().eq('id', t.id)
    await reload()
  }

  return (
    <article className="card mb-3.5 overflow-hidden">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <b className="font-mono text-base">{t.instrument}</b><Side dir={t.direction} />
        <span className="rounded border border-line px-2 py-0.5 text-[11px] uppercase text-mute">{t.status}</span>
        <span className={`ml-auto font-mono text-base font-semibold ${net == null ? 'text-mute' : tone(net)}`}>{net == null ? 'Open' : fm(net)}{r != null && ` · ${r.toFixed(2)}R`}</span>
      </header>
      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-mute">
          <span>{fdate(t.exit_at ?? t.entry_at)}</span>{t.session && <span>{t.session}</span>}<span>Lots {t.quantity}</span>
          <span className="font-mono">{t.entry_price} → {t.exit_price ?? '—'}</span>{rr && <span>R:R 1:{rr.toFixed(2)}</span>}{t.mistake !== 'None' && <span>Mistake: {t.mistake}</span>}
        </div>
        {t.reason && <p className="mt-3 text-sm">{t.reason}</p>}
        {!!t.trade_images?.length && <div className="mt-3"><Thumbs images={t.trade_images} /></div>}
        {onEdit && (
          <div className="mt-4 flex items-center gap-2">
            <button className="btn" onClick={() => onEdit(t)}>Edit</button>
            {!confirm ? <button className="btn btn-danger" onClick={() => setConfirm(true)}>Delete</button> : (
              <><span className="text-sm text-mute">Delete this trade and its screenshots?</span><button className="btn btn-danger" onClick={remove}>Yes, delete</button><button className="btn" onClick={() => setConfirm(false)}>Cancel</button></>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
