import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const sql = getDb()

    // Check if any admin exists
    const existing = await sql`SELECT id FROM users LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 })
    }

    const { email, password, name } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    await sql`
      INSERT INTO users (email, password, name, role)
      VALUES (${email}, ${password}, ${name || 'Admin'}, 'ADMIN')
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sql = getDb()
    const existing = await sql`SELECT id FROM users LIMIT 1`
    return NextResponse.json({ hasAdmin: existing.length > 0 })
  } catch {
    return NextResponse.json({ hasAdmin: false })
  }
}
