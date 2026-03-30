/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn(), update: vi.fn() },
    reservation: { findMany: vi.fn() },
  },
}))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/emails/event-cancellation', () => ({
  eventCancellationEmail: vi.fn(() => ({ subject: 'Cancelled', html: '<p>Cancelled</p>' })),
}))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { POST } from './[id]/cancel/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindUniqueEvent = vi.mocked(prisma.event.findUnique)
const mockUpdateEvent = vi.mocked(prisma.event.update)
const mockFindManyReservations = vi.mocked(prisma.reservation.findMany)
const mockSendEmail = vi.mocked(sendEmail)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }
const EVENT = { id: 'event-1', title: 'Spring Dinner', date: new Date('2026-04-15'), status: 'published' }

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/events/event-1/cancel', { method: 'POST' })
}

describe('POST /api/admin/events/[id]/cancel', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns 409 when event is already cancelled', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUniqueEvent.mockResolvedValue({ ...EVENT, status: 'cancelled' } as any)
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(409)
  })

  test('sends cancellation email only to paid reserved guests', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUniqueEvent.mockResolvedValue(EVENT as any)
    mockUpdateEvent.mockResolvedValue(EVENT as any)
    mockFindManyReservations.mockResolvedValue([
      { id: 'res-1', user: { email: 'a@example.com' } },
      { id: 'res-2', user: { email: 'b@example.com' } },
    ] as any)
    mockSendEmail.mockResolvedValue(undefined)

    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  test('one failed email does not block others', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUniqueEvent.mockResolvedValue(EVENT as any)
    mockUpdateEvent.mockResolvedValue(EVENT as any)
    mockFindManyReservations.mockResolvedValue([
      { id: 'res-1', user: { email: 'a@example.com' } },
      { id: 'res-2', user: { email: 'b@example.com' } },
    ] as any)
    mockSendEmail.mockRejectedValueOnce(new Error('Email send error')).mockResolvedValueOnce(undefined)

    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })
})
