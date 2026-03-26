import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(event)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status !== 'draft') return NextResponse.json({ error: 'Only draft events can be edited' }, { status: 409 })

  const body = await req.json()
  const hexColor = /^#[0-9a-f]{6}$/i
  if (body.totalSeats !== undefined && (!Number.isInteger(body.totalSeats) || body.totalSeats < 1)) {
    return NextResponse.json({ error: 'totalSeats must be a positive integer' }, { status: 400 })
  }
  if (body.pricePerSeat !== undefined && (typeof body.pricePerSeat !== 'number' || body.pricePerSeat < 0)) {
    return NextResponse.json({ error: 'pricePerSeat must be a non-negative number' }, { status: 400 })
  }
  if (body.themeBgColor && !hexColor.test(body.themeBgColor)) {
    return NextResponse.json({ error: 'Invalid themeBgColor' }, { status: 400 })
  }
  if (body.themeAccentColor && !hexColor.test(body.themeAccentColor)) {
    return NextResponse.json({ error: 'Invalid themeAccentColor' }, { status: 400 })
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      title: body.title ?? event.title,
      description: body.description ?? event.description,
      date: body.date ? new Date(body.date) : event.date,
      location: body.location ?? event.location,
      pricePerSeat: body.pricePerSeat ?? event.pricePerSeat,
      totalSeats: body.totalSeats ?? event.totalSeats,
      menuImageUrl: body.menuImageUrl !== undefined ? body.menuImageUrl : event.menuImageUrl,
      tableShape: body.tableShape ?? event.tableShape,
      cancellationPolicyText: body.cancellationPolicyText ?? event.cancellationPolicyText,
      themeBgColor: body.themeBgColor ?? event.themeBgColor,
      themeAccentColor: body.themeAccentColor ?? event.themeAccentColor,
      themeHeaderImageUrl: body.themeHeaderImageUrl !== undefined ? body.themeHeaderImageUrl : event.themeHeaderImageUrl,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { _count: { select: { reservations: true } } },
  })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (event.status !== 'draft') return NextResponse.json({ error: 'Only draft events can be deleted' }, { status: 409 })
  if (event._count.reservations > 0) return NextResponse.json({ error: 'Cannot delete event with reservations' }, { status: 409 })

  await prisma.event.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
