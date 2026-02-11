"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { PostCard } from "@/components/post-card"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading } = useSWR(
    debouncedQuery ? `/api/posts?search=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Search</h1>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
          autoFocus
        />
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-center py-8">Searching...</p>
      )}

      {data?.posts && data.posts.length === 0 && debouncedQuery && (
        <p className="text-muted-foreground text-center py-8">
          No results found for &ldquo;{debouncedQuery}&rdquo;
        </p>
      )}

      {data?.posts && data.posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data.posts.map((post: Record<string, unknown>) => (
            <PostCard key={post.id as number} post={post as never} />
          ))}
        </div>
      )}
    </div>
  )
}
