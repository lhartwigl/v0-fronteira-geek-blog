import { getDb } from '@/lib/db'
import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fronteirageek.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sql = getDb()

  const posts = await sql`
    SELECT slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC
  `

  const categories = await sql`
    SELECT slug FROM categories
  `

  const postUrls = posts.map((post: Record<string, unknown>) => ({
    url: `${BASE_URL}/post/${post.slug}`,
    lastModified: new Date(post.updated_at as string),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryUrls = categories.map((cat: Record<string, unknown>) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...categoryUrls,
    ...postUrls,
  ]
}
