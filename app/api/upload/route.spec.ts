/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, test, expect, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn() }))
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }))
vi.mock('@/lib/s3', () => ({ s3: {} }))
vi.mock('@aws-sdk/client-s3', () => ({ PutObjectCommand: vi.fn() }))

import { requireAdmin } from '@/lib/admin-auth'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { POST } from './route'

const mockRequireAdmin = vi.mocked(requireAdmin)
const mockGetSignedUrl = vi.mocked(getSignedUrl)

const ADMIN = { id: 'admin-1', email: 'admin@example.com', name: 'Admin', phone: null, passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() }

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AWS_S3_BUCKET = 'my-bucket'
    process.env.AWS_REGION = 'us-east-1'
  })

  test('returns 401 when not admin', async () => {
    mockRequireAdmin.mockResolvedValue(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.png' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  test('returns uploadUrl and s3Url with UUID-based key', async () => {
    mockRequireAdmin.mockResolvedValue(ADMIN as any)
    mockGetSignedUrl.mockResolvedValue('https://presigned.url')
    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ filename: 'menu photo.png', contentType: 'image/png' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.uploadUrl).toBe('https://presigned.url')
    expect(data.s3Url).toMatch(/^https:\/\/my-bucket\.s3\.us-east-1\.amazonaws\.com\/uploads\/[a-f0-9-]+-menu_photo\.png$/)
  })
})
