import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const postId = parseInt(id, 10)
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 })
    }

    const sql = getDb()
    await sql`UPDATE posts SET clicks = clicks + 1 WHERE id = ${postId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Click track error:", error)
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
  }
}
