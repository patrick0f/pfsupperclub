import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { confirmationEmail } from '@/lib/emails/confirmation'
import { reminderEmail } from '@/lib/emails/reminder'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const { type } = await req.json()
  if (!['confirmation', 'reminder'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      event: true,
      guests: true,
    },
  })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const primaryGuest = reservation.guests.find(g => g.isPrimary)
  const primaryGuestName = primaryGuest?.name ?? reservation.user.firstName ?? 'Guest'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  let subject: string
  let html: string

  if (type === 'confirmation') {
    const manageUrl = `${baseUrl}/reservation/manage?confirmationNumber=${reservation.confirmationNumber}&email=${encodeURIComponent(reservation.user.email)}`
    ;({ subject, html } = confirmationEmail({
      confirmationNumber: reservation.confirmationNumber,
      eventTitle: reservation.event.title,
      eventDate: reservation.event.date,
      eventLocation: reservation.event.location,
      partySize: reservation.partySize,
      totalAmount: reservation.totalAmount,
      primaryGuestName,
      cancellationPolicyText: reservation.event.cancellationPolicyText,
      manageUrl,
    }))
  } else {
    ;({ subject, html } = reminderEmail({
      confirmationNumber: reservation.confirmationNumber,
      eventTitle: reservation.event.title,
      eventDate: reservation.event.date,
      eventLocation: reservation.event.location,
      partySize: reservation.partySize,
      primaryGuestName,
    }))
  }

  try {
    await sendEmail(reservation.user.email, subject, html)
  } catch (err) {
    console.error(`Failed to resend ${type} email to ${reservation.user.email}:`, err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
