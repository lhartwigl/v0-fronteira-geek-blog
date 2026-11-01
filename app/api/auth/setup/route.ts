import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { bearerMatches } from '@/lib/bootstrap-security.mjs'
import { hashPassword, sameOrigin, validPassword } from '@/lib/account-security.mjs'

export async function POST(request: Request) {
  if (!sameOrigin(request) || !bearerMatches(request.headers.get('authorization'), process.env.BOOTSTRAP_ADMIN_TOKEN)) {
    return NextResponse.json({ error: 'Cadastro público indisponível.' }, { status: 403 })
  }
  try {
    const sql = getDb()

    // Check if any admin exists
    const existing = await sql`SELECT id FROM users LIMIT 1`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 })
    }

    const { email, password, name } = await request.json()
    if (typeof email !== 'string' || !email.includes('@') || !validPassword(password)) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const protectedPassword = await hashPassword(password)
    const created = await sql.transaction([sql`SELECT pg_advisory_xact_lock(719341)`, sql`
      INSERT INTO users (email, password, name, role)
      SELECT ${email.trim().toLowerCase()}, ${protectedPassword}, ${name || 'Admin'}, 'ADMIN'
      WHERE NOT EXISTS (SELECT 1 FROM users) RETURNING id
    `], { isolationLevel: 'Serializable' })
    if (!created[1].length) return NextResponse.json({ error: 'Admin already exists' }, { status: 409 })

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
    return NextResponse.json({ error: 'Banco indisponível.' }, { status: 503 })
  }
}
