"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Upload, Loader2, Save, User, X } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminProfilePage() {
  const { data: profile, mutate, isLoading } = useSWR("/api/admin/profile", fetcher)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const currentName = name ?? profile?.name ?? ""
  const currentBio = bio ?? profile?.bio ?? ""
  const currentAvatar = avatarUrl ?? profile?.avatar_url ?? ""

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) setAvatarUrl(data.url)
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentName,
          bio: currentBio,
          avatar_url: currentAvatar,
        }),
      })
      if (res.ok) {
        mutate()
        setName(null)
        setBio(null)
        setAvatarUrl(null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Author Profile</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Your name and photo are displayed on every post you create.
      </p>

      {success && (
        <div className="mb-6 px-4 py-3 rounded-md bg-primary/10 border border-primary/30 text-sm text-primary">
          Profile updated successfully.
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Avatar */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-foreground">Profile Picture</span>
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0 rounded-full bg-secondary border border-border overflow-hidden">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground hover:bg-secondary/80 transition-colors cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} />
              </label>
              {currentAvatar && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">Display Name</label>
          <input
            id="name"
            type="text"
            value={currentName}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name as it appears on posts"
          />
        </div>

        {/* Email (read-only) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="text"
            value={profile?.email ?? ""}
            disabled
            className="px-3 py-2 bg-muted border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-foreground">Biography</label>
          <textarea
            id="bio"
            rows={4}
            value={currentBio}
            onChange={(e) => setBio(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y leading-relaxed"
            placeholder="A brief bio about yourself..."
          />
          <p className="text-xs text-muted-foreground">{currentBio.length}/300 characters</p>
        </div>

        {/* Save */}
        <div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !currentName.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}
