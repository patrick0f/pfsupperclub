import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'
import { approvalEmail } from '@/lib/emails/approval'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.status === 'approved') return NextResponse.json({ error: 'User is already approved' }, { status: 409 })

  await prisma.user.update({ where: { id: params.id }, data: { status: 'approved' } })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
  const { subject, html } = approvalEmail({ baseUrl })
  try {
    await sendEmail(user.email, subject, html)
  } catch (err) {
    console.error(`Failed to send approval email to ${user.email}:`, err)
  }

  return NextResponse.json({ ok: true })
}
