import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3 } from '@/lib/s3'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const adminOrError = await requireAdmin()
  if (adminOrError instanceof NextResponse) return adminOrError

  const { filename, contentType } = await req.json()
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const sanitized = (filename as string).replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `uploads/${randomUUID()}-${sanitized}`
  const bucket = process.env.S3_BUCKET!

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const s3Url = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

  return NextResponse.json({ uploadUrl, s3Url })
}
