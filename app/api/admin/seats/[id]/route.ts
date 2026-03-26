import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const { reservationId } = await req.json()

  const seat = await prisma.seat.findUnique({ where: { id: params.id } })
  if (!seat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (reservationId) {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } })
    if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    if (reservation.eventId !== seat.eventId) {
      return NextResponse.json({ error: 'Reservation does not belong to this event' }, { status: 400 })
    }
  }

  const updated = await prisma.seat.update({
    where: { id: params.id },
    data: { reservationId: reservationId ?? null },
  })
  return NextResponse.json(updated)
}
