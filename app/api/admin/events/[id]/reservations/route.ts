import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { exportReservationsCsv } from '@/lib/export-reservations-csv'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  const { searchParams } = new URL(req.url)
  if (searchParams.get('format') === 'csv') {
    const rows = reservations.map(r => {
      const primaryGuest = r.guests.find(g => g.isPrimary)
      return {
        confirmationNumber: r.confirmationNumber,
        primaryGuestName: primaryGuest?.name ?? r.user.firstName ?? 'Guest',
        email: r.user.email,
        partySize: r.partySize,
        totalAmount: r.totalAmount,
        paymentStatus: r.paymentStatus,
        reservationStatus: r.reservationStatus,
        createdAt: r.createdAt,
      }
    })
    const csv = exportReservationsCsv(rows)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reservations-${params.id}.csv"`,
      },
    })
  }

  return NextResponse.json(reservations)
}
