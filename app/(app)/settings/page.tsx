'use client'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/components/DataProvider'
import { PageHead, Panel } from '@/components/ui'

export default function Settings() {
  const { sb, profile, trades, reload } = useData()
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const [confirm, setConfirm] = useState(false)

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const bal = Number(f.get('balance'))
    if (!(bal >= 0)) return setMsg('Starting balance must be 0 or more.')
    const { error } = await sb.from('profiles').update({ display_name: String(f.get('name')).trim(), starting_balance: bal }).eq('id', profile!.id)
    setMsg(error ? error.message : 'Saved.')
    if (!error) await reload()
  }
  async function wipe() {
    const paths = trades.flatMap((t) => (t.trade_images ?? []).map((i) => i.storage_path))
    if (paths.length) await sb.storage.from('trade-images').remove(paths)
    await sb.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setConfirm(false); setMsg('All trades and screenshots deleted.'); await reload()
  }
  async function signOut() { await sb.auth.signOut(); router.replace('/login'); router.refresh() }

  return (
    <>
      <PageHead title="Settings" sub="Your profile and account" />
      <Panel title="Profile">
        <form onSubmit={save} className="grid max-w-xl gap-4 sm:grid-cols-2" key={profile?.id}>
          <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" defaultValue={profile?.display_name ?? ''} /></div>
          <div><label className="label" htmlFor="balance">Starting balance (USD)</label><input id="balance" name="balance" type="number" step="any" min="0" className="input font-mono" defaultValue={profile?.starting_balance ?? 0} /></div>
          <div className="flex items-center gap-3 sm:col-span-2"><button className="btn btn-primary">Save changes</button>{msg && <span role="status" className="text-sm text-mute">{msg}</span>}</div>
        </form>
      </Panel>
      <Panel title="Account">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn" onClick={signOut}>Sign out</button>
          {!confirm ? <button className="btn btn-danger" onClick={() => setConfirm(true)} disabled={!trades.length}>Delete all trades</button>
            : <><span className="text-sm text-mute">Delete all {trades.length} trades and screenshots? This cannot be undone.</span><button className="btn btn-danger" onClick={wipe}>Yes, delete everything</button><button className="btn" onClick={() => setConfirm(false)}>Cancel</button></>}
        </div>
      </Panel>
    </>
  )
}
