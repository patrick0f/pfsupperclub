import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const seats = await prisma.seat.findMany({
    where: { eventId: params.id },
    orderBy: { seatNumber: 'asc' },
    select: { id: true, seatNumber: true, reservationId: true },
  })

  return NextResponse.json(
    seats.map((s) => ({ id: s.id, seatNumber: s.seatNumber, isTaken: s.reservationId !== null }))
  )
}
