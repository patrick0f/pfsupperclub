export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: 'desc' },
    include: { _count: { select: { seats: true, reservations: true } } },
  })

  return (
    <main>
      <div>
        <h1>Events</h1>
        <Link href="/admin/events/new">New event</Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Status</th>
            <th>Seats</th>
            <th>Reservations</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td>{event.title}</td>
              <td>{event.date.toLocaleDateString()}</td>
              <td>{STATUS_LABELS[event.status] ?? event.status}</td>
              <td>{event._count.seats}</td>
              <td>{event._count.reservations}</td>
              <td>
                {event.status === 'draft' && (
                  <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                )}
                {event.status !== 'cancelled' && event.status !== 'completed' && (
                  <Link href={`/admin/events/${event.id}/reservations`}>Reservations</Link>
                )}
                {event.status === 'published' && (
                  <Link href={`/admin/events/${event.id}/seating`}>Seating</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
