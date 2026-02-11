"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import useSWR from "swr"
import { Upload, Copy, Check, Loader2, Trash2, Search } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface MediaItem {
  id: number
  url: string
  filename: string
  mimetype: string
  size: number
  created_at: string
}

export default function AdminMediaPage() {
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, mutate, isLoading } = useSWR(
    `/api/admin/media?page=${page}&search=${encodeURIComponent(debouncedSearch)}`,
    fetcher
  )

  const mediaItems: MediaItem[] = data?.media || []
  const totalPages = data?.totalPages || 1
  const total = data?.total || 0

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files
      if (!fileList) return
      setUploading(true)
      for (const file of Array.from(fileList)) {
        const formData = new FormData()
        formData.append("file", file)
        try {
          await fetch("/api/upload", { method: "POST", body: formData })
        } catch (error) {
          console.error("Upload error:", error)
        }
      }
      setUploading(false)
      mutate()
      e.target.value = ""
    },
    [mutate]
  )

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.filename}"? This cannot be undone.`)) return
    setDeleting(item.id)
    try {
      await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, url: item.url }),
      })
      mutate()
    } catch (error) {
      console.error("Delete error:", error)
    } finally {
      setDeleting(null)
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} file{total !== 1 ? "s" : ""} uploaded</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload Files
          <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
        </label>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files by name..."
          className="w-full max-w-md pl-9 pr-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : mediaItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaItems.map((item) => (
            <div key={item.id} className="group bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img src={item.url || "/placeholder.svg"} alt={item.filename} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyUrl(item.url)}
                    className="p-2 bg-card/90 border border-border rounded-md text-foreground hover:text-primary transition-colors"
                    title="Copy URL"
                  >
                    {copied === item.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deleting === item.id}
                    className="p-2 bg-card/90 border border-border rounded-md text-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-foreground truncate">{item.filename}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatSize(item.size)} &middot; {formatDate(item.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-16 text-sm">
          {search ? "No files match your search." : "No media uploaded yet. Upload images to get started."}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
