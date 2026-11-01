import { NextResponse } from 'next/server'
import { bearerMatches, isSlotHour } from '@/lib/editorial-policy.mjs'
import { runEditorial } from '@/lib/editorial-run'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ slot: string }> }) {
  const headers = { 'Cache-Control': 'no-store' }
  if (!bearerMatches(request.headers.get('authorization'), process.env.CRON_SECRET)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
  if (process.env.AUTOMATION_ENABLED !== 'true') return NextResponse.json({ status: 'disabled' }, { headers })
  if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ error: 'Production only' }, { status: 403, headers })
  const { slot } = await context.params
  if (slot !== 'morning' && slot !== 'evening') return NextResponse.json({ error: 'Invalid slot' }, { status: 400, headers })
  if (!isSlotHour(slot)) return NextResponse.json({ status: 'outside_schedule' }, { status: 409, headers })
  try {
    const result = await runEditorial(slot)
    return NextResponse.json(result, { status: result.status === 'failed' ? 502 : 200, headers })
  } catch {
    return NextResponse.json({ error: 'AUTOMATION_CONFIGURATION_OR_DATABASE_ERROR' }, { status: 503, headers })
  }
}
