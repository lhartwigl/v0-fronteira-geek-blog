import Link from "next/link"
import Image from "next/image"
import { timeAgo } from "@/lib/format"

interface LatestPost {
  id: number
  title: string
  slug: string
  thumbnail_url: string | null
  created_at: string
}

export function LatestSidebar({ posts }: { posts: LatestPost[] }) {
  return (
    <aside className="w-full">
      <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full" aria-hidden="true" />
        Latest
      </h2>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className="group flex items-start gap-3"
          >
            <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
              {post.thumbnail_url ? (
                <Image
                  src={post.thumbnail_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">FG</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  )
}
