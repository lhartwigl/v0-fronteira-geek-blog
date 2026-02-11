import { NextResponse, type NextRequest } from "next/server"
import { del } from "@vercel/blob"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = getDb()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 24
  const offset = (page - 1) * limit

  try {
    let media
    let countResult
    if (search) {
      media = await sql`
        SELECT id, url, filename, mimetype, size, created_at
        FROM media
        WHERE filename ILIKE ${"%" + search + "%"}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*)::int as total FROM media
        WHERE filename ILIKE ${"%" + search + "%"}
      `
    } else {
      media = await sql`
        SELECT id, url, filename, mimetype, size, created_at
        FROM media
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*)::int as total FROM media`
    }

    return NextResponse.json({
      media,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit),
    })
  } catch (error) {
    console.error("Media list error:", error)
    return NextResponse.json({ error: "Failed to list media" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id, url } = await request.json()
    if (!id || !url) {
      return NextResponse.json({ error: "Missing id or url" }, { status: 400 })
    }

    try {
      await del(url)
    } catch {
      // Continue even if blob delete fails
    }

    const sql = getDb()
    await sql`DELETE FROM media WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}
