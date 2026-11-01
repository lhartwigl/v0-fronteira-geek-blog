import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authenticated } from '@/lib/access'
import { slugify } from '@/lib/slugify'

export async function GET(request: Request) {
  const sql = getDb()
  const categories = await sql`SELECT * FROM categories ORDER BY name`
  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const session = await authenticated(request, true)
  if (session instanceof Response) return session

  try {
    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = slugify(name)
    const sql = getDb()
    const result = await sql`
      INSERT INTO categories (name, slug) VALUES (${name}, ${slug})
      ON CONFLICT (slug) DO NOTHING
      RETURNING *
    `

    return NextResponse.json({ category: result[0] })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
