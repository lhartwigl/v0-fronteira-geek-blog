import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/db'
import { authenticated } from '@/lib/access'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await authenticated(request, true)
  if (session instanceof Response) return session

  try {
    const { id } = await params
    const sql = getDb()
    await sql`DELETE FROM categories WHERE id = ${Number(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
