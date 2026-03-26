import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const reservation = await prisma.reservation.findUnique({ where: { id: params.id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!reservation.stripePaymentIntentId) return NextResponse.json({ error: 'No payment intent on record' }, { status: 400 })

  // Atomically claim the refund — only one concurrent request wins
  const claimed = await prisma.reservation.updateMany({
    where: { id: params.id, paymentStatus: 'paid' },
    data: { paymentStatus: 'refunded' },
  })
  if (claimed.count === 0) return NextResponse.json({ error: 'Already refunded' }, { status: 409 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  try {
    await stripe.refunds.create({ payment_intent: reservation.stripePaymentIntentId })
  } catch (err) {
    await prisma.reservation.update({ where: { id: params.id }, data: { paymentStatus: 'paid' } })
    throw err
  }

  const updated = await prisma.reservation.findUnique({ where: { id: params.id } })
  return NextResponse.json(updated)
}
