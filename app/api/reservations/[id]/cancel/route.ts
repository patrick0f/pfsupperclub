import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email'
import { cancellationEmail } from '@/lib/emails/cancellation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(`cancel:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const confirmationNumber = searchParams.get('confirmationNumber')
  const email = searchParams.get('email')

  if (!confirmationNumber || !email) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const reservation = await prisma.reservation.findFirst({
    where: { id: params.id, confirmationNumber, user: { email } },
    include: { event: true, user: true },
  })

  if (!reservation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const lockCutoff = new Date(reservation.event.date.getTime() - 72 * 60 * 60 * 1000)
  if (new Date() > lockCutoff) {
    return NextResponse.json({ error: 'Cancellations are locked within 72 hours of the event' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.seat.updateMany({ where: { reservationId: reservation.id }, data: { reservationId: null } }),
    prisma.reservation.update({ where: { id: reservation.id }, data: { reservationStatus: 'cancelled' } }),
  ])

  const { subject, html } = cancellationEmail({
    confirmationNumber: reservation.confirmationNumber,
    eventTitle: reservation.event.title,
    eventDate: reservation.event.date,
    userEmail: reservation.user.email,
  })
  try {
    await sendEmail(reservation.user.email, subject, html)
  } catch (err) {
    console.error(`Failed to send cancellation email to ${reservation.user.email}:`, err)
  }

  return NextResponse.json({ ok: true })
}
