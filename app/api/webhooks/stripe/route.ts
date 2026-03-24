import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { confirmationEmail } from '@/lib/emails/confirmation'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // updateMany with paymentStatus: 'pending' in the where clause makes this atomic —
    // a second concurrent webhook call will match 0 rows and no-op.
    await prisma.reservation.updateMany({
      where: { stripeCheckoutSessionId: session.id, paymentStatus: 'pending' },
      data: {
        paymentStatus: 'paid',
        reservationStatus: 'reserved',
        confirmationSentAt: new Date(),
        stripePaymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null,
      },
    })

    // Only proceed if confirmationSentAt was set by the updateMany above —
    // guards against double-send on Stripe webhook retry (second call finds 0 rows to update, so confirmationSentAt stays null).
    const reservation = await prisma.reservation.findFirst({
      where: { stripeCheckoutSessionId: session.id, confirmationSentAt: { not: null } },
      include: { user: true, event: true, guests: true },
    })

    if (reservation) {
      const primaryGuest = reservation.guests.find(g => g.isPrimary)
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      const manageUrl = `${baseUrl}/reservation/manage?confirmationNumber=${reservation.confirmationNumber}&email=${encodeURIComponent(reservation.user.email)}`

      const { subject, html } = confirmationEmail({
        confirmationNumber: reservation.confirmationNumber,
        eventTitle: reservation.event.title,
        eventDate: reservation.event.date,
        eventLocation: reservation.event.location,
        partySize: reservation.partySize,
        totalAmount: reservation.totalAmount,
        primaryGuestName: primaryGuest?.name ?? reservation.user.firstName ?? 'Guest',
        cancellationPolicyText: reservation.event.cancellationPolicyText,
        manageUrl,
      })

      try {
        await sendEmail(reservation.user.email, subject, html)
      } catch (err) {
        console.error(`Failed to send confirmation email to ${reservation.user.email}:`, err)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
