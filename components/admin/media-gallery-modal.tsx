"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { X, Search, Upload, Loader2, Check } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface MediaItem {
  id: number
  url: string
  filename: string
  mimetype: string
  size: number
  created_at: string
}

interface MediaGalleryModalProps {
  onSelect: (url: string) => void
  onClose: () => void
}

export function MediaGalleryModal({ onSelect, onClose }: MediaGalleryModalProps) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, mutate } = useSWR(
    `/api/admin/media?page=${page}&search=${encodeURIComponent(debouncedSearch)}`,
    fetcher
  )

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return
      setUploading(true)
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData })
          const result = await res.json()
          if (result.url) {
            setSelected(result.url)
          }
        } catch (err) {
          console.error("Upload error:", err)
        }
      }
      setUploading(false)
      mutate()
      e.target.value = ""
    },
    [mutate]
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const mediaItems: MediaItem[] = data?.media || []
  const totalPages = data?.totalPages || 1

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="min-w-0 w-full max-w-4xl max-h-[calc(100dvh-2rem)] sm:max-h-[85dvh] bg-card border border-border rounded-xl shadow-2xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="font-heading text-lg font-bold text-foreground">Media Gallery</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Upload */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-border shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="shrink-0 inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors cursor-pointer">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={handleUpload}
            />
          </label>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {mediaItems.length > 0 ? (
            <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {mediaItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.url)}
                  className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selected === item.url
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img
                    src={item.url || "/placeholder.svg"}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                  {selected === item.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="p-1 bg-primary rounded-full">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-foreground truncate">{item.filename}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="text-muted-foreground text-sm">
                {search ? "No results found." : "No media uploaded yet. Upload images to get started."}
              </p>
            </div>
          )}
        </div>

        {/* Pagination & Select */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-border shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {totalPages > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/80 transition-colors disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs rounded hover:bg-secondary/80 transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Insert Selected
          </button>
        </div>
      </div>
    </div>
  )
}
