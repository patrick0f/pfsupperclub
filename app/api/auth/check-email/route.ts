import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, join } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const admin = await prisma.admin.findUnique({ where: { email: normalizedEmail } })
  if (admin) {
    return NextResponse.json({ status: 'admin' })
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (!user) {
    if (join) {
      await prisma.user.create({ data: { email: normalizedEmail, status: 'waitlisted' } })
    }
    return NextResponse.json({ status: 'unknown' })
  }

  if (user.status === 'waitlisted') {
    return NextResponse.json({ status: 'waitlisted' })
  }

  if (user.status === 'denied') {
    if (join) {
      await prisma.user.update({ where: { id: user.id }, data: { status: 'waitlisted' } })
    }
    return NextResponse.json({ status: 'unknown' })
  }

  // approved
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  session.user = { id: user.id, email: user.email, profileComplete: user.profileComplete }
  await session.save()

  return NextResponse.json({ status: 'approved' })
}
