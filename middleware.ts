import { getIronSession } from 'iron-session'
import { NextRequest, NextResponse } from 'next/server'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'

const PROTECTED = ['/home', '/booking/info', '/booking/confirmation', '/profile']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!PROTECTED.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const session = await getIronSession<AppSession>(req, res, sessionOptions)

  if (!session.user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/home/:path*', '/booking/:path*', '/profile/:path*'],
}
