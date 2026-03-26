import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await prisma.event.findMany({
    where: { status: { in: ['published', 'completed'] } },
    select: { id: true, title: true, date: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(events)
}
