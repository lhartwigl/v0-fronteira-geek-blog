import { getDb } from "@/lib/db"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Clock, ArrowLeft } from "lucide-react"
import { timeAgo } from "@/lib/format"
import { PostCard } from "@/components/post-card"
import { TrackClick } from "@/components/track-click"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sql = getDb()
  const posts = await sql`
    SELECT p.*, c.name as category_name
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ${slug} AND p.status = 'published'
  `
  const post = posts[0]
  if (!post) return { title: "Post Not Found" }
  return {
    title: post.title as string,
    description: (post.meta_description || post.excerpt || "") as string,
    openGraph: {
      title: post.title as string,
      description: (post.meta_description || post.excerpt || "") as string,
      images: post.hero_image_url ? [{ url: post.hero_image_url as string }] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const sql = getDb()

  const posts = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug,
           u.name as author_name, u.avatar_url as author_avatar, u.bio as author_bio
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.slug = ${slug} AND p.status = 'published'
  `

  const post = posts[0]
  if (!post) notFound()

  const related = await sql`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM posts p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'published'
      AND p.id != ${post.id}
      AND p.category_id = ${post.category_id}
    ORDER BY p.created_at DESC
    LIMIT 3
  `

  const imageUrl = (post.hero_image_url || post.thumbnail_url) as string | null

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <TrackClick postId={post.id as number} />
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      {post.category_name && (
        <Link
          href={`/category/${post.category_slug}`}
          className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded mb-4"
        >
          {post.category_name as string}
        </Link>
      )}

      <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance mb-4">
        {post.title as string}
      </h1>

      {/* Author byline */}
      <div className="flex items-center gap-4 mb-8">
        {post.author_name && (
          <div className="flex items-center gap-3">
            {post.author_avatar ? (
              <img
                src={post.author_avatar as string}
                alt={post.author_name as string}
                className="h-10 w-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center text-sm font-bold text-muted-foreground">
                {(post.author_name as string).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{post.author_name as string}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.reading_time as number} min read
                </span>
                <span>{timeAgo(post.created_at as string)}</span>
              </div>
            </div>
          </div>
        )}
        {!post.author_name && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time as number} min read
            </span>
            <span>{timeAgo(post.created_at as string)}</span>
          </div>
        )}
      </div>

      {imageUrl && (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-8">
          <Image
            src={imageUrl}
            alt={post.title as string}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      )}

      <div
        className="prose prose-invert prose-lg max-w-none
          prose-headings:font-heading prose-headings:text-foreground
          prose-p:text-muted-foreground prose-p:leading-relaxed
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-foreground
          prose-code:text-primary prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
          prose-img:rounded-lg
          [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:border-0
          [&_u]:underline [&_u]:decoration-primary/50"
        dangerouslySetInnerHTML={{ __html: post.content as string }}
      />

      {(post.tags as string[])?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
          {(post.tags as string[]).map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-16 pt-8 border-t border-border">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-accent rounded-full" aria-hidden="true" />
            Related Posts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p: Record<string, unknown>) => (
              <PostCard key={p.id as number} post={p as never} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
