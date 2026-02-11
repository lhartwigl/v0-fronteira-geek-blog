import { getDb } from "@/lib/db"
import { HeroPost } from "@/components/hero-post"
import { PostCard } from "@/components/post-card"
import { LatestSidebar } from "@/components/latest-sidebar"
import { NewsletterForm } from "@/components/newsletter-form"

export const dynamic = "force-dynamic"

async function getFeaturedPost() {
  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published' AND p.featured = true
    ORDER BY p.created_at DESC
    LIMIT 1
  `
  return posts[0] || null
}

async function getRecentPosts(excludeId?: number) {
  const sql = getDb()
  if (excludeId) {
    return sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'published' AND p.id != ${excludeId}
      ORDER BY p.created_at DESC
      LIMIT 12
    `
  }
  return sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
    ORDER BY p.created_at DESC
    LIMIT 12
  `
}

async function getLatestPosts() {
  const sql = getDb()
  return sql`
    SELECT id, title, slug, thumbnail_url, created_at
    FROM posts
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 8
  `
}

export default async function HomePage() {
  const featured = await getFeaturedPost()
  const posts = await getRecentPosts(featured?.id)
  const latest = await getLatestPosts()

  const hasPosts = featured || posts.length > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {!hasPosts && (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
            Welcome to Fronteira Geek
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mb-8">
            No posts published yet. Head to the admin panel to create your first article.
          </p>
          <a
            href="/admin"
            className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Admin
          </a>
        </div>
      )}

      {hasPosts && (
        <>
          {featured && (
            <section className="mb-10">
              <HeroPost post={featured} />
            </section>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              {posts.length > 0 && (
                <section>
                  <h2 className="font-heading text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-accent rounded-full" aria-hidden="true" />
                    Recent Posts
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {posts.map((post: Record<string, unknown>) => (
                      <PostCard key={post.id as number} post={post as never} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="lg:w-80 shrink-0 flex flex-col gap-8">
              {latest.length > 0 && <LatestSidebar posts={latest as never[]} />}
              <NewsletterForm />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
