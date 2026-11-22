import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth']

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({ request: req })
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: CookieToSet[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        res = NextResponse.next({ request: req })
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })
  const { data: { user } } = await sb.auth.getUser()
  const path = req.nextUrl.pathname
  const isPublic = path === '/' || PUBLIC.some((p) => path.startsWith(p))
  const to = (p: string) => { const u = req.nextUrl.clone(); u.pathname = p; u.search = ''; return NextResponse.redirect(u) }

  if (!user && !isPublic) return to('/login')
  if (user && (path === '/login' || path === '/signup')) return to('/dashboard')
  return res
}
