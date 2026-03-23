import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  if (!session.user || session.user.profileComplete) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { firstName, lastName, phone } = await req.json()
  if (
    typeof firstName !== 'string' || firstName.trim().length === 0 || firstName.length > 100 ||
    typeof lastName !== 'string' || lastName.trim().length === 0 || lastName.length > 100 ||
    typeof phone !== 'string' || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15
  ) {
    return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { firstName, lastName, phone, profileComplete: true },
  })

  session.user.profileComplete = true
  await session.save()

  return NextResponse.json({ ok: true })
}
