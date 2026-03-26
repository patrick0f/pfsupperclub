/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    reservation: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}))

const { MockStripe, mockRefundsCreate } = vi.hoisted(() => {
  const mockRefundsCreate = vi.fn()
  class MockStripe {
    refunds = { create: mockRefundsCreate }
  }
  return { MockStripe, mockRefundsCreate }
})
vi.mock('stripe', () => ({ default: MockStripe }))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { POST } from './[id]/refund/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindUnique = vi.mocked(prisma.reservation.findUnique)
const mockUpdateMany = vi.mocked(prisma.reservation.updateMany)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }
const RESERVATION = {
  id: 'res-1',
  stripePaymentIntentId: 'pi_test_123',
  paymentStatus: 'paid',
}

function makeRequest() {
  return new NextRequest('http://localhost/api/admin/reservations/res-1/refund', { method: 'POST' })
}

describe('POST /api/admin/reservations/[id]/refund', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
  })

  test('returns 404 when reservation not found', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest(), { params: { id: 'res-1' } })
    expect(res.status).toBe(404)
  })

  test('returns 409 when already refunded', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue({ ...RESERVATION, paymentStatus: 'refunded' } as any)
    mockUpdateMany.mockResolvedValue({ count: 0 } as any)
    const res = await POST(makeRequest(), { params: { id: 'res-1' } })
    expect(res.status).toBe(409)
  })

  test('calls stripe.refunds.create with correct payment intent', async () => {
    const refunded = { ...RESERVATION, paymentStatus: 'refunded' }
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValueOnce(RESERVATION as any).mockResolvedValueOnce(refunded as any)
    mockUpdateMany.mockResolvedValue({ count: 1 } as any)
    mockRefundsCreate.mockResolvedValue({ id: 'ref_123' })

    const res = await POST(makeRequest(), { params: { id: 'res-1' } })
    expect(res.status).toBe(200)
    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test_123' })
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'res-1', paymentStatus: 'paid' },
      data: { paymentStatus: 'refunded' },
    })
  })
})
