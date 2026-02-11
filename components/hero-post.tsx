import Link from "next/link"
import Image from "next/image"
import { Clock } from "lucide-react"

interface HeroPostProps {
  post: {
    id: number
    title: string
    slug: string
    excerpt: string | null
    hero_image_url: string | null
    thumbnail_url: string | null
    category_name: string | null
    category_slug: string | null
    reading_time: number
    created_at: string
  }
}

export function HeroPost({ post }: HeroPostProps) {
  const imageUrl = post.hero_image_url || post.thumbnail_url

  return (
    <Link href={`/post/${post.slug}`} className="group block relative rounded-lg overflow-hidden aspect-[21/9] min-h-[320px]">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary flex items-center justify-center">
          <span className="text-5xl font-heading font-bold text-muted-foreground/30">FG</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        {post.category_name && (
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded mb-3">
            {post.category_name}
          </span>
        )}
        <h2 className="font-heading text-2xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance max-w-3xl">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mt-3 text-sm md:text-base text-muted-foreground line-clamp-2 max-w-2xl">
            {post.excerpt}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{post.reading_time} min read</span>
        </div>
      </div>
    </Link>
  )
}
