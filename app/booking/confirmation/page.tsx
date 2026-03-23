import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import GuestNav from '@/app/components/GuestNav'

export const dynamic = 'force-dynamic'

export default async function BookingConfirmationPage() {
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  if (!session.user || !session.confirmationNumber) redirect('/home')

  const reservation = await prisma.reservation.findUnique({
    where: { confirmationNumber: session.confirmationNumber },
    include: { event: true },
  })

  if (!reservation) redirect('/home')

  const formattedDate = new Date(reservation.event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = new Date(reservation.event.date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const formattedAmount = (reservation.totalAmount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <>
      <GuestNav />
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold mb-2">You&apos;re confirmed!</h1>
        <p className="text-gray-500 mb-8">A confirmation email is on its way.</p>

        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-gray-500">Event</p>
            <p className="font-medium">{reservation.event.title}</p>
          </div>
          <div>
            <p className="text-gray-500">Date &amp; time</p>
            <p>{formattedDate} · {formattedTime}</p>
          </div>
          <div>
            <p className="text-gray-500">Location</p>
            <p>{reservation.event.location}</p>
          </div>
          <div>
            <p className="text-gray-500">Party size</p>
            <p>{reservation.partySize}</p>
          </div>
          <div>
            <p className="text-gray-500">Amount paid</p>
            <p>{formattedAmount}</p>
          </div>
          <div>
            <p className="text-gray-500">Confirmation number</p>
            <p className="font-mono font-medium">{reservation.confirmationNumber}</p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href={`/reservation/manage?confirmationNumber=${reservation.confirmationNumber}&email=${session.user.email}`}
            className="text-sm underline"
          >
            Manage reservation
          </Link>
        </div>
      </main>
    </>
  )
}
