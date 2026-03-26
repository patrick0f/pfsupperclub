import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export type AdminRow = Awaited<ReturnType<typeof prisma.admin.findUniqueOrThrow>>

export async function requireAdmin(): Promise<AdminRow | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.adminId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = await prisma.admin.findUnique({ where: { id: session.user.adminId } })
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return admin
}
