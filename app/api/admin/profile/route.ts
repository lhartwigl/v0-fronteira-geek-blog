import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, bio, avatar_url } = await request.json()

    if (!name || name.trim().length === 0) {
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
