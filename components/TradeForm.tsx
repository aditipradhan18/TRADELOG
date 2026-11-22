'use client'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useData } from './DataProvider'
import { Thumbs } from './Thumbs'
import { INSTRUMENTS, MISTAKES, SESSIONS, netPnl, plannedRR, type Direction, type Trade } from '@/lib/finance'
import { fm, toLocalInput } from '@/lib/format'

type Form = Record<'instrument' | 'direction' | 'status' | 'entry_at' | 'exit_at' | 'entry_price' | 'exit_price' | 'quantity' | 'contract_size' | 'stop_loss' | 'target_price' | 'session' | 'mistake' | 'reason', string>

const blank: Form = { instrument: 'XAUUSD', direction: 'long', status: 'closed', entry_at: '', exit_at: '', entry_price: '', exit_price: '', quantity: '', contract_size: '100', stop_loss: '', target_price: '', session: 'London', mistake: 'None', reason: '' }
const CATS = ['Before trade', 'Entry', 'Exit', 'Post-trade', 'Other']
const n = (v: string) => (v.trim() === '' ? null : Number(v))

async function toJpeg(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that image'))), 'image/jpeg', 0.85))
}

const schema = z.object({
  entry_at: z.string().min(1, 'Entry time is required'),
  entry_price: z.number({ invalid_type_error: 'Entry price is required' }).positive('Entry price must be above 0'),
  quantity: z.number({ invalid_type_error: 'Lots are required' }).positive('Lots must be above 0'),
  contract_size: z.number({ invalid_type_error: 'Contract size is required' }).positive('Contract size must be above 0'),
})

