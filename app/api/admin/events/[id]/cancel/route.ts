import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { eventCancellationEmail } from '@/lib/emails/event-cancellation'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status === 'cancelled') return NextResponse.json({ error: 'Event is already cancelled' }, { status: 409 })

  await prisma.event.update({ where: { id: params.id }, data: { status: 'cancelled' } })

  const reservations = await prisma.reservation.findMany({
    where: { eventId: params.id, paymentStatus: 'paid', reservationStatus: 'reserved' },
    include: { user: true },
  })

  const { subject, html } = eventCancellationEmail({ eventTitle: event.title, eventDate: event.date })

  await Promise.allSettled(
    reservations.map(async (r) => {
      try {
        await sendEmail(r.user.email, subject, html)
      } catch (err) {
        console.error(`Failed to send event cancellation email to ${r.user.email}:`, err)
      }
    })
  )

  return NextResponse.json({ ok: true })
}
