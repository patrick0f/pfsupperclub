import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

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
        stripePaymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : null,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
