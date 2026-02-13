"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Upload, Sparkles, Loader2, X } from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface PostData {
  id?: number
  title: string
  content: string
  excerpt: string
  thumbnail_url: string
  hero_image_url: string
  category_id: number | null
  featured: boolean
  status: string
  meta_description: string
  tags: string[]
}

interface PostEditorProps {
  initialData?: PostData
  postId?: number
}

export function PostEditor({ initialData, postId }: PostEditorProps) {
  const router = useRouter()
  const { data: catData } = useSWR("/api/admin/categories", fetcher)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState("")

  const [form, setForm] = useState<PostData>({
    title: "",
    content: "",
    excerpt: "",
    thumbnail_url: "",
    hero_image_url: "",
    category_id: null,
    featured: false,
    status: "draft",
    meta_description: "",
    tags: [],
    ...initialData,
  })

  useEffect(() => {
    if (initialData) {
      setForm({ ...form, ...initialData })
      setTagsInput((initialData.tags || []).join(", "))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData])

  function updateField<K extends keyof PostData>(key: K, value: PostData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleUpload(field: "thumbnail_url" | "hero_image_url", file: File) {
    setUploading(field)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        updateField(field, data.url)
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(null)
    }
  }

  const handleAIGenerate = useCallback(async () => {
    if (!form.title) {
      alert("Por favor, insira um titulo primeiro.")
      return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, categoryName: catData?.categories?.find((c: { id: number }) => c.id === form.category_id)?.name }),
      })
      const data = await res.json()
      if (data.content) updateField("content", data.content)
      if (data.excerpt) updateField("excerpt", data.excerpt)
      if (data.meta_description) updateField("meta_description", data.meta_description)
      if (data.tags) {
        updateField("tags", data.tags)
        setTagsInput(data.tags.join(", "))
      }
    } catch (error) {
      console.error("AI generation error:", error)
    } finally {
      setGenerating(false)
    }
  }, [form.title, form.category_id, catData])

  async function handleSave(status?: string) {
    setSaving(true)
    const payload = {
      ...form,
      status: status || form.status,
      tags: tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean),
    }

    try {
      const url = postId ? `/api/admin/posts/${postId}` : "/api/admin/posts"
      const method = postId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push("/admin/posts")
        router.refresh()
      }
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-foreground">Titulo</label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="px-3 py-2.5 bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base font-heading"
          placeholder="Digite o titulo do post..."
        />
      </div>

      {/* AI Generate */}
      <button
        type="button"
        onClick={handleAIGenerate}
        disabled={generating || !form.title}
        className="self-start flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {generating ? "Gerando com IA..." : "Gerar com IA"}
      </button>

      {/* Category & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-foreground">Categoria</label>
          <select
            id="category"
            value={form.category_id || ""}
            onChange={(e) => updateField("category_id", e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sem categoria</option>
            {catData?.categories?.map((cat: { id: number; name: string }) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium text-foreground">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Featured */}
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => updateField("featured", e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary"
        />
        Featured post (shows in hero section)
      </label>

      {/* Image Uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageUpload
          label="Thumbnail"
          value={form.thumbnail_url}
          uploading={uploading === "thumbnail_url"}
          onUpload={(file) => handleUpload("thumbnail_url", file)}
          onChange={(val) => updateField("thumbnail_url", val)}
        />
        <ImageUpload
          label="Hero Image"
          value={form.hero_image_url}
          uploading={uploading === "hero_image_url"}
          onUpload={(file) => handleUpload("hero_image_url", file)}
          onChange={(val) => updateField("hero_image_url", val)}
        />
      </div>

      {/* Excerpt */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="excerpt" className="text-sm font-medium text-foreground">Excerpt</label>
        <textarea
          id="excerpt"
          rows={3}
          value={form.excerpt}
          onChange={(e) => updateField("excerpt", e.target.value)}
          className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          placeholder="Brief description of the post..."
        />
      </div>

      {/* Content - Rich Text Editor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Content</label>
        <RichTextEditor content={form.content} onChange={(html) => updateField("content", html)} />
      </div>

      {/* Meta Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="meta" className="text-sm font-medium text-foreground">Meta Description</label>
        <textarea
          id="meta"
          rows={2}
          value={form.meta_description}
          onChange={(e) => updateField("meta_description", e.target.value)}
          className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          placeholder="SEO meta description..."
        />
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tags" className="text-sm font-medium text-foreground">Tags (comma separated)</label>
        <input
          id="tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="anime, review, news"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={saving}
          className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave("published")}
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Publish"}
        </button>
      </div>
    </div>
  )
}

function ImageUpload({
  label,
  value,
  uploading,
  onUpload,
  onChange,
}: {
  label: string
  value: string
  uploading: boolean
  onUpload: (file: File) => void
  onChange: (val: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>

      {/* Preview with remove button */}
      {value && (
        <div className="relative w-full aspect-video rounded-md overflow-hidden border border-border bg-secondary">
          <img
            src={value}
            alt={`${label} preview`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 bg-background/80 border border-border rounded-md text-foreground hover:text-destructive hover:bg-background transition-colors"
            title={`Remove ${label.toLowerCase()}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Image URL..."
        />
        <label className="shrink-0 flex items-center gap-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
            }}
          />
        </label>
      </div>
    </div>
  )
}
