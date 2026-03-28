import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import GuestNav from '@/app/components/GuestNav'

export const dynamic = 'force-dynamic'

export default async function PastEventsPage() {
  const events = await prisma.event.findMany({
    where: { status: 'completed' },
    orderBy: { date: 'desc' },
    select: { id: true, title: true, date: true, menuImageUrl: true },
  })

  return (
    <>
      <GuestNav />
      <main className="max-w-sm mx-auto px-6 py-14">
        <h1 className="font-display text-3xl text-fg mb-10">Past Events</h1>
        {events.length === 0 ? (
          <p className="text-sm text-fg-muted">No past events yet.</p>
        ) : (
          <ul className="flex flex-col">
            {events.map((event) => (
              <li key={event.id} className="flex gap-5 items-start border-t border-border py-5">
                {event.menuImageUrl && (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden">
                    <Image src={event.menuImageUrl} alt={event.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <p className="font-display text-xl text-fg">{event.title}</p>
                  <p className="text-xs uppercase tracking-wider text-fg-muted">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
