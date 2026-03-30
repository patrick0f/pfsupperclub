/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { updateMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'

const mockUpdateMany = vi.mocked(prisma.event.updateMany)

const CRON_SECRET = 'test-secret'

function makeRequest(token = CRON_SECRET) {
  return new NextRequest('http://localhost/api/cron/auto-complete', {
    headers: { authorization: `Bearer ${token}` },
  })
}

describe('GET /api/cron/auto-complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
  })

  test('returns 401 with invalid token', async () => {
    const res = await GET(makeRequest('wrong'))
    expect(res.status).toBe(401)
  })

  test('completes published events with past dates', async () => {
    mockUpdateMany.mockResolvedValue({ count: 2 } as any)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ ok: true, completed: 2 })

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { status: 'published', date: { lt: expect.any(Date) } },
      data: { status: 'completed' },
    })
  })

  test('returns 0 when no events need completing', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 } as any)

    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ ok: true, completed: 0 })
  })
})
