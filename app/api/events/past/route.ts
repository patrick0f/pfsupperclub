import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await prisma.event.findMany({
    where: { status: 'completed' },
    orderBy: { date: 'desc' },
    select: { id: true, title: true, date: true, menuImageUrl: true },
  })

  return NextResponse.json(events)
}
