import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const event = await prisma.event.findFirst({
    where: { status: 'published' },
    orderBy: { date: 'asc' },
  })

  if (!event) return NextResponse.json(null)

  const seatsRemaining = await prisma.seat.count({
    where: { eventId: event.id, reservationId: null },
  })

  return NextResponse.json({ ...event, seatsRemaining })
}
