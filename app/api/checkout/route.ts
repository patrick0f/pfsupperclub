import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { generateConfirmationNumber } from '@/lib/confirmation-number'
import { sendEmail } from '@/lib/email'
import { confirmationEmail } from '@/lib/emails/confirmation'

type GuestInput = { name: string; allergies?: string; isPrimary: boolean }

export async function POST(req: NextRequest) {
  const session = await getIronSession<AppSession>(await cookies(), sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { eventId, partySize, guests }: { eventId: string; partySize: number; guests: GuestInput[] } =
    await req.json()

  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 4) {
    return NextResponse.json({ error: 'Invalid party size' }, { status: 400 })
  }

  if (!Array.isArray(guests) || guests.length !== partySize) {
    return NextResponse.json({ error: 'Invalid guest data' }, { status: 400 })
  }

  const validGuests = guests.every(
    (g) => typeof g.name === 'string' && g.name.trim().length > 0 && g.name.length <= 100
  )
  if (!validGuests) {
    return NextResponse.json({ error: 'Invalid guest data' }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event || event.status !== 'published') {
    return NextResponse.json({ error: 'Event not available' }, { status: 400 })
  }

  const booked = await prisma.reservation.aggregate({
    where: { eventId, paymentStatus: 'paid', reservationStatus: 'reserved' },
    _sum: { partySize: true },
  })
  const seatsRemaining = event.totalSeats - (booked._sum.partySize ?? 0)
  if (seatsRemaining < partySize) {
    return NextResponse.json({ error: 'Not enough seats available' }, { status: 400 })
  }

  const existing = await prisma.reservation.findFirst({
    where: { userId: session.user.id, eventId, reservationStatus: 'reserved', paymentStatus: 'paid' },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have a reservation for this event' }, { status: 400 })
  }

  const pendingReservations = await prisma.reservation.findMany({
    where: { userId: session.user.id, eventId, paymentStatus: 'pending' },
    select: { id: true },
  })
  const pendingIds = pendingReservations.map(r => r.id)
  if (pendingIds.length > 0) {
    await prisma.guest.deleteMany({ where: { reservationId: { in: pendingIds } } })
    await prisma.reservation.deleteMany({ where: { id: { in: pendingIds } } })
  }

  const totalAmount = event.pricePerSeat * partySize
  const confirmationNumber = generateConfirmationNumber()

  const reservation = await prisma.reservation.create({
    data: {
      userId: session.user.id,
      eventId,
      partySize,
      totalAmount,
      confirmationNumber,
      reservationStatus: 'reserved',
      paymentStatus: totalAmount === 0 ? 'paid' : 'pending',
      confirmationSentAt: totalAmount === 0 ? new Date() : null,
      guests: { create: guests },
    },
    include: { user: true },
  })

  session.confirmationNumber = confirmationNumber
  await session.save()

  // Free event — skip Stripe, send confirmation email, redirect directly
  if (totalAmount === 0) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
    const manageUrl = `${baseUrl}/reservation/manage?confirmationNumber=${confirmationNumber}&email=${encodeURIComponent(reservation.user.email)}`
    const { subject, html } = confirmationEmail({
      confirmationNumber,
      eventTitle: event.title,
      eventDate: event.date,
      eventLocation: event.location,
      partySize,
      totalAmount: 0,
      primaryGuestName: guests.find(g => g.isPrimary)?.name ?? 'Guest',
      cancellationPolicyText: event.cancellationPolicyText,
      manageUrl,
    })
    try {
      await sendEmail(reservation.user.email, subject, html)
    } catch (err) {
      console.error(`Failed to send confirmation email:`, err)
    }
    return NextResponse.json({ url: `${baseUrl}/booking/confirmation` })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    allow_promotion_codes: true,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: event.pricePerSeat,
          product_data: { name: `${event.title} — ${partySize} seat${partySize > 1 ? 's' : ''}` },
        },
        quantity: partySize,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/confirmation`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/home`,
  })

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
