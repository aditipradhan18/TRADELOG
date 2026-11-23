'use client'
import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'
const COPY: Record<Mode, { title: string; sub: string; cta: string }> = {
  login: { title: 'Sign in to TradeLog', sub: 'Welcome back. Pick up where you left off.', cta: 'Sign in' },
  signup: { title: 'Create your account', sub: 'Your journal is private to you and syncs on every device.', cta: 'Create account' },
  forgot: { title: 'Reset your password', sub: 'We will email you a link to choose a new one.', cta: 'Send reset link' },
  reset: { title: 'Choose a new password', sub: 'Use at least 8 characters.', cta: 'Update password' },
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const params = useSearchParams()
  const sb = useMemo(() => createClient(), [])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(params.get('error') === 'link' ? 'That link is invalid or has expired. Please request a new one.' : '')
  const [ok, setOk] = useState('')
  const c = COPY[mode]

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    setErr(''); setOk(''); setBusy(true)
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email') ?? '').trim()
    const password = String(f.get('password') ?? '')
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.replace('/dashboard')
        return
      } else if (mode === 'signup') {
        const balance = Number(f.get('balance'))
        if (f.get('balance') === '' || !(balance >= 0)) throw new Error('Enter your starting account balance (0 or more).')
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${location.origin}/auth/callback`, data: { display_name: String(f.get('name') ?? '').trim(), starting_balance: balance } },
        })
        if (error) throw error
        if (data.session) {
          window.location.replace('/dashboard')
          return
        }
        setOk('Check your inbox and confirm your email to finish creating your account.')
      } else if (mode === 'forgot') {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` })
        if (error) throw error
        setOk('If that email has an account, a reset link is on its way.')
      } else {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.')
        const { error } = await sb.auth.updateUser({ password })
        if (error) throw error
        window.location.replace('/dashboard')
        return
      }
      setBusy(false)
    } catch (x) {
      setErr(x instanceof Error ? x.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mb-7 mt-1.5 text-sm text-mute">{c.sub}</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === 'signup' && (
          <div><label className="label" htmlFor="name">Name</label><input id="name" name="name" className="input" autoComplete="name" placeholder="Your name" /></div>
        )}
        {mode !== 'reset' && (
          <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" autoComplete="email" placeholder="you@example.com" /></div>
        )}
        {mode !== 'forgot' && (
          <div>
            <div className="flex items-baseline justify-between">
              <label className="label" htmlFor="password">{mode === 'reset' ? 'New password' : 'Password'}</label>
              {mode === 'login' && <Link href="/forgot-password" className="text-xs text-accent2 hover:underline">Forgot password?</Link>}
            </div>
            <input id="password" name="password" type="password" required className="input" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'} />
          </div>
        )}
        {mode === 'signup' && (
          <div>
            <label className="label" htmlFor="balance">Starting balance (USD)</label>
            <input id="balance" name="balance" type="number" min="0" step="any" required className="input font-mono" placeholder="e.g. 5000" />
            <p className="mt-1.5 text-xs text-mute">Your account size before your first logged trade. You can change it later in Settings.</p>
          </div>
        )}
        {err && <p role="alert" className="rounded-lg border border-loss/40 bg-loss/10 px-3 py-2.5 text-sm text-loss">{err}</p>}
        {ok && <p role="status" className="rounded-lg border border-profit/40 bg-profit/10 px-3 py-2.5 text-sm text-profit">{ok}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : c.cta}</button>
      </form>
      <p className="mt-6 text-center text-sm text-mute">
        {mode === 'login' && <>New to TradeLog? <Link href="/signup" className="text-accent2 hover:underline">Create an account</Link></>}
        {mode === 'signup' && <>Already have an account? <Link href="/login" className="text-accent2 hover:underline">Sign in</Link></>}
        {(mode === 'forgot' || mode === 'reset') && <Link href="/login" className="text-accent2 hover:underline">Back to sign in</Link>}
      </p>
    </div>
  )
}