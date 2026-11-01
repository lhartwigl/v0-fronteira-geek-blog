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
  const { data: sessionData } = useSWR('/api/auth/session', fetcher)
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
    if (!confirm(`Excluir "${item.filename}"? Esta acao nao pode ser desfeita.`)) return
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
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Biblioteca de Midia</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} arquivo{total !== 1 ? "s" : ""} enviado{total !== 1 ? "s" : ""}</p>
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Enviar Arquivos
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
          placeholder="Buscar arquivos por nome..."
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
                <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                <div className="media-actions absolute inset-0 bg-background/60 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyUrl(item.url)}
                    className="flex h-11 w-11 items-center justify-center bg-card/90 border border-border rounded-md text-foreground hover:text-primary transition-colors"
                    title="Copiar URL"
                  >
                    {copied === item.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  {sessionData?.user?.role === 'ADMIN' && <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={deleting === item.id}
                    className="flex h-11 w-11 items-center justify-center bg-card/90 border border-border rounded-md text-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Excluir"
                  >
                    {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>}
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
          {search ? "Nenhum arquivo corresponde a sua busca." : "Nenhuma midia enviada ainda. Envie imagens para comecar."}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-40"
          >
            Proxima
          </button>
        </div>
      )}
    </div>
  )
}
