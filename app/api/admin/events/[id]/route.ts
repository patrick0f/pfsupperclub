import { NextResponse } from 'next/server'

export async function PUT() {
  return NextResponse.json({ ok: true, message: 'stub' })
}

export async function DELETE() {
  return NextResponse.json({ ok: true, message: 'stub' })
}
