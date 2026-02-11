"use client"

import React from "react"

import { useState } from "react"
import { Upload, Copy, Check, Loader2 } from "lucide-react"

export default function AdminMediaPage() {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<{ url: string; name: string }[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files
    if (!fileList) return

    setUploading(true)
    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        const data = await res.json()
        if (data.url) {
          setFiles((prev) => [{ url: data.url, name: file.name }, ...prev])
        }
      } catch (error) {
        console.error("Upload error:", error)
      }
    }
    setUploading(false)
    e.target.value = ""
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Media</h1>

      <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors cursor-pointer mb-8">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Upload Files
        <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div key={file.url} className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <img src={file.url || "/placeholder.svg"} alt={file.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                <button
                  type="button"
                  onClick={() => copyUrl(file.url)}
                  className="shrink-0 p-1.5 text-muted-foreground hover:text-primary transition-colors rounded"
                  aria-label="Copy URL"
                >
                  {copied === file.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && !uploading && (
        <p className="text-muted-foreground text-center py-12">
          Upload images to use in your posts.
        </p>
      )}
    </div>
  )
}
