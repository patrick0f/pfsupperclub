import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { generateSeatsForEvent } from '@/lib/seat-generator'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status !== 'draft') return NextResponse.json({ error: 'Only draft events can be published' }, { status: 409 })

  const alreadyPublished = await prisma.event.findFirst({ where: { status: 'published' } })
  if (alreadyPublished) return NextResponse.json({ error: 'Another event is already published' }, { status: 409 })

  await prisma.$transaction(async (tx) => {
    await tx.event.update({ where: { id: params.id }, data: { status: 'published' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await generateSeatsForEvent(tx as any, params.id, event.totalSeats)
  })

  return NextResponse.json({ ok: true })
}
