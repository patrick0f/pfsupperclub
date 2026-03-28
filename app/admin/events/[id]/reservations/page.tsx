import Link from 'next/link'
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
    <main className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/admin/events" className="text-xs tracking-widest uppercase text-fg-muted hover:text-fg transition-colors">← Events</Link>
        <div>
          <h1 className="font-display text-3xl text-fg">{event.title}</h1>
          <p className="text-xs tracking-widest uppercase text-fg-muted mt-1">
            Reservations ({reservations.length})
          </p>
        </div>
      </div>
      <ReservationTable reservations={reservations} />
    </main>
  )
}
