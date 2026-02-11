import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { slugify } from '@/lib/slugify'
import { readingTime } from '@/lib/format'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      title, content, excerpt, thumbnail_url, hero_image_url,
      category_id, featured, status, meta_description, tags,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const slug = slugify(title) + '-' + Date.now().toString(36)
    const rt = content ? readingTime(content) : 1

    const sql = getDb()
    const result = await sql`
      INSERT INTO posts (title, slug, content, excerpt, thumbnail_url, hero_image_url, category_id, featured, status, reading_time, meta_description, tags, author_id)
      VALUES (${title}, ${slug}, ${content || ''}, ${excerpt || ''}, ${thumbnail_url || null}, ${hero_image_url || null}, ${category_id || null}, ${featured || false}, ${status || 'draft'}, ${rt}, ${meta_description || ''}, ${tags || []}, ${session.userId})
      RETURNING *
    `

    return NextResponse.json({ post: result[0] })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
