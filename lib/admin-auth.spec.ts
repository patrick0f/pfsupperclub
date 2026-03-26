/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { admin: { findUnique: vi.fn() } } }))
vi.mock('@/lib/auth-options', () => ({ authOptions: {} }))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from './admin-auth'

const mockGetServerSession = vi.mocked(getServerSession)
const mockFindUnique = vi.mocked(prisma.admin.findUnique)

const ADMIN = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin',
  phone: null,
  passwordHash: 'hash',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('requireAdmin', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const result = await requireAdmin()
    expect(result).toBeInstanceOf(NextResponse)
    expect((result as NextResponse).status).toBe(401)
  })

  test('returns 401 when session has no adminId', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} } as any)
    const result = await requireAdmin()
    expect(result).toBeInstanceOf(NextResponse)
    expect((result as NextResponse).status).toBe(401)
  })

  test('returns 401 when admin not found in DB', async () => {
    mockGetServerSession.mockResolvedValue({ user: { adminId: 'admin-1' } } as any)
    mockFindUnique.mockResolvedValue(null)
    const result = await requireAdmin()
    expect(result).toBeInstanceOf(NextResponse)
    expect((result as NextResponse).status).toBe(401)
  })

  test('returns admin when session and DB record are valid', async () => {
    mockGetServerSession.mockResolvedValue({ user: { adminId: 'admin-1' } } as any)
    mockFindUnique.mockResolvedValue(ADMIN as any)
    const result = await requireAdmin()
    expect(result).toEqual(ADMIN)
  })
})
