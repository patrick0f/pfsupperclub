import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const events = await prisma.event.findMany({
    orderBy: { date: 'desc' },
    include: { _count: { select: { seats: true, reservations: true } } },
  })
  return NextResponse.json(events)
}

export async function POST(req: NextRequest) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const body = await req.json()
  const hexColor = /^#[0-9a-f]{6}$/i
  if (!Number.isInteger(body.totalSeats) || body.totalSeats < 1) {
    return NextResponse.json({ error: 'totalSeats must be a positive integer' }, { status: 400 })
  }
  if (typeof body.pricePerSeat !== 'number' || body.pricePerSeat < 0) {
    return NextResponse.json({ error: 'pricePerSeat must be a non-negative number' }, { status: 400 })
  }
  if (body.themeBgColor && !hexColor.test(body.themeBgColor)) {
    return NextResponse.json({ error: 'Invalid themeBgColor' }, { status: 400 })
  }
  if (body.themeAccentColor && !hexColor.test(body.themeAccentColor)) {
    return NextResponse.json({ error: 'Invalid themeAccentColor' }, { status: 400 })
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description ?? '',
      date: new Date(body.date),
      location: body.location,
      pricePerSeat: body.pricePerSeat,
      totalSeats: body.totalSeats,
      menuImageUrl: body.menuImageUrl ?? null,
      tableShape: body.tableShape,
      cancellationPolicyText: body.cancellationPolicyText ?? '',
      themeBgColor: body.themeBgColor ?? '#ffffff',
      themeAccentColor: body.themeAccentColor ?? '#000000',
      themeHeaderImageUrl: body.themeHeaderImageUrl ?? null,
      status: 'draft',
    },
  })
  return NextResponse.json(event, { status: 201 })
}
