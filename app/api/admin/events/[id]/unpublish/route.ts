import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { _count: { select: { reservations: { where: { paymentStatus: 'paid' } } } } },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status !== 'published') return NextResponse.json({ error: 'Only published events can be unpublished' }, { status: 409 })
  if (event._count.reservations > 0) return NextResponse.json({ error: 'Cannot unpublish event with paid reservations' }, { status: 409 })

  await prisma.event.update({ where: { id: params.id }, data: { status: 'draft' } })

  return NextResponse.json({ ok: true })
}
