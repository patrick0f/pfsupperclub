import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const reservations = await prisma.reservation.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      guests: true,
    },
  })

  return NextResponse.json(reservations)
}
