import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GuestNav from '@/app/components/GuestNav'
import ProfileCompleteForm from './ProfileCompleteForm'
import EventCard from './EventCard'

export default async function HomePage() {
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  if (!session.user) redirect('/')

  if (!session.user.profileComplete) {
    return (
      <>
        <GuestNav />
        <main className="flex min-h-screen items-center justify-center p-8">
          <ProfileCompleteForm />
        </main>
      </>
    )
  }

  const upcomingEvent = await prisma.event.findFirst({
    where: { status: 'published' },
    orderBy: { date: 'asc' },
  })

  let seatsRemaining = 0
  if (upcomingEvent) {
    const booked = await prisma.reservation.aggregate({
      where: { eventId: upcomingEvent.id, paymentStatus: 'paid', reservationStatus: 'reserved' },
      _sum: { partySize: true },
    })
    seatsRemaining = upcomingEvent.totalSeats - (booked._sum.partySize ?? 0)
  }

  const event = upcomingEvent ? { ...upcomingEvent, seatsRemaining } : null

  return (
    <>
      <GuestNav />
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        {event ? (
          <EventCard event={event} />
        ) : (
          <p className="text-gray-500 text-center">New events coming soon!</p>
        )}
      </main>
    </>
  )
}
