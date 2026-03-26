import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminSeatingView } from '../../../components/AdminSeatingView'

export default async function SeatingPage({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) notFound()

  const [seats, reservations] = await Promise.all([
    prisma.seat.findMany({
      where: { eventId: params.id },
      orderBy: { seatNumber: 'asc' },
      include: { reservation: { include: { guests: true } } },
    }),
    prisma.reservation.findMany({
      where: { eventId: params.id, paymentStatus: 'paid', reservationStatus: 'reserved' },
      include: { guests: true },
    }),
  ])

  const seatsWithGuests = seats.map(seat => ({
    id: seat.id,
    seatNumber: seat.seatNumber,
    reservationId: seat.reservationId,
    guestName: seat.reservation?.guests.find(g => g.isPrimary)?.name,
  }))

  const reservationList = reservations.map(r => ({
    id: r.id,
    confirmationNumber: r.confirmationNumber,
    guestName: r.guests.find(g => g.isPrimary)?.name ?? 'Guest',
  }))

  return (
    <main>
      <h1>{event.title} — Seating</h1>
      <AdminSeatingView
        eventId={event.id}
        seats={seatsWithGuests}
        reservations={reservationList}
        tableShape={event.tableShape}
      />
    </main>
  )
}
