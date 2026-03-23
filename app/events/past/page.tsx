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
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-8">Past Events</h1>
        {events.length === 0 ? (
          <p className="text-gray-500">No past events yet.</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {events.map((event) => (
              <li key={event.id} className="flex gap-4 items-start">
                {event.menuImageUrl && (
                  <div className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden">
                    <Image src={event.menuImageUrl} alt={event.title} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">
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
