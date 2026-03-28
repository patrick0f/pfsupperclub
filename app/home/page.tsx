import { redirect } from 'next/navigation'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GuestNav from '@/app/components/GuestNav'
import ProfileCompleteForm from './ProfileCompleteForm'
import EventCard from './EventCard'
import ReservationView from './ReservationView'

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

  if (!upcomingEvent) {
    return (
      <>
        <GuestNav />
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
          <p className="text-sm text-fg-muted">New events coming soon!</p>
        </main>
      </>
    )
  }

  const existingReservation = await prisma.reservation.findFirst({
    where: {
      userId: session.user.id,
      eventId: upcomingEvent.id,
      paymentStatus: 'paid',
      reservationStatus: 'reserved',
    },
    include: { guests: true },
  })

  if (existingReservation) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    return (
      <>
        <GuestNav />
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
          <ReservationView
            reservation={existingReservation}
            event={upcomingEvent}
            email={user?.email ?? ''}
          />
        </main>
      </>
    )
  }

  const booked = await prisma.reservation.aggregate({
    where: { eventId: upcomingEvent.id, paymentStatus: 'paid', reservationStatus: 'reserved' },
    _sum: { partySize: true },
  })
  const seatsRemaining = upcomingEvent.totalSeats - (booked._sum.partySize ?? 0)

  return (
    <>
      <GuestNav />
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <EventCard event={{ ...upcomingEvent, seatsRemaining }} />
      </main>
    </>
  )
}
