"use client"

import React from "react"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Trash2, Plus } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminCategoriesPage() {
  const { data, isLoading } = useSWR("/api/admin/categories", fetcher)
  const { data: session } = useSWR('/api/auth/session', fetcher)
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    })
    setName("")
    setCreating(false)
    mutate("/api/admin/categories")
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta categoria?")) return
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
    mutate("/api/admin/categories")
  }

  if (!session?.user) return <p className="text-muted-foreground">Carregando acesso...</p>
  if (session.user.role !== 'ADMIN') return <p role="alert">Acesso exclusivo do administrador.</p>

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Categorias</h1>

      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row sm:items-end gap-3 mb-8">
        <div className="flex min-w-0 flex-col gap-1.5 flex-1 max-w-sm">
          <label htmlFor="catname" className="text-sm font-medium text-foreground">Nova Categoria</label>
          <input
            id="catname"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nome da categoria"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </button>
      </form>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {data?.categories?.map((cat: { id: number; name: string; slug: string }) => (
            <div key={cat.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-secondary"
                aria-label={`Excluir ${cat.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
