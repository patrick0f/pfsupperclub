import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const event = await prisma.event.findFirst({
    where: { status: 'published' },
    orderBy: { date: 'asc' },
  })

  if (!event) return NextResponse.json(null)

  const booked = await prisma.reservation.aggregate({
    where: { eventId: event.id, paymentStatus: 'paid', reservationStatus: 'reserved' },
    _sum: { partySize: true },
  })
  const seatsRemaining = event.totalSeats - (booked._sum.partySize ?? 0)

  return NextResponse.json({ ...event, seatsRemaining })
}
