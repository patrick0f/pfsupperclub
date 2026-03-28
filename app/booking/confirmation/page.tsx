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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const details = [
    { label: 'Event', value: reservation.event.title },
    { label: 'Date & time', value: `${formattedDate} · ${formattedTime}` },
    { label: 'Location', value: reservation.event.location },
    { label: 'Party size', value: String(reservation.partySize) },
    { label: 'Amount paid', value: formattedAmount },
  ]

  return (
    <>
      <GuestNav />
      <main className="max-w-sm mx-auto px-6 py-14">
        <div className="flex flex-col gap-10">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <span className="text-accent text-xl">✓</span>
            <h1 className="font-display text-3xl text-fg">You&apos;re confirmed</h1>
            <p className="text-sm text-fg-muted">A confirmation email is on its way.</p>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {details.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1 py-4 border-t border-border">
                <p className="text-xs tracking-widest uppercase text-fg-muted">{label}</p>
                <p className="text-sm text-fg">{value}</p>
              </div>
            ))}
            <div className="flex flex-col gap-1 py-4 border-t border-border">
              <p className="text-xs tracking-widest uppercase text-fg-muted">Confirmation number</p>
              <p className="font-display text-xl tracking-wider text-fg">{reservation.confirmationNumber}</p>
            </div>
          </div>

          {/* Link */}
          <Link
            href={`/reservation/manage?confirmationNumber=${reservation.confirmationNumber}&email=${session.user.email}`}
            className="text-xs tracking-widest uppercase text-fg-muted underline underline-offset-4"
          >
            Manage reservation
          </Link>
        </div>
      </main>
    </>
  )
}
