import { getDb } from "@/lib/db"
import { HeroPost, type HeroPostProps } from "@/components/hero-post"
import { PostCard } from "@/components/post-card"
import { LatestSidebar } from "@/components/latest-sidebar"
import { NewsletterForm } from "@/components/newsletter-form"

export const dynamic = "force-dynamic"

async function getFeaturedPost() {
  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           u.name as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.status = 'published' AND p.featured = true
    ORDER BY p.created_at DESC
    LIMIT 1
  `
  return (posts[0] as HeroPostProps["post"] | undefined) || null
}

async function getRecentPosts(excludeId?: number) {
  const sql = getDb()
  if (excludeId) {
    return sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
             u.name as author_name, u.avatar_url as author_avatar
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published' AND p.id != ${excludeId}
      ORDER BY p.created_at DESC
      LIMIT 12
    `
  }
  return sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           u.name as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
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
            Bem-vindo ao Fronteira Geek
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Nenhum post publicado ainda. Volte em breve para as ultimas noticias geek.
          </p>
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
                    Posts Recentes
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
