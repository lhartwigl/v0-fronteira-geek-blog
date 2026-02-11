import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { readingTime } from '@/lib/format'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ${Number(id)}
  `

  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json({ post: posts[0] })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const {
      title, content, excerpt, thumbnail_url, hero_image_url,
      category_id, featured, status, meta_description, tags,
    } = body

    const rt = content ? readingTime(content) : 1
    const sql = getDb()

    const result = await sql`
      UPDATE posts SET
        title = ${title},
        content = ${content || ''},
        excerpt = ${excerpt || ''},
        thumbnail_url = ${thumbnail_url || null},
        hero_image_url = ${hero_image_url || null},
        category_id = ${category_id || null},
        featured = ${featured || false},
        status = ${status || 'draft'},
        reading_time = ${rt},
        meta_description = ${meta_description || ''},
        tags = ${tags || []},
        updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *
    `

    return NextResponse.json({ post: result[0] })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const sql = getDb()
    await sql`DELETE FROM posts WHERE id = ${Number(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
