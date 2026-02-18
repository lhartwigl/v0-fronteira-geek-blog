"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Upload, Loader2, Save, User, X, Lock, Eye, EyeOff } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminProfilePage() {
  const { data: profile, mutate, isLoading } = useSWR("/api/admin/profile", fetcher)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState("")
  const [name, setName] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

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
    setSuccess("")
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
        setSuccess("profile")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (error) {
      console.error("Save error:", error)
    } finally {
      setSaving(false)
    }
  }

  function validatePassword(): boolean {
    setPasswordError("")
    if (!currentPassword) {
      setPasswordError("Informe a senha atual.")
      return false
    }
    if (newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.")
      return false
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas nao coincidem.")
      return false
    }
    if (currentPassword === newPassword) {
      setPasswordError("A nova senha deve ser diferente da atual.")
      return false
    }
    return true
  }

  async function handlePasswordChange() {
    if (!validatePassword()) return
    setChangingPassword(true)
    setPasswordError("")
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPasswordError(data.error || "Erro ao alterar a senha.")
        return
      }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSuccess("password")
      setTimeout(() => setSuccess(""), 3000)
    } catch {
      setPasswordError("Erro ao alterar a senha.")
    } finally {
      setChangingPassword(false)
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
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Perfil do Autor</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Seu nome e foto sao exibidos em cada post que voce cria.
      </p>

      {success === "profile" && (
        <div className="mb-6 px-4 py-3 rounded-md bg-primary/10 border border-primary/30 text-sm text-primary">
          Perfil atualizado com sucesso.
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Avatar */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-foreground">Foto de Perfil</span>
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
                Enviar
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} />
              </label>
              {currentAvatar && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">Nome de Exibicao</label>
          <input
            id="name"
            type="text"
            value={currentName}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Seu nome como aparece nos posts"
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
          <p className="text-xs text-muted-foreground">O email nao pode ser alterado.</p>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-foreground">Biografia</label>
          <textarea
            id="bio"
            rows={4}
            value={currentBio}
            onChange={(e) => setBio(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y leading-relaxed"
            placeholder="Uma breve biografia sobre voce..."
          />
          <p className="text-xs text-muted-foreground">{currentBio.length}/300 caracteres</p>
        </div>

        {/* Save Profile */}
        <div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !currentName.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Perfil
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border my-10" />

      {/* Password Change Section */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Atualize sua senha de acesso ao painel administrativo.
          </p>
        </div>

        {success === "password" && (
          <div className="px-4 py-3 rounded-md bg-primary/10 border border-primary/30 text-sm text-primary">
            Senha alterada com sucesso.
          </div>
        )}

        {passwordError && (
          <div className="px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {passwordError}
          </div>
        )}

        {/* Current Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="current-password" className="text-sm font-medium text-foreground">Senha Atual</label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrentPw ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Digite sua senha atual"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrentPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-foreground">Nova Senha</label>
          <div className="relative">
            <input
              id="new-password"
              type={showNewPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Minimo de 6 caracteres"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNewPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 6 && (
            <p className="text-xs text-destructive">A senha deve ter pelo menos 6 caracteres.</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirmar Nova Senha</label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Repita a nova senha"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPw ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive">As senhas nao coincidem.</p>
          )}
        </div>

        {/* Change Password Button */}
        <div>
          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  )
}
