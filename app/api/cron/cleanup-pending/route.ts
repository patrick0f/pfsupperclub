import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STALE_MINUTES = 30

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET}`
  const authValid =
    auth.length === expected.length &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  if (!authValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000)

  const stale = await prisma.reservation.findMany({
    where: { paymentStatus: 'pending', createdAt: { lt: cutoff } },
    select: { id: true },
  })

  const staleIds = stale.map(r => r.id)

  if (staleIds.length > 0) {
    await prisma.guest.deleteMany({ where: { reservationId: { in: staleIds } } })
    await prisma.reservation.deleteMany({ where: { id: { in: staleIds } } })
  }

  return NextResponse.json({ ok: true, deleted: staleIds.length })
}
