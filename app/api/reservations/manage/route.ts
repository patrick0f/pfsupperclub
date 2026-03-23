import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signSeatToken } from '@/lib/seat-token'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(`manage:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const confirmationNumber = searchParams.get('confirmationNumber')
  const email = searchParams.get('email')

  if (!confirmationNumber || !email) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const reservation = await prisma.reservation.findFirst({
    where: { confirmationNumber, user: { email } },
    include: {
      event: true,
      guests: true,
      seats: { orderBy: { seatNumber: 'asc' } },
    },
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const seatToken = signSeatToken(confirmationNumber, email)

  return NextResponse.json({ ...reservation, seatToken })
}