export default function TradeForm({ trade, onClose }: { trade?: Trade; onClose: () => void }) {
  const { sb, profile, reload } = useData()
  const [f, setF] = useState<Form>(trade ? {
    instrument: trade.instrument, direction: trade.direction, status: trade.status, entry_at: toLocalInput(trade.entry_at), exit_at: toLocalInput(trade.exit_at),
    entry_price: String(trade.entry_price), exit_price: trade.exit_price == null ? '' : String(trade.exit_price), quantity: String(trade.quantity), contract_size: String(trade.contract_size),
    stop_loss: trade.stop_loss == null ? '' : String(trade.stop_loss), target_price: trade.target_price == null ? '' : String(trade.target_price),
    session: trade.session ?? 'London', mistake: trade.mistake, reason: trade.reason ?? '',
  } : blank)
  const [files, setFiles] = useState<{ file: File; cat: string }[]>([])
  const [cat, setCat] = useState(CATS[0])
  const [removed, setRemoved] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [warn, setWarn] = useState('')
  const set = (k: keyof Form, v: string) => setF((p) => ({ ...p, [k]: v }))
  const ins = INSTRUMENTS.find((i) => i.symbol === f.instrument)
  const existing = (trade?.trade_images ?? []).filter((i) => !removed.includes(i.id))

  const rr = useMemo(() => {
    const e = n(f.entry_price)
    return e == null ? null : plannedRR({ direction: f.direction as Direction, entry_price: e, stop_loss: n(f.stop_loss), target_price: n(f.target_price) })
  }, [f.entry_price, f.stop_loss, f.target_price, f.direction])

  async function save(force = false) {
    setErr('')
    const parsed = schema.safeParse({ entry_at: f.entry_at, entry_price: n(f.entry_price) ?? undefined, quantity: n(f.quantity) ?? undefined, contract_size: n(f.contract_size) ?? undefined })
    if (!parsed.success) return setErr(parsed.error.issues[0].message)
    if (f.status === 'closed' && n(f.exit_price) == null) return setErr('Closed trades need an exit price.')
    const payload = {
      instrument: f.instrument, market: ins?.market ?? 'Other', direction: f.direction, status: f.status,
      entry_at: new Date(f.entry_at).toISOString(), exit_at: f.status === 'closed' ? new Date(f.exit_at || f.entry_at).toISOString() : null,
      entry_price: parsed.data.entry_price, exit_price: f.status === 'closed' ? n(f.exit_price) : null, quantity: parsed.data.quantity, contract_size: parsed.data.contract_size,
      stop_loss: n(f.stop_loss), target_price: n(f.target_price), session: f.session, mistake: f.mistake, reason: f.reason.trim() || null,
    }
    const pnl = netPnl({ ...payload, id: '', trade_images: [] } as Trade)
    if (!force && pnl != null && Math.abs(pnl) > Math.max((profile?.starting_balance ?? 0) * 10, 100000)) {
      return setWarn(`This trade shows a P&L of ${fm(pnl)}, far too large for your account. Check the prices, lots and contract size.`)
    }
    setBusy(true); setWarn('')
    try {
      const q = trade ? sb.from('trades').update(payload).eq('id', trade.id).select('id').single() : sb.from('trades').insert(payload).select('id').single()
      const { data, error } = await q
      if (error) throw error
      const { data: u } = await sb.auth.getUser()
      for (const id of removed) {
        const img = trade?.trade_images?.find((i) => i.id === id)
        if (img) await sb.storage.from('trade-images').remove([img.storage_path])
        await sb.from('trade_images').delete().eq('id', id)
      }
      for (const { file, cat: c } of files) {
        const path = `${u.user!.id}/${data.id}/${crypto.randomUUID()}.jpg`
        const up = await sb.storage.from('trade-images').upload(path, await toJpeg(file), { contentType: 'image/jpeg' })
        if (up.error) throw up.error
        const row = await sb.from('trade_images').insert({ trade_id: data.id, storage_path: path, category: c, file_name: file.name })
        if (row.error) throw row.error
      }
      await reload()
      onClose()
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Could not save the trade.')
    } finally { setBusy(false) }
  }

  const field = (label: string, k: keyof Form, type = 'text', extra: object = {}) => (
    <div><label className="label" htmlFor={k}>{label}</label><input id={k} type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} className={`input ${type === 'number' ? 'font-mono' : ''}`} {...extra} /></div>
  )
  const sel = (label: string, k: keyof Form, opts: { v: string; l: string }[]) => (
    <div><label className="label" htmlFor={k}>{label}</label><select id={k} value={f[k]} onChange={(e) => set(k, e.target.value)} className="input">{opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
  )
  const sec = (t: string) => <div className="col-span-full mt-1 border-t border-line pt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-accent2 first:mt-0 first:border-0 first:pt-0">{t}</div>

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/75 p-4" role="dialog" aria-modal="true" aria-label={trade ? 'Edit trade' : 'New trade'}>
      <div className="card w-full max-w-[720px]">
        <div className="border-b border-line px-6 py-4 text-lg font-semibold">{trade ? 'Edit trade' : 'New trade'}</div>
        <div className="grid grid-cols-1 gap-3.5 px-6 py-5 sm:grid-cols-2">
          {sec('Setup')}
          <div>
            <label className="label" htmlFor="instrument">Instrument</label>
            <select id="instrument" value={f.instrument} className="input" onChange={(e) => { set('instrument', e.target.value); const i = INSTRUMENTS.find((x) => x.symbol === e.target.value); if (i) set('contract_size', String(i.size)) }}>
              {['Metals', 'Forex', 'Crypto', 'Indices'].map((m) => <optgroup key={m} label={m}>{INSTRUMENTS.filter((i) => i.market === m).map((i) => <option key={i.symbol} value={i.symbol}>{i.label}</option>)}</optgroup>)}
            </select>
          </div>
          {sel('Direction', 'direction', [{ v: 'long', l: 'Buy' }, { v: 'short', l: 'Sell' }])}
          {sel('Status', 'status', [{ v: 'closed', l: 'Closed' }, { v: 'open', l: 'Open' }])}
          {sec('Execution')}
          {field('Entry date and time', 'entry_at', 'datetime-local')}
          {f.status === 'closed' && field('Exit date and time', 'exit_at', 'datetime-local')}
          {field('Entry price', 'entry_price', 'number', { step: 'any' })}
          {f.status === 'closed' && field('Exit price', 'exit_price', 'number', { step: 'any' })}
          {field('Lots / quantity', 'quantity', 'number', { step: 'any' })}
          {field('Contract size (units per lot)', 'contract_size', 'number', { step: 'any' })}
          {field('Stop loss', 'stop_loss', 'number', { step: 'any' })}
          {field('Target', 'target_price', 'number', { step: 'any' })}
          {sec('Context')}
          {sel('Session', 'session', SESSIONS.map((s) => ({ v: s, l: s })))}
          <div><label className="label">Risk-reward (automatic)</label><input readOnly tabIndex={-1} className="input font-mono text-mute" value={rr ? `1 : ${rr.toFixed(2)}` : f.stop_loss && f.target_price ? 'Check SL / target side' : '—'} /></div>
          {sec('Review')}
          {sel('Mistake', 'mistake', MISTAKES.map((m) => ({ v: m, l: m })))}
          <div className="sm:col-span-2"><label className="label" htmlFor="reason">Reason</label><textarea id="reason" rows={3} value={f.reason} onChange={(e) => set('reason', e.target.value)} className="input" placeholder="Why did you take this trade?" /></div>
          {sec('Screenshots')}
          <div className="col-span-full space-y-3">
            <Thumbs images={existing} onRemove={(id) => setRemoved((r) => [...r, id])} />
            {files.length > 0 && <ul className="space-y-1 text-sm text-mute">{files.map((x, i) => <li key={i} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5"><span className="truncate">{x.file.name} · {x.cat}</span><button type="button" className="text-xs hover:text-ink" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>}
            <div className="flex flex-wrap items-center gap-2">
              <select value={cat} onChange={(e) => setCat(e.target.value)} className="input w-auto">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <label className="btn cursor-pointer">+ Attach images<input type="file" accept="image/*" multiple hidden onChange={(e) => { setFiles((p) => [...p, ...Array.from(e.target.files ?? []).map((file) => ({ file, cat }))]); e.target.value = '' }} /></label>
            </div>
          </div>
        </div>
        {(err || warn) && (
          <div className="px-6 pb-2">
            {err && <p role="alert" className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2.5 text-sm text-loss">{err}</p>}
            {warn && <p role="alert" className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2.5 text-sm text-loss">{warn} <button className="underline" onClick={() => save(true)}>Save anyway</button></p>}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save()} disabled={busy}>{busy ? 'Saving…' : 'Save trade'}</button>
        </div>
      </div>
    </div>
  )
}
