import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { authenticated } from '@/lib/access'
import { slugify } from '@/lib/slugify'
import { readingTime } from '@/lib/format'
import { postInput } from '@/lib/post-input'
import { cleanContent } from '@/lib/content-security'

export async function GET(request: Request) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           u.name as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
    WHERE ${session.role} = 'ADMIN' OR p.author_id = ${session.userId}
    ORDER BY p.created_at DESC
  `
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  try {
    const parsed = postInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Confira os campos da matéria.' }, { status: 400 })
    const body = { ...parsed.data, content: cleanContent(parsed.data.content) }
    if (session.role !== 'ADMIN' && (body.status !== 'draft' || body.featured)) return NextResponse.json({ error: 'Somente administradores podem publicar ou destacar matérias.' }, { status: 403 })
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
