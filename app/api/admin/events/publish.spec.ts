/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  },
}))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { POST } from './[id]/publish/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindUnique = vi.mocked(prisma.event.findUnique)
const mockFindFirst = vi.mocked(prisma.event.findFirst)
const mockUpdate = vi.mocked(prisma.event.update)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }
const DRAFT_EVENT = { id: 'event-1', title: 'Test', status: 'draft', totalSeats: 10 }

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/events/event-1/publish', { method: 'POST' })
}

describe('POST /api/admin/events/[id]/publish', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns 401 when not admin', async () => {
    mockRequireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(401)
  })

  test('returns 404 when event not found', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(404)
  })

  test('returns 409 when event is not draft', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue({ ...DRAFT_EVENT, status: 'published' } as any)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(409)
  })

  test('returns 409 when another event is already published', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(DRAFT_EVENT as any)
    mockFindFirst.mockResolvedValue({ id: 'other-event', status: 'published' } as any)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(409)
  })

  test('updates event status to published on success', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(DRAFT_EVENT as any)
    mockFindFirst.mockResolvedValue(null)
    mockUpdate.mockResolvedValue({ ...DRAFT_EVENT, status: 'published' } as any)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'event-1' }, data: { status: 'published' } })
  })
})
