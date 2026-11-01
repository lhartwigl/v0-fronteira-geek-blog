import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { authenticated } from '@/lib/access'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await authenticated(request, false)
  if (session instanceof Response) return session

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'Envie uma imagem JPG, PNG, WebP, GIF ou AVIF de até 4 MB.' }, { status: 400 })
    }

    const blob = await put(`fronteira-geek/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    // Track in media table
    const sql = getDb()
    await sql`
      INSERT INTO media (url, filename, mimetype, size, uploaded_by)
      VALUES (${blob.url}, ${file.name}, ${file.type}, ${file.size}, ${session.userId})
    `

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
