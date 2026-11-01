import { NextResponse, type NextRequest } from "next/server"
import { authenticated } from '@/lib/access'
import { getDb } from "@/lib/db"

export async function GET(request: Request) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  const sql = getDb()
  const users = await sql`
    SELECT id, name, email, avatar_url, bio, role FROM users WHERE id = ${session.userId}
  `

  if (users.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json(users[0])
}

export async function PUT(request: NextRequest) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  try {
    const { name, bio, avatar_url } = await request.json()

    if (typeof name !== 'string' || !name.trim() || name.length > 255 || (bio && (typeof bio !== 'string' || bio.length > 300)) || (avatar_url && (typeof avatar_url !== 'string' || avatar_url.length > 2048 || !avatar_url.startsWith('https://')))) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const sql = getDb()
    const updated = await sql`
      UPDATE users
      SET name = ${name.trim()}, bio = ${bio || ""}, avatar_url = ${avatar_url || ""}
      WHERE id = ${session.userId}
      RETURNING id, name, email, avatar_url, bio, role
    `

    return NextResponse.json(updated[0])
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
