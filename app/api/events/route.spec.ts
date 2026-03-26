/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from './route'

const mockFindMany = vi.mocked(prisma.event.findMany)

const PUBLISHED = { id: 'e-1', title: 'Spring Dinner', date: new Date('2026-04-15') }
const COMPLETED = { id: 'e-2', title: 'Winter Feast', date: new Date('2025-12-01') }
const PUBLISHED_JSON = { ...PUBLISHED, date: PUBLISHED.date.toISOString() }
const COMPLETED_JSON = { ...COMPLETED, date: COMPLETED.date.toISOString() }

describe('GET /api/events', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns only published and completed events', async () => {
    mockFindMany.mockResolvedValue([PUBLISHED, COMPLETED] as any)
    const res = await GET()
    const body = await res.json()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['published', 'completed'] } },
      })
    )
    expect(body).toEqual([PUBLISHED_JSON, COMPLETED_JSON])
  })

  test('returns correct shape { id, title, date }', async () => {
    mockFindMany.mockResolvedValue([PUBLISHED] as any)
    const res = await GET()
    const body = await res.json()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, title: true, date: true },
      })
    )
    expect(body[0]).toEqual(PUBLISHED_JSON)
  })

  test('returns empty array when no matching events', async () => {
    mockFindMany.mockResolvedValue([])
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual([])
  })
})
