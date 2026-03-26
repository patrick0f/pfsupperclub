import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { seatsConfirmedEmail } from '@/lib/emails/seats-confirmed'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const reservations = await prisma.reservation.findMany({
    where: { eventId: params.id, paymentStatus: 'paid', reservationStatus: 'reserved' },
    include: {
      user: true,
      guests: true,
      seats: { orderBy: { seatNumber: 'asc' } },
      event: true,
    },
  })

  const results = await Promise.allSettled(
    reservations.map(async (r) => {
      const primaryGuest = r.guests.find(g => g.isPrimary)
      const primaryGuestName = primaryGuest?.name ?? r.user.firstName ?? 'Guest'
      const { subject, html } = seatsConfirmedEmail({
        eventTitle: r.event.title,
        eventDate: r.event.date,
        eventLocation: r.event.location,
        primaryGuestName,
        seats: r.seats.map(s => ({ seatNumber: s.seatNumber })),
      })
      await sendEmail(r.user.email, subject, html)
    })
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
