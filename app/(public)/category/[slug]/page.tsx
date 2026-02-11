import { getDb } from "@/lib/db"
import { PostCard } from "@/components/post-card"
import { LatestSidebar } from "@/components/latest-sidebar"
import { NewsletterForm } from "@/components/newsletter-form"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sql = getDb()
  const cats = await sql`SELECT * FROM categories WHERE slug = ${slug}`
  const category = cats[0]
  if (!category) return { title: "Category Not Found" }
  return {
    title: `${category.name} News`,
    description: `Latest ${category.name} news and articles on Fronteira Geek.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const sql = getDb()

  const cats = await sql`SELECT * FROM categories WHERE slug = ${slug}`
  const category = cats[0]
  if (!category) notFound()

  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND c.slug = ${slug}
    ORDER BY p.created_at DESC
    LIMIT 24
  `

  const latest = await sql`
    SELECT id, title, slug, thumbnail_url, created_at
    FROM posts
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 8
  `

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <span className="w-1.5 h-8 bg-primary rounded-full" aria-hidden="true" />
        {category.name}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {posts.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center">No posts in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.map((post: Record<string, unknown>) => (
                <PostCard key={post.id as number} post={post as never} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-80 shrink-0 flex flex-col gap-8">
          {latest.length > 0 && <LatestSidebar posts={latest as never[]} />}
          <NewsletterForm />
        </div>
      </div>
    </div>
  )
}
