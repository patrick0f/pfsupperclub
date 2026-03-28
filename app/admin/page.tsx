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
            reservations: { where: { paymentStatus: 'paid', reservationStatus: 'reserved' } },
          },
        },
        reservations: {
          where: { paymentStatus: 'paid', reservationStatus: 'reserved' },
          select: { totalAmount: true },
        },
      },
    }),
  ])

  const seatsSold = publishedEvent?._count.reservations ?? 0
  const revenue = publishedEvent?.reservations.reduce((sum, r) => sum + r.totalAmount, 0) ?? 0

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-12">
      <h1 className="font-display text-3xl text-fg">Dashboard</h1>

      {/* Pending approvals */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-widest uppercase text-fg-muted">
          Pending approvals ({waitlistedUsers.length})
        </h2>
        {waitlistedUsers.length === 0 ? (
          <p className="text-sm text-fg-muted">No pending approvals.</p>
        ) : (
          <div className="border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-subtle">
                  <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Name</th>
                  <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Email</th>
                  <th className="text-left text-xs tracking-widest uppercase text-fg-muted font-normal px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {waitlistedUsers.map(user => (
                  <DashboardApprovalRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Current event */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-widest uppercase text-fg-muted">Current Event</h2>
        {!publishedEvent ? (
          <p className="text-sm text-fg-muted">No published event.</p>
        ) : (
          <div className="border border-border p-6 flex flex-col gap-4">
            <div>
              <p className="font-display text-2xl text-fg">{publishedEvent.title}</p>
              <p className="text-xs uppercase tracking-wider text-fg-muted mt-1">
                {publishedEvent.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="font-display text-3xl text-fg">{seatsSold}</p>
                <p className="text-xs uppercase tracking-wider text-fg-muted">Reservations</p>
              </div>
              <div>
                <p className="font-display text-3xl text-fg">${(revenue / 100).toFixed(0)}</p>
                <p className="text-xs uppercase tracking-wider text-fg-muted">Revenue</p>
              </div>
            </div>
            <Link
              href={`/admin/events/${publishedEvent.id}/reservations`}
              className="text-xs tracking-widest uppercase text-accent underline-offset-4 underline"
            >
              View reservations
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
