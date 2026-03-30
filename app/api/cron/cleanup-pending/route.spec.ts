/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reservation: { findMany: vi.fn(), deleteMany: vi.fn() },
    guest: { deleteMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'

const mockFindMany = vi.mocked(prisma.reservation.findMany)
const mockDeleteReservations = vi.mocked(prisma.reservation.deleteMany)
const mockDeleteGuests = vi.mocked(prisma.guest.deleteMany)

const CRON_SECRET = 'test-secret'

function makeRequest(token = CRON_SECRET) {
  return new NextRequest('http://localhost/api/cron/cleanup-pending', {
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('GET /api/cron/cleanup-pending', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
  })

  test('returns 401 with invalid token', async () => {
    const res = await GET(makeRequest('wrong'))
    expect(res.status).toBe(401)
  })

  test('deletes stale pending reservations and their guests', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'res-1' },
      { id: 'res-2' },
    ] as any)
    mockDeleteGuests.mockResolvedValue({ count: 3 } as any)
    mockDeleteReservations.mockResolvedValue({ count: 2 } as any)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ ok: true, deleted: 2 })

    expect(mockDeleteGuests).toHaveBeenCalledWith({
      where: { reservationId: { in: ['res-1', 'res-2'] } },
    })
    expect(mockDeleteReservations).toHaveBeenCalledWith({
      where: { id: { in: ['res-1', 'res-2'] } },
    })
  })

  test('does nothing when no stale reservations exist', async () => {
    mockFindMany.mockResolvedValue([])

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ ok: true, deleted: 0 })

    expect(mockDeleteGuests).not.toHaveBeenCalled()
    expect(mockDeleteReservations).not.toHaveBeenCalled()
  })
})
