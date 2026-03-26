/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { reservation: { findMany: vi.fn() } },
}))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/emails/seats-confirmed', () => ({
  seatsConfirmedEmail: vi.fn(() => ({ subject: 'Seats set', html: '<p>Seats</p>' })),
}))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { POST } from '../[id]/seats/confirm-all/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindMany = vi.mocked(prisma.reservation.findMany)
const mockSendEmail = vi.mocked(sendEmail)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }

const makeReservation = (email: string) => ({
  id: `res-${email}`,
  user: { email, firstName: 'Guest' },
  guests: [{ isPrimary: true, name: 'Guest Name' }],
  seats: [{ seatNumber: 3 }],
  event: { title: 'Spring Dinner', date: new Date(), location: '123 Main St' },
})

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/events/event-1/seats/confirm-all', { method: 'POST' })
}

describe('POST /api/admin/events/[id]/seats/confirm-all', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns 401 when not admin', async () => {
    mockRequireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(401)
  })

  test('sends one email per paid reservation', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindMany.mockResolvedValue([
      makeReservation('a@example.com'),
      makeReservation('b@example.com'),
    ] as any)
    mockSendEmail.mockResolvedValue(undefined)

    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ sent: 2, failed: 0 })
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  test('partial failure returns correct sent/failed counts without throwing', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindMany.mockResolvedValue([
      makeReservation('a@example.com'),
      makeReservation('b@example.com'),
      makeReservation('c@example.com'),
    ] as any)
    mockSendEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('SES error'))
      .mockResolvedValueOnce(undefined)

    const res = await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ sent: 2, failed: 1 })
  })

  test('does not write to DB on success', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindMany.mockResolvedValue([makeReservation('a@example.com')] as any)
    mockSendEmail.mockResolvedValue(undefined)

    await POST(makeRequest(), { params: { id: 'event-1' } })
    expect(prisma.reservation.findMany).toHaveBeenCalledOnce()
    // no update/updateMany calls — prisma mock only has findMany
  })
})
