import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, message: 'stub' })
}

export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, message: 'stub' })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, message: 'stub' })
}
