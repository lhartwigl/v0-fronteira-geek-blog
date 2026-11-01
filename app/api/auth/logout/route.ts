import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'
import { sameOrigin } from '@/lib/account-security.mjs'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
  await destroySession()
  return NextResponse.json({ success: true })
}
