import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    const sql = getDb()

    let posts
    let countResult

    if (search) {
      posts = await sql`
        SELECT p.*, c.name as category_name, c.slug as category_slug,
               u.name as author_name, u.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published'
          AND (p.title ILIKE ${'%' + search + '%'} OR p.content ILIKE ${'%' + search + '%'})
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM posts
        WHERE status = 'published'
          AND (title ILIKE ${'%' + search + '%'} OR content ILIKE ${'%' + search + '%'})
      `
    } else if (category) {
      posts = await sql`
        SELECT p.*, c.name as category_name, c.slug as category_slug,
               u.name as author_name, u.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published' AND c.slug = ${category}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published' AND c.slug = ${category}
      `
    } else {
      posts = await sql`
        SELECT p.*, c.name as category_name, c.slug as category_slug,
               u.name as author_name, u.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published'
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM posts WHERE status = 'published'
      `
    }

    const total = Number(countResult[0]?.total || 0)

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Posts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
