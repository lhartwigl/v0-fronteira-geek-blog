import { NextResponse, type NextRequest } from "next/server"
import { del } from "@vercel/blob"
import { authenticated } from '@/lib/access'
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

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
        WHERE filename ILIKE ${"%" + search + "%"} AND (${session.role} = 'ADMIN' OR uploaded_by = ${session.userId})
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*)::int as total FROM media
        WHERE filename ILIKE ${"%" + search + "%"} AND (${session.role} = 'ADMIN' OR uploaded_by = ${session.userId})
      `
    } else {
      media = await sql`
        SELECT id, url, filename, mimetype, size, created_at
        FROM media
        WHERE ${session.role} = 'ADMIN' OR uploaded_by = ${session.userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`SELECT COUNT(*)::int as total FROM media WHERE ${session.role} = 'ADMIN' OR uploaded_by = ${session.userId}`
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
  const session = await authenticated(request, true)
  if (session instanceof Response) return session

  try {
    const { id } = await request.json()
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Missing id or url" }, { status: 400 })
    }

    const sql = getDb()
    const removed = await sql`DELETE FROM media WHERE id = ${id} AND (${session.role} = 'ADMIN' OR uploaded_by = ${session.userId}) RETURNING url`
    if (!removed.length) return NextResponse.json({ error: 'Arquivo não encontrado ou acesso não autorizado.' }, { status: 403 })
    try {
      await del(removed[0].url)
    } catch {
      // Continue even if blob delete fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}
