import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { authenticated } from '@/lib/access'
import { readingTime } from '@/lib/format'
import { postInput } from '@/lib/post-input'
import { cleanContent } from '@/lib/content-security'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  const { id } = await params
  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ${Number(id)} AND (${session.role} = 'ADMIN' OR p.author_id = ${session.userId})
  `

  if (posts.length === 0) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json({ post: posts[0] })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const parsed = postInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Confira os campos da matéria.' }, { status: 400 })
    const body = { ...parsed.data, content: cleanContent(parsed.data.content) }
    if (session.role !== 'ADMIN' && (body.status !== 'draft' || body.featured)) return NextResponse.json({ error: 'Somente administradores podem publicar ou destacar matérias.' }, { status: 403 })
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
      WHERE id = ${Number(id)} AND (${session.role} = 'ADMIN' OR (author_id = ${session.userId} AND status = 'draft'))
      RETURNING *
    `

    if (!result.length) return NextResponse.json({ error: 'Matéria não encontrada ou edição não autorizada.' }, { status: 403 })
    return NextResponse.json({ post: result[0] })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const sql = getDb()
    const removed = await sql`DELETE FROM posts WHERE id = ${Number(id)} AND (${session.role} = 'ADMIN' OR (author_id = ${session.userId} AND status = 'draft')) RETURNING id`
    if (!removed.length) return NextResponse.json({ error: 'Matéria não encontrada ou exclusão não autorizada.' }, { status: 403 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
