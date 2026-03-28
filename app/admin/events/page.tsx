export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { EventActions } from '../components/EventActions'
import { EventPreviewButton } from '../components/EventPreviewButton'

const STATUS_STYLES: Record<string, string> = {
  draft: 'border border-border-strong text-fg-muted',
  published: 'bg-accent text-accent-fg',
  cancelled: 'bg-bg-subtle text-fg-muted',
  completed: 'bg-fg text-bg',
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: 'desc' },
    include: { _count: { select: { reservations: true } } },
  })

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-fg">Events</h1>
        <Link
          href="/admin/events/new"
          className="bg-fg text-bg text-xs tracking-widest uppercase px-4 py-2 transition-opacity hover:opacity-70"
        >
          New event
        </Link>
      </div>

      <div className="border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-subtle">
              <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Title</th>
              <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Date</th>
              <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Status</th>
              <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Reservations</th>
              <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id} className="border-t border-border">
                <td className="px-4 py-3 font-body"><EventPreviewButton event={event} /></td>
                <td className="px-4 py-3 text-fg-muted">
                  {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] ?? 'text-fg-muted'}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-fg-muted">{event._count.reservations}</td>
                <td className="px-4 py-3">
                  <EventActions id={event.id} status={event.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
