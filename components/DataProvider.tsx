'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Trade } from '@/lib/finance'

export interface Profile { id: string; display_name: string | null; starting_balance: number }
interface Ctx { sb: SupabaseClient; trades: Trade[]; profile: Profile | null; loading: boolean; error: string; reload: () => Promise<void> }
const DataCtx = createContext<Ctx>(null!)
export const useData = () => useContext(DataCtx)

const num = (v: unknown) => (v == null ? null : Number(v))

export function DataProvider({ children }: { children: React.ReactNode }) {
  const sb = useMemo(() => createClient(), [])
  const [trades, setTrades] = useState<Trade[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const [t, p] = await Promise.all([
      sb.from('trades').select('*, trade_images(*)').order('entry_at', { ascending: false }),
      sb.from('profiles').select('*').single(),
    ])
    if (t.error || p.error) setError((t.error ?? p.error)!.message)
    else {
      setError('')
      setTrades((t.data ?? []).map((r) => ({
        ...r, entry_price: Number(r.entry_price), exit_price: num(r.exit_price), quantity: Number(r.quantity), profit: num(r.profit),
        stop_loss: num(r.stop_loss), target_price: num(r.target_price),
      })) as Trade[])
      setProfile({ ...p.data, starting_balance: Number(p.data.starting_balance) })
    }
    setLoading(false)
  }, [sb])

  useEffect(() => { reload() }, [reload])
  return <DataCtx.Provider value={{ sb, trades, profile, loading, error, reload }}>{children}</DataCtx.Provider>
}
