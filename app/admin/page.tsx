export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DashboardApprovalRow } from './components/DashboardApprovalRow'

export default async function AdminDashboard() {
  const [waitlistedUsers, publishedEvent] = await Promise.all([
    prisma.user.findMany({ where: { status: 'waitlisted' }, orderBy: { createdAt: 'asc' } }),
    prisma.event.findFirst({
      where: { status: 'published' },
      include: {
        _count: {
          select: {
            seats: { where: { reservationId: { not: null } } },
            reservations: { where: { paymentStatus: 'paid', reservationStatus: 'reserved' } },
          },
        },
        reservations: {
          where: { paymentStatus: 'paid', reservationStatus: 'reserved' },
          select: { totalAmount: true, seatsSelected: true },
        },
      },
    }),
  ])

  const totalSeats = publishedEvent ? await prisma.seat.count({ where: { eventId: publishedEvent.id } }) : 0
  const seatsAssigned = publishedEvent?._count.seats ?? 0
  const revenue = publishedEvent?.reservations.reduce((sum, r) => sum + r.totalAmount, 0) ?? 0
  const notSelected = publishedEvent?.reservations.filter(r => !r.seatsSelected).length ?? 0

  return (
    <main>
      <h1>Dashboard</h1>

      <section>
        <h2>Pending approvals ({waitlistedUsers.length})</h2>
        {waitlistedUsers.length === 0 ? (
          <p>No pending approvals.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {waitlistedUsers.map(user => (
                <DashboardApprovalRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Current event</h2>
        {!publishedEvent ? (
          <p>No published event.</p>
        ) : (
          <div>
            <p><strong>{publishedEvent.title}</strong> — {publishedEvent.date.toLocaleDateString()}</p>
            <p>Seats sold: {seatsAssigned} / {totalSeats}</p>
            <p>Revenue: ${(revenue / 100).toFixed(2)}</p>
            <p>Not yet selected seats: {notSelected}</p>
            <Link href={`/admin/events/${publishedEvent.id}/reservations`}>Reservations</Link>
            <Link href={`/admin/events/${publishedEvent.id}/seating`}>Seating chart</Link>
          </div>
        )}
      </section>
    </main>
  )
}
