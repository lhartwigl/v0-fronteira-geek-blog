import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { sameOrigin } from '@/lib/account-security.mjs'
import { consumePublicAttempt } from '@/lib/auth-throttle'
import { trafficSource } from '@/lib/traffic-source.mjs'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
  try {
    if (await getSession()) return NextResponse.json({ ignored: true })
    if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ ignored: true })
    const body = await request.json().catch(() => null)
    if (!body || typeof body.referrer !== 'string' || body.referrer.length > 4096) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    if (!await consumePublicAttempt(request, 'traffic', 60)) return NextResponse.json({ error: 'Limite temporário.' }, { status: 429 })
    const source = trafficSource(body.referrer, request.url)
    const sql = getDb()
    await sql`INSERT INTO traffic_daily (day, source, views) VALUES ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date, ${source}, 1)
      ON CONFLICT (day, source) DO UPDATE SET views = traffic_daily.views + 1`
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'Registro indisponível.' }, { status: 503 }) }
}
