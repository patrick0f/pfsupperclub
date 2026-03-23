import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySeatToken } from '@/lib/seat-token'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(`seats:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const { confirmationNumber, email, token, seatIds, note } = await req.json()

  if (!verifySeatToken(token, confirmationNumber, email)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const reservation = await prisma.reservation.findFirst({
    where: { confirmationNumber, user: { email }, paymentStatus: 'paid' },
    include: { event: true },
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  if (reservation.event.status !== 'published') {
    return NextResponse.json({ error: 'Event is no longer available' }, { status: 400 })
  }

  const lockCutoff = new Date(reservation.event.date.getTime() - 24 * 60 * 60 * 1000)
  if (new Date() > lockCutoff) {
    return NextResponse.json({ error: 'Seat selection is locked within 24 hours of the event' }, { status: 400 })
  }

  if (!Array.isArray(seatIds) || seatIds.length !== reservation.partySize) {
    return NextResponse.json({ error: 'Invalid seat selection' }, { status: 400 })
  }

  if (note != null && (typeof note !== 'string' || note.length > 500)) {
    return NextResponse.json({ error: 'Note must be 500 characters or fewer' }, { status: 400 })
  }

  const available = await prisma.seat.findMany({
    where: { id: { in: seatIds }, eventId: reservation.eventId, reservationId: null },
  })

  if (available.length !== seatIds.length) {
    return NextResponse.json({ error: 'One or more seats are no longer available' }, { status: 409 })
  }

  await prisma.$transaction([
    prisma.seat.updateMany({ where: { reservationId: reservation.id }, data: { reservationId: null } }),
    prisma.seat.updateMany({ where: { id: { in: seatIds } }, data: { reservationId: reservation.id } }),
    prisma.reservation.update({
      where: { id: reservation.id },
      data: { seatsSelected: true, seatNote: note ?? null },
    }),
  ])

  return NextResponse.json({ ok: true })
}
