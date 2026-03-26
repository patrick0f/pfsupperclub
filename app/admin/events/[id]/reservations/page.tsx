import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReservationTable } from '../../../components/ReservationTable'

export default async function EventReservations({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) notFound()

  const reservations = await prisma.reservation.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      guests: true,
    },
  })

  return (
    <main>
      <div>
        <h1>{event.title} — Reservations</h1>
      </div>
      <ReservationTable reservations={reservations} />
    </main>
  )
}
