import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sameOrigin } from '@/lib/account-security.mjs'
import { getSession } from '@/lib/auth'
import { consumePublicAttempt } from '@/lib/auth-throttle'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403 })
  try {
    if (await getSession()) return NextResponse.json({ success: true, ignored: true })
    if (process.env.VERCEL_ENV !== 'production') return NextResponse.json({ success: true, ignored: true })
    const { id } = await params
    const postId = Number(id)
    if (!Number.isSafeInteger(postId) || postId < 1) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }
    if (!await consumePublicAttempt(request, 'click', 60)) return NextResponse.json({ error: 'Limite temporário.' }, { status: 429 })

    const sql = getDb()
    await sql`UPDATE posts SET clicks = clicks + 1 WHERE id = ${postId} AND status = 'published'`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Click track error:", error)
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
  }
}
