/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn(), update: vi.fn() },
    seat: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { POST } from './[id]/unpublish/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindUnique = vi.mocked(prisma.event.findUnique)
const mockTransaction = vi.mocked(prisma.$transaction)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }
const PUBLISHED_EVENT = { id: 'event-1', status: 'published', _count: { reservations: 0 } }

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/events/event-1/unpublish', { method: 'POST' })
}

describe('POST /api/admin/events/[id]/unpublish', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns 409 when event is not published', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue({ ...PUBLISHED_EVENT, status: 'draft' } as any)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(409)
  })

  test('returns 409 when paid reservations exist', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue({ ...PUBLISHED_EVENT, _count: { reservations: 3 } } as any)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(409)
  })

  test('deletes seat rows and reverts to draft on success', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(PUBLISHED_EVENT as any)
    mockTransaction.mockResolvedValue([])
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(200)
    expect(mockTransaction).toHaveBeenCalledOnce()
  })
})
