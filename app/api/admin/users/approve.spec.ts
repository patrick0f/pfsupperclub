/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/emails/approval', () => ({
  approvalEmail: vi.fn(() => ({ subject: 'Approved', html: '<p>Approved</p>' })),
}))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { POST } from './[id]/approve/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindUnique = vi.mocked(prisma.user.findUnique)
const mockUpdate = vi.mocked(prisma.user.update)
const mockSendEmail = vi.mocked(sendEmail)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }
const WAITLISTED_USER = { id: 'user-1', email: 'guest@example.com', status: 'waitlisted' }

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/users/user-1/approve', { method: 'POST' })
}

describe('POST /api/admin/users/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
  })

  test('returns 401 when not admin', async () => {
    mockRequireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const res = await POST(makeRequest(), { params: { id: 'user-1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 when user not found', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest(), { params: { id: 'user-1' } })
    expect(res.status).toBe(404)
  })

  test('returns 409 when user is already approved', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue({ ...WAITLISTED_USER, status: 'approved' } as any)
    const res = await POST(makeRequest(), { params: { id: 'user-1' } })
    expect(res.status).toBe(409)
  })

  test('updates status to approved and sends approval email', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(WAITLISTED_USER as any)
    mockUpdate.mockResolvedValue({ ...WAITLISTED_USER, status: 'approved' } as any)
    mockSendEmail.mockResolvedValue(undefined)

    const res = await POST(makeRequest(), { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { status: 'approved' } })
    expect(mockSendEmail).toHaveBeenCalledWith('guest@example.com', 'Approved', '<p>Approved</p>')
  })
})
