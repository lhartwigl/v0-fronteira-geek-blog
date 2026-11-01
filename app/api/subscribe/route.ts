import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { z } from 'zod'
import { sameOrigin } from '@/lib/account-security.mjs'
import { consumePublicAttempt } from '@/lib/auth-throttle'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
  try {
    const parsed = z.object({ email: z.string().trim().email().max(255).transform(value => value.toLowerCase()) }).safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const { email } = parsed.data
    if (!await consumePublicAttempt(request, 'subscribe', 5)) return NextResponse.json({ error: 'Aguarde alguns minutos para tentar novamente.' }, { status: 429, headers: { 'Retry-After': '900' } })

    const sql = getDb()
    await sql`INSERT INTO subscribers (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}
