import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { seatSelectionEmail } from '@/lib/emails/seat-selection'
import { reminderEmail } from '@/lib/emails/reminder'
import { signSeatToken } from '@/lib/seat-token'

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
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''

  let sent72h = 0
  let sent24h = 0

  // 72h: seat selection emails
  const events72h = await prisma.event.findMany({
    where: { date: { gt: now, lte: in72h }, status: 'published' },
  })

  for (const event of events72h) {
    const reservations = await prisma.reservation.findMany({
      where: {
        eventId: event.id,
        reservationStatus: 'reserved',
        paymentStatus: 'paid',
        seatSelectionSentAt: null,
      },
      include: { user: true, guests: true },
    })

    const succeeded72hIds: string[] = []

    for (const reservation of reservations) {
      const primaryGuest = reservation.guests.find(g => g.isPrimary)
      const token = signSeatToken(reservation.confirmationNumber, reservation.user.email)
      const seatSelectionUrl = `${baseUrl}/seats?confirmationNumber=${reservation.confirmationNumber}&email=${encodeURIComponent(reservation.user.email)}&token=${token}`

      const { subject, html } = seatSelectionEmail({
        confirmationNumber: reservation.confirmationNumber,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        partySize: reservation.partySize,
        primaryGuestName: primaryGuest?.name ?? reservation.user.firstName ?? 'Guest',
        seatSelectionUrl,
      })

      try {
        await sendEmail(reservation.user.email, subject, html)
        succeeded72hIds.push(reservation.id)
        sent72h++
      } catch (err) {
        console.error(`Failed to send 72h email to ${reservation.user.email}:`, err)
      }
    }

    if (succeeded72hIds.length > 0) {
      await prisma.reservation.updateMany({
        where: { id: { in: succeeded72hIds } },
        data: { seatSelectionSentAt: now },
      })
    }
  }

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
      include: { user: true, guests: true, seats: { orderBy: { seatNumber: 'asc' } } },
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
        seats: reservation.seats.map(s => ({ seatNumber: s.seatNumber })),
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

  return NextResponse.json({ ok: true, sent72h, sent24h })
}
