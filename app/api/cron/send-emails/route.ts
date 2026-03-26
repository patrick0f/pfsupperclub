import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { reminderEmail } from '@/lib/emails/reminder'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const expected = `Bearer ${process.env.CRON_SECRET}`
  const authValid =
    auth.length === expected.length &&
    timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
  if (!authValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  let sent24h = 0

  // 24h: reminder emails
  const events24h = await prisma.event.findMany({
    where: { date: { gt: now, lte: in24h }, status: 'published' },
  })

  for (const event of events24h) {
    const reservations = await prisma.reservation.findMany({
      where: {
        eventId: event.id,
        reservationStatus: 'reserved',
        paymentStatus: 'paid',
        reminderSentAt: null,
      },
      include: { user: true, guests: true },
    })

    const succeeded24hIds: string[] = []

    for (const reservation of reservations) {
      const primaryGuest = reservation.guests.find(g => g.isPrimary)

      const { subject, html } = reminderEmail({
        confirmationNumber: reservation.confirmationNumber,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        partySize: reservation.partySize,
        primaryGuestName: primaryGuest?.name ?? reservation.user.firstName ?? 'Guest',
      })

      try {
        await sendEmail(reservation.user.email, subject, html)
        succeeded24hIds.push(reservation.id)
        sent24h++
      } catch (err) {
        console.error(`Failed to send 24h email to ${reservation.user.email}:`, err)
      }
    }

    if (succeeded24hIds.length > 0) {
      await prisma.reservation.updateMany({
        where: { id: { in: succeeded24hIds } },
        data: { reminderSentAt: now },
      })
    }
  }

  return NextResponse.json({ ok: true, sent24h })
}
