import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const { reservationStatus } = await req.json()
  if (!['no_show', 'cancelled'].includes(reservationStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const validTransitions: Record<string, string[]> = { reserved: ['no_show', 'cancelled'] }
  const allowed = validTransitions[reservation.reservationStatus] ?? []
  if (!allowed.includes(reservationStatus)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 })
  }

  const updated = await prisma.reservation.update({
    where: { id: params.id },
    data: { reservationStatus },
  })
  return NextResponse.json(updated)
}
