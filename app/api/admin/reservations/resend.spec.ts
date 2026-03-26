/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { reservation: { findUnique: vi.fn() } },
}))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/emails/confirmation', () => ({
  confirmationEmail: vi.fn(() => ({ subject: 'Confirmation', html: '<p>Confirmed</p>' })),
}))
vi.mock('@/lib/emails/reminder', () => ({
  reminderEmail: vi.fn(() => ({ subject: 'Reminder', html: '<p>Reminder</p>' })),
}))

import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { confirmationEmail } from '@/lib/emails/confirmation'
import { reminderEmail } from '@/lib/emails/reminder'
import { POST } from './[id]/resend/route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockFindUnique = vi.mocked(prisma.reservation.findUnique)
const mockSendEmail = vi.mocked(sendEmail)
const mockConfirmationEmail = vi.mocked(confirmationEmail)
const mockReminderEmail = vi.mocked(reminderEmail)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }
const RESERVATION = {
  id: 'res-1',
  confirmationNumber: 'PF-AB12CD',
  partySize: 2,
  totalAmount: 20000,
  user: { email: 'guest@example.com', firstName: 'Jane' },
  event: { title: 'Spring Dinner', date: new Date(), location: '123 Main St', cancellationPolicyText: 'No refunds' },
  guests: [{ isPrimary: true, name: 'Jane Smith' }],
  seats: [{ seatNumber: 3 }, { seatNumber: 7 }],
}

function makeRequest(type: string) {
  return new NextRequest('http://localhost/api/admin/reservations/res-1/resend', {
    method: 'POST',
    body: JSON.stringify({ type }),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/reservations/[id]/resend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
  })

  test('returns 404 when reservation not found', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(null)
    const res = await POST(makeRequest('confirmation'), { params: { id: 'res-1' } })
    expect(res.status).toBe(404)
  })

  test('returns 400 for invalid type', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    const res = await POST(makeRequest('unknown'), { params: { id: 'res-1' } })
    expect(res.status).toBe(400)
  })

  test('sends confirmation email when type is confirmation', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(RESERVATION as any)
    mockSendEmail.mockResolvedValue(undefined)

    const res = await POST(makeRequest('confirmation'), { params: { id: 'res-1' } })
    expect(res.status).toBe(200)
    expect(mockConfirmationEmail).toHaveBeenCalledOnce()
    expect(mockReminderEmail).not.toHaveBeenCalled()
    expect(mockSendEmail).toHaveBeenCalledWith('guest@example.com', 'Confirmation', '<p>Confirmed</p>')
  })

  test('sends reminder email when type is reminder', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockFindUnique.mockResolvedValue(RESERVATION as any)
    mockSendEmail.mockResolvedValue(undefined)

    const res = await POST(makeRequest('reminder'), { params: { id: 'res-1' } })
    expect(res.status).toBe(200)
    expect(mockReminderEmail).toHaveBeenCalledOnce()
    expect(mockConfirmationEmail).not.toHaveBeenCalled()
    expect(mockSendEmail).toHaveBeenCalledWith('guest@example.com', 'Reminder', '<p>Reminder</p>')
  })
})
