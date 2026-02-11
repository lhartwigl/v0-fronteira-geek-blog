import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"
import { timeAgo } from "@/lib/format"

interface PostCardProps {
  post: {
    id: number
    title: string
    slug: string
    excerpt: string | null
    thumbnail_url: string | null
    category_name: string | null
    category_slug: string | null
    reading_time: number
    created_at: string
  }
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/post/${post.slug}`} className="group flex flex-col rounded-lg overflow-hidden bg-card border border-border hover:border-primary/40 transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        {post.thumbnail_url ? (
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary flex items-center justify-center">
            <span className="text-3xl text-muted-foreground font-heading">FG</span>
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        {post.category_name && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {post.category_name}
          </span>
        )}
        <h3 className="font-heading text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
        )}
        <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.reading_time} min
          </span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
