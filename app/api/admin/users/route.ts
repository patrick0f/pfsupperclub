import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import type { UserStatus } from '@/app/generated/prisma/enums'

export async function GET(req: NextRequest) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') as UserStatus | null

  const users = await prisma.user.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}
