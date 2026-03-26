import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.status === 'denied') return NextResponse.json({ ok: true })

  await prisma.user.update({ where: { id: params.id }, data: { status: 'denied' } })
  return NextResponse.json({ ok: true })
}
