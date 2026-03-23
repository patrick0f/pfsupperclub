import type { SessionOptions } from 'iron-session'

export type SessionUser = {
  id: string
  email: string
  profileComplete: boolean
}

export type AppSession = { user?: SessionUser; confirmationNumber?: string }

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD!,
  cookieName: 'pf_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
}
