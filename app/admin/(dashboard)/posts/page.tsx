"use client"

import useSWR, { mutate } from "swr"
import Link from "next/link"
import Image from "next/image"
import { Pencil, Trash2, Plus, MousePointerClick } from "lucide-react"
import { timeAgo } from "@/lib/format"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminPostsPage() {
  const { data, isLoading } = useSWR("/api/admin/posts", fetcher)
  const { data: sessionData } = useSWR('/api/auth/session', fetcher)

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir este post?")) return
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" })
    mutate("/api/admin/posts")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Posts</h1>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Post
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Carregando posts...</p>
      ) : !data?.posts?.length ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhum post ainda.</p>
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            Crie seu primeiro post
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed md:table-auto">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Post</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Categoria</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">Autor</th>
                  <th className="w-24 md:w-auto text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden sm:table-cell">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden lg:table-cell">Data</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden lg:table-cell">Cliques</th>
                  <th className="w-28 md:w-auto text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-3 sm:p-4">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.posts.map((post: Record<string, unknown>) => (
                  <tr key={post.id as number} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block relative w-12 h-12 rounded overflow-hidden shrink-0 bg-secondary">
                          {post.thumbnail_url ? (
                            <Image
                              src={post.thumbnail_url as string}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">FG</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground break-words line-clamp-3 sm:line-clamp-none sm:truncate sm:max-w-xs">
                            {post.title as string}
                          </p>
                          <p className="sm:hidden mt-1 text-xs text-muted-foreground break-words">{post.status === "published" ? "Publicado" : "Rascunho"}{post.category_name ? ` · ${post.category_name}` : ""}</p>
                          {Boolean(post.featured) && (
                            <span className="text-xs text-accent font-medium">Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{(post.category_name as string) || "-"}</span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        {post.author_avatar ? (
                          <img src={post.author_avatar as string} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {(post.author_name as string)?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">{(post.author_name as string) || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          post.status === "published"
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {post.status as string}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{timeAgo(post.created_at as string)}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {((post.clicks as number) || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-right">
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        {(sessionData?.user?.role === 'ADMIN' || post.status === 'draft') && <>
                        <Link
                          href={`/admin/posts/${post.id}/edit`}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-secondary"
                          aria-label="Edit post"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id as number)}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-secondary"
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
