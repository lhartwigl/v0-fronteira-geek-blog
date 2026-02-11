import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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
