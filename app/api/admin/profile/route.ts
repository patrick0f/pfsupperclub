import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

function safeAdmin(admin: { id: string; email: string; name: string; phone: string | null; createdAt: Date; updatedAt: Date; passwordHash: string }) {
  return { id: admin.id, email: admin.email, name: admin.name, phone: admin.phone, createdAt: admin.createdAt, updatedAt: admin.updatedAt }
}

export async function GET() {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError
  return NextResponse.json(safeAdmin(adminOrError))
}

export async function PUT(req: NextRequest) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const body = await req.json()
  const { name, phone, currentPassword, newPassword } = body

  if (newPassword) {
    if (newPassword.length < 12) {
      return NextResponse.json({ error: 'New password must be at least 12 characters' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword ?? '', adminOrError.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (name !== undefined) data.name = name
  if (phone !== undefined) data.phone = phone
  if (newPassword) data.passwordHash = await bcrypt.hash(newPassword, 10)

  const updated = await prisma.admin.update({ where: { id: adminOrError.id }, data })
  return NextResponse.json(safeAdmin(updated))
}
