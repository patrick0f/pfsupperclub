import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sessionOptions } from '@/lib/session'
import type { AppSession } from '@/lib/session'
import { generateConfirmationNumber } from '@/lib/confirmation-number'

type GuestInput = { name: string; allergies?: string; isPrimary: boolean }

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
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

  const seatsRemaining = await prisma.seat.count({ where: { eventId, reservationId: null } })
  if (seatsRemaining < partySize) {
    return NextResponse.json({ error: 'Not enough seats available' }, { status: 400 })
  }

  const existing = await prisma.reservation.findFirst({
    where: { userId: session.user.id, eventId, reservationStatus: 'reserved' },
  })
  if (existing) {
    return NextResponse.json({ error: 'Unable to complete reservation' }, { status: 400 })
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
      paymentStatus: 'pending',
      guests: { create: guests },
    },
  })

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

  session.confirmationNumber = confirmationNumber
  await session.save()

  return NextResponse.json({ url: checkoutSession.url })
}
